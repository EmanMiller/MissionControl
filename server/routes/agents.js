import express from 'express';
import db from '../database.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all agents for authenticated user
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT a.*, t.title as current_task_title
          FROM agents a
          LEFT JOIN tasks t ON a.current_task_id = t.id
          WHERE a.user_id = ? 
          ORDER BY a.created_at DESC`, 
    [userId], (err, agents) => {
      if (err) {
        console.error('Error fetching agents:', err);
        return res.status(500).json({ error: 'Failed to fetch agents' });
      }
      
      // Parse JSON fields for each agent
      const agentsWithParsedData = agents.map(agent => {
        let capabilities = null;
        let performanceStats = null;
        
        if (agent.capabilities) {
          try { capabilities = JSON.parse(agent.capabilities); } catch (e) { /* ignore */ }
        }
        
        if (agent.performance_stats) {
          try { performanceStats = JSON.parse(agent.performance_stats); } catch (e) { /* ignore */ }
        }
        
        return {
          ...agent,
          capabilities,
          performance_stats: performanceStats
        };
      });
      
      res.json({ agents: agentsWithParsedData });
    });
});

// Create new agent
router.post('/', async (req, res) => {
  const { name, type = 'general', capabilities = [] } = req.body;
  const userId = req.user.id;
  const agentId = uuidv4();
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Agent name is required' });
  }

  const capabilitiesJson = Array.isArray(capabilities) ? JSON.stringify(capabilities) : '[]';
  const defaultStats = JSON.stringify({
    tasksCompleted: 0,
    successRate: 0,
    averageResponseTime: 0,
    totalCost: 0
  });

  try {
    db.run(`INSERT INTO agents (id, user_id, name, type, capabilities, performance_stats) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [agentId, userId, name.trim(), type, capabilitiesJson, defaultStats], 
      function(err) {
        if (err) {
          console.error('Error creating agent:', err);
          return res.status(500).json({ error: 'Failed to create agent' });
        }
        
        // Get the created agent
        db.get('SELECT * FROM agents WHERE id = ?', [agentId], (err, agent) => {
          if (err) {
            console.error('Error fetching created agent:', err);
            return res.status(500).json({ error: 'Agent created but failed to fetch details' });
          }
          
          // Parse JSON fields
          let parsedCapabilities = null;
          let parsedStats = null;
          
          if (agent.capabilities) {
            try { parsedCapabilities = JSON.parse(agent.capabilities); } catch (e) { /* ignore */ }
          }
          
          if (agent.performance_stats) {
            try { parsedStats = JSON.parse(agent.performance_stats); } catch (e) { /* ignore */ }
          }
          
          res.status(201).json({ 
            agent: {
              ...agent,
              capabilities: parsedCapabilities,
              performance_stats: parsedStats
            }
          });
        });
      });
  } catch (error) {
    console.error('Error in agent creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update agent status
router.put('/:agentId/status', async (req, res) => {
  const { agentId } = req.params;
  const { status, currentTaskId = null } = req.body;
  const userId = req.user.id;
  
  const validStatuses = ['idle', 'working', 'error', 'offline'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.run(`UPDATE agents SET 
           status = ?, 
           current_task_id = ?,
           last_heartbeat = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
    [status, currentTaskId, agentId, userId], function(err) {
      if (err) {
        console.error('Error updating agent status:', err);
        return res.status(500).json({ error: 'Failed to update agent' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json({ message: 'Agent status updated successfully' });
    });
});

// Update agent performance stats
router.put('/:agentId/stats', async (req, res) => {
  const { agentId } = req.params;
  const { stats } = req.body;
  const userId = req.user.id;
  
  if (!stats || typeof stats !== 'object') {
    return res.status(400).json({ error: 'Performance stats object required' });
  }

  const statsJson = JSON.stringify(stats);

  db.run(`UPDATE agents SET 
           performance_stats = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
    [statsJson, agentId, userId], function(err) {
      if (err) {
        console.error('Error updating agent stats:', err);
        return res.status(500).json({ error: 'Failed to update agent stats' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Agent not found' });
      }
      
      res.json({ message: 'Agent stats updated successfully' });
    });
});

// Delete agent
router.delete('/:agentId', async (req, res) => {
  const { agentId } = req.params;
  const userId = req.user.id;
  
  db.run('DELETE FROM agents WHERE id = ? AND user_id = ?', [agentId, userId], function(err) {
    if (err) {
      console.error('Error deleting agent:', err);
      return res.status(500).json({ error: 'Failed to delete agent' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    res.json({ message: 'Agent deleted successfully' });
  });
});

export default router;