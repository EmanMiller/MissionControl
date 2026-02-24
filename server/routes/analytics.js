import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get overall analytics dashboard
router.get('/dashboard', (req, res) => {
  const userId = req.user.id;
  
  // Get metrics in parallel
  const queries = {
    totalAgents: new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM agents WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    
    activeAgents: new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM agents WHERE user_id = ? AND status = "working"', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    
    totalTasks: new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    
    completedTasks: new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "built"', [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    }),
    
    recentTaskActivity: new Promise((resolve, reject) => {
      db.all(`SELECT 
                DATE(created_at) as date, 
                COUNT(*) as created,
                COUNT(CASE WHEN status = 'built' THEN 1 END) as completed
              FROM tasks 
              WHERE user_id = ? AND created_at >= date('now', '-7 days')
              GROUP BY DATE(created_at)
              ORDER BY date DESC`, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    
    agentPerformance: new Promise((resolve, reject) => {
      db.all(`SELECT 
                a.id, a.name, a.type, a.status,
                a.performance_stats,
                COUNT(t.id) as total_tasks,
                COUNT(CASE WHEN t.status = 'built' THEN 1 END) as completed_tasks
              FROM agents a
              LEFT JOIN tasks t ON a.id = t.assigned_agent_id
              WHERE a.user_id = ?
              GROUP BY a.id, a.name, a.type, a.status, a.performance_stats
              ORDER BY completed_tasks DESC`, [userId], (err, rows) => {
        if (err) reject(err);
        else {
          // Parse performance stats
          const agents = rows.map(agent => {
            let performanceStats = {};
            if (agent.performance_stats) {
              try {
                performanceStats = JSON.parse(agent.performance_stats);
              } catch (e) {
                performanceStats = {};
              }
            }
            return { ...agent, performance_stats: performanceStats };
          });
          resolve(agents);
        }
      });
    })
  };

  Promise.all(Object.values(queries))
    .then(([totalAgents, activeAgents, totalTasks, completedTasks, recentActivity, agentPerformance]) => {
      // System information - this would normally come from OpenClaw API or config
      const systemInfo = {
        currentModel: "anthropic/claude-sonnet-4-20250514",
        defaultModel: "anthropic/claude-sonnet-4-20250514", 
        agentStatus: "online",
        lastUpdate: new Date().toISOString()
      };

      res.json({
        summary: {
          totalAgents,
          activeAgents,
          idleAgents: totalAgents - activeAgents,
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        },
        recentActivity,
        agentPerformance,
        systemInfo
      });
    })
    .catch(error => {
      console.error('Analytics query error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
    });
});

// Get agent-specific analytics
router.get('/agents/:agentId', (req, res) => {
  const { agentId } = req.params;
  const userId = req.user.id;

  // Verify agent ownership
  db.get('SELECT * FROM agents WHERE id = ? AND user_id = ?', [agentId, userId], (err, agent) => {
    if (err) {
      console.error('Error fetching agent:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    // Get detailed analytics for this agent
    db.all(`SELECT 
              t.id, t.title, t.status, t.priority,
              t.created_at, t.updated_at, t.completed_at,
              t.processing_metrics
            FROM tasks t
            WHERE t.assigned_agent_id = ? AND t.user_id = ?
            ORDER BY t.created_at DESC
            LIMIT 50`, [agentId, userId], (err, tasks) => {
      if (err) {
        console.error('Error fetching agent tasks:', err);
        return res.status(500).json({ error: 'Failed to fetch agent tasks' });
      }

      // Parse processing metrics and calculate stats
      const tasksWithMetrics = tasks.map(task => {
        let processingMetrics = null;
        if (task.processing_metrics) {
          try {
            processingMetrics = JSON.parse(task.processing_metrics);
          } catch (e) { /* ignore */ }
        }
        return { ...task, processing_metrics: processingMetrics };
      });

      // Calculate performance metrics
      const completedTasks = tasksWithMetrics.filter(t => t.status === 'built');
      const totalResponseTime = completedTasks.reduce((sum, task) => {
        if (task.completed_at && task.created_at) {
          const responseTime = new Date(task.completed_at) - new Date(task.created_at);
          return sum + responseTime;
        }
        return sum;
      }, 0);

      const avgResponseTime = completedTasks.length > 0 
        ? Math.round(totalResponseTime / completedTasks.length / 1000 / 60) // minutes
        : 0;

      // Parse existing performance stats
      let performanceStats = {};
      if (agent.performance_stats) {
        try {
          performanceStats = JSON.parse(agent.performance_stats);
        } catch (e) { /* ignore */ }
      }

      res.json({
        agent: {
          ...agent,
          performance_stats: performanceStats
        },
        metrics: {
          totalTasks: tasksWithMetrics.length,
          completedTasks: completedTasks.length,
          successRate: tasksWithMetrics.length > 0 
            ? Math.round((completedTasks.length / tasksWithMetrics.length) * 100)
            : 0,
          avgResponseTime,
          recentTasks: tasksWithMetrics.slice(0, 10)
        }
      });
    });
  });
});

// Update agent performance stats
router.post('/agents/:agentId/update-stats', (req, res) => {
  const { agentId } = req.params;
  const { metrics } = req.body;
  const userId = req.user.id;

  if (!metrics || typeof metrics !== 'object') {
    return res.status(400).json({ error: 'Valid metrics object required' });
  }

  // Get current stats and merge with new metrics
  db.get('SELECT performance_stats FROM agents WHERE id = ? AND user_id = ?', [agentId, userId], (err, agent) => {
    if (err || !agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    let currentStats = {};
    if (agent.performance_stats) {
      try {
        currentStats = JSON.parse(agent.performance_stats);
      } catch (e) { /* ignore */ }
    }

    const updatedStats = { ...currentStats, ...metrics };
    const statsJson = JSON.stringify(updatedStats);

    db.run('UPDATE agents SET performance_stats = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
      [statsJson, agentId, userId], function(updateErr) {
        if (updateErr) {
          console.error('Error updating agent stats:', updateErr);
          return res.status(500).json({ error: 'Failed to update stats' });
        }

        res.json({ 
          message: 'Stats updated successfully',
          stats: updatedStats
        });
      });
  });
});

export default router;