import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get current user profile
router.get('/profile', (req, res) => {
  const userId = req.user.id;
  
  db.get(`SELECT id, email, name, avatar_url, provider, openclaw_endpoint,
                 settings, created_at, updated_at
          FROM users 
          WHERE id = ?`, 
    [userId], (err, user) => {
      if (err) {
        console.error('Error fetching user profile:', err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Parse settings JSON
      let settings = {};
      try {
        settings = user.settings ? JSON.parse(user.settings) : {};
      } catch (error) {
        console.error('Error parsing user settings:', error);
        settings = {};
      }
      
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          provider: user.provider,
          openclaw_connected: !!user.openclaw_endpoint,
          settings,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      });
    });
});

// Update user profile
router.put('/profile', (req, res) => {
  const { name, settings } = req.body;
  const userId = req.user.id;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Validate and stringify settings
  let settingsJson = '{}';
  if (settings && typeof settings === 'object') {
    try {
      settingsJson = JSON.stringify(settings);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid settings format' });
    }
  }
  
  db.run(`UPDATE users SET 
           name = ?, 
           settings = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
    [name.trim(), settingsJson, userId], function(err) {
      if (err) {
        console.error('Error updating user profile:', err);
        return res.status(500).json({ error: 'Failed to update profile' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return updated user data
      db.get(`SELECT id, email, name, avatar_url, provider, openclaw_endpoint,
                     settings, updated_at
              FROM users 
              WHERE id = ?`, 
        [userId], (err, user) => {
          if (err) {
            console.error('Error fetching updated user:', err);
            return res.status(500).json({ error: 'Profile updated but failed to fetch details' });
          }
          
          let settings = {};
          try {
            settings = user.settings ? JSON.parse(user.settings) : {};
          } catch (error) {
            settings = {};
          }
          
          res.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              avatar_url: user.avatar_url,
              provider: user.provider,
              openclaw_connected: !!user.openclaw_endpoint,
              settings,
              updated_at: user.updated_at
            }
          });
        });
    });
});

// Get user dashboard statistics
router.get('/dashboard', (req, res) => {
  const userId = req.user.id;
  
  // Get task counts by status
  db.all(`SELECT status, COUNT(*) as count
          FROM tasks 
          WHERE user_id = ? 
          GROUP BY status`,
    [userId], (err, statusCounts) => {
      if (err) {
        console.error('Error fetching task status counts:', err);
        return res.status(500).json({ error: 'Failed to fetch dashboard data' });
      }
      
      // Get completed tasks today
      db.get(`SELECT COUNT(*) as completed_today
              FROM tasks 
              WHERE user_id = ? 
                AND status = 'built'
                AND date(completed_at) = date('now')`,
        [userId], (err, todayCount) => {
          if (err) {
            console.error('Error fetching today completion count:', err);
            return res.status(500).json({ error: 'Failed to fetch today statistics' });
          }
          
          // Get recent activity (last 10 task updates)
          db.all(`SELECT id, title, status, updated_at
                  FROM tasks 
                  WHERE user_id = ? 
                  ORDER BY updated_at DESC
                  LIMIT 10`,
            [userId], (err, recentTasks) => {
              if (err) {
                console.error('Error fetching recent tasks:', err);
                return res.status(500).json({ error: 'Failed to fetch recent activity' });
              }
              
              // Format status counts
              const taskStats = statusCounts.reduce((acc, stat) => {
                acc[stat.status] = stat.count;
                return acc;
              }, {
                backlog: 0,
                new: 0,
                in_progress: 0,
                built: 0,
                failed: 0
              });
              
              res.json({
                task_stats: taskStats,
                total_tasks: Object.values(taskStats).reduce((a, b) => a + b, 0),
                completed_today: todayCount.completed_today || 0,
                recent_activity: recentTasks
              });
            });
        });
    });
});

// Delete user account
router.delete('/account', (req, res) => {
  const userId = req.user.id;
  
  // This will cascade delete tasks and sessions due to foreign key constraints
  db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
    if (err) {
      console.error('Error deleting user account:', err);
      return res.status(500).json({ error: 'Failed to delete account' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      success: true,
      message: 'Account deleted successfully'
    });
  });
});

// Get user activity feed
router.get('/activity', (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  
  db.all(`SELECT 
            id,
            title,
            status,
            priority,
            created_at,
            updated_at,
            completed_at,
            CASE 
              WHEN completed_at IS NOT NULL THEN 'completed'
              WHEN status = 'built' THEN 'built'
              WHEN status = 'in_progress' THEN 'started'
              WHEN status = 'new' THEN 'queued'
              ELSE 'created'
            END as activity_type
          FROM tasks 
          WHERE user_id = ? 
          ORDER BY 
            COALESCE(completed_at, updated_at, created_at) DESC
          LIMIT ? OFFSET ?`,
    [userId, limit, offset], (err, activities) => {
      if (err) {
        console.error('Error fetching user activity:', err);
        return res.status(500).json({ error: 'Failed to fetch activity feed' });
      }
      
      res.json({
        activities: activities.map(activity => ({
          id: activity.id,
          title: activity.title,
          status: activity.status,
          priority: activity.priority,
          activity_type: activity.activity_type,
          timestamp: activity.completed_at || activity.updated_at || activity.created_at
        })),
        pagination: {
          limit,
          offset,
          has_more: activities.length === limit
        }
      });
    });
});

export default router;