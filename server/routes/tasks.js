import express from 'express';
import db from '../database.js';
import { sendTaskToOpenClaw } from '../services/openclaw.js';

const router = express.Router();

// Get all tasks for authenticated user
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT id, title, description, status, priority, tags, estimated_hours,
                 result_url, created_at, updated_at, completed_at,
                 openclaw_session_id
          FROM tasks 
          WHERE user_id = ? 
          ORDER BY created_at DESC`, 
    [userId], (err, tasks) => {
      if (err) {
        console.error('Error fetching tasks:', err);
        return res.status(500).json({ error: 'Failed to fetch tasks' });
      }
      
      // Parse tags for each task
      const tasksWithParsedTags = tasks.map(task => {
        let parsedTags = null;
        if (task.tags) {
          try {
            parsedTags = JSON.parse(task.tags);
          } catch (e) {
            console.error('Error parsing task tags:', e);
          }
        }
        
        return {
          ...task,
          tags: parsedTags
        };
      });
      
      res.json({ tasks: tasksWithParsedTags });
    });
});

// Create new task
router.post('/', async (req, res) => {
  const { title, description, priority = 'medium', status = 'backlog', tags, estimated_hours } = req.body;
  const userId = req.user.id;
  
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Convert tags array to JSON string for storage
  const tagsJson = tags && Array.isArray(tags) ? JSON.stringify(tags) : null;

  try {
    // Insert task into database
    db.run(`INSERT INTO tasks (user_id, title, description, priority, status, tags, estimated_hours) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, title.trim(), description?.trim() || null, priority, status, tagsJson, estimated_hours || null], 
      function(err) {
        if (err) {
          console.error('Error creating task:', err);
          return res.status(500).json({ error: 'Failed to create task' });
        }
        
        const taskId = this.lastID;
        
        // Get the created task
        db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
          if (err) {
            console.error('Error fetching created task:', err);
            return res.status(500).json({ error: 'Task created but failed to fetch details' });
          }
          
          // Parse tags back to array
          let parsedTags = null;
          if (task.tags) {
            try {
              parsedTags = JSON.parse(task.tags);
            } catch (e) {
              console.error('Error parsing task tags:', e);
            }
          }
          
          res.status(201).json({ 
            task: {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              priority: task.priority,
              tags: parsedTags,
              estimated_hours: task.estimated_hours,
              created_at: task.created_at,
              updated_at: task.updated_at
            }
          });
        });
      });
  } catch (error) {
    console.error('Error in task creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task status (move through pipeline)
router.put('/:taskId/status', async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;
  const userId = req.user.id;
  
  const validStatuses = ['backlog', 'new', 'in_progress', 'built', 'failed'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Check if task belongs to user
    db.get('SELECT * FROM tasks WHERE id = ? AND user_id = ?', 
      [taskId, userId], async (err, task) => {
        if (err) {
          console.error('Error fetching task:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
        
        // If moving to "in_progress", try to send to OpenClaw (optional)
        if (status === 'in_progress' && task.status !== 'in_progress') {
          // Check if OpenClaw is configured
          if (req.user.openclaw_endpoint) {
            try {
              const sessionId = await sendTaskToOpenClaw(req.user, task);
              
              // Update task with OpenClaw session ID
              db.run(`UPDATE tasks SET 
                       status = ?, openclaw_session_id = ?, updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?`,
                [status, sessionId, taskId], (err) => {
                  if (err) {
                    console.error('Error updating task with OpenClaw session:', err);
                    return res.status(500).json({ error: 'Failed to update task' });
                  }
                  
                  res.json({ 
                    task: {
                      ...task,
                      status,
                      openclaw_session_id: sessionId,
                      updated_at: new Date().toISOString()
                    }
                  });
                });
            } catch (openclawError) {
              console.error('OpenClaw integration error:', openclawError);
              
              // Still update status to in_progress, but without OpenClaw session
              // This allows the UI to work even if OpenClaw is misconfigured
              db.run(`UPDATE tasks SET 
                       status = ?, updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?`,
                [status, taskId], (err) => {
                  if (err) {
                    console.error('Error updating task status:', err);
                    return res.status(500).json({ error: 'Failed to update task status' });
                  }
                  
                  res.json({ 
                    task: {
                      ...task,
                      status,
                      updated_at: new Date().toISOString()
                    },
                    warning: 'Task moved to in_progress, but OpenClaw integration failed'
                  });
                });
            }
          } else {
            // No OpenClaw configured - just update status
            db.run(`UPDATE tasks SET 
                     status = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
              [status, taskId], (err) => {
                if (err) {
                  console.error('Error updating task status:', err);
                  return res.status(500).json({ error: 'Failed to update task status' });
                }
                
                res.json({ 
                  task: {
                    ...task,
                    status,
                    updated_at: new Date().toISOString()
                  },
                  info: 'Task moved to in_progress. Configure OpenClaw for automated processing.'
                });
              });
          }
        } else {
          // Normal status update
          const completedAt = status === 'built' ? new Date().toISOString() : null;
          
          db.run(`UPDATE tasks SET 
                   status = ?, updated_at = CURRENT_TIMESTAMP,
                   completed_at = COALESCE(?, completed_at)
                   WHERE id = ?`,
            [status, completedAt, taskId], (err) => {
              if (err) {
                console.error('Error updating task status:', err);
                return res.status(500).json({ error: 'Failed to update task status' });
              }
              
              res.json({ 
                task: {
                  ...task,
                  status,
                  completed_at: completedAt || task.completed_at,
                  updated_at: new Date().toISOString()
                }
              });
            });
        }
      });
  } catch (error) {
    console.error('Error in task status update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get task details
router.get('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  
  db.get(`SELECT * FROM tasks WHERE id = ? AND user_id = ?`, 
    [taskId, userId], (err, task) => {
      if (err) {
        console.error('Error fetching task:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ task });
    });
});

// Delete task
router.delete('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const userId = req.user.id;
  
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', 
    [taskId, userId], function(err) {
      if (err) {
        console.error('Error deleting task:', err);
        return res.status(500).json({ error: 'Failed to delete task' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      res.json({ success: true });
    });
});

// Update task details
router.put('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const { title, description, priority } = req.body;
  const userId = req.user.id;
  
  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Invalid priority' });
  }
  
  db.run(`UPDATE tasks SET 
           title = ?, description = ?, priority = COALESCE(?, priority),
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`,
    [title.trim(), description?.trim() || null, priority, taskId, userId], 
    function(err) {
      if (err) {
        console.error('Error updating task:', err);
        return res.status(500).json({ error: 'Failed to update task' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      // Return updated task
      db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
        if (err) {
          console.error('Error fetching updated task:', err);
          return res.status(500).json({ error: 'Task updated but failed to fetch details' });
        }
        
        res.json({ task });
      });
    });
});

// Get task statistics
router.get('/stats/summary', (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT 
            status,
            COUNT(*) as count,
            AVG(CASE 
              WHEN completed_at IS NOT NULL 
              THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60 
              ELSE NULL 
            END) as avg_completion_time_minutes
          FROM tasks 
          WHERE user_id = ? 
          GROUP BY status`,
    [userId], (err, stats) => {
      if (err) {
        console.error('Error fetching task stats:', err);
        return res.status(500).json({ error: 'Failed to fetch statistics' });
      }
      
      // Get total completed today
      db.get(`SELECT COUNT(*) as completed_today
              FROM tasks 
              WHERE user_id = ? 
                AND status = 'built'
                AND date(completed_at) = date('now')`,
        [userId], (err, todayStats) => {
          if (err) {
            console.error('Error fetching today stats:', err);
            return res.status(500).json({ error: 'Failed to fetch today statistics' });
          }
          
          res.json({ 
            stats: stats.reduce((acc, stat) => {
              acc[stat.status] = {
                count: stat.count,
                avg_completion_time_minutes: stat.avg_completion_time_minutes
              };
              return acc;
            }, {}),
            completed_today: todayStats.completed_today || 0
          });
        });
    });
});

export default router;