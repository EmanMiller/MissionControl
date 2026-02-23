import express from 'express';
import db from '../database.js';
import { testOpenClawConnection, handleOpenClawWebhook } from '../services/openclaw.js';

/** Normalize and validate OpenClaw endpoint: accept http(s) with host (domain or IP) and optional port. */
function normalizeOpenClawEndpoint(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const u = new URL(trimmed);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    if (!u.hostname) return null;
    const normalized = `${u.protocol}//${u.host}`;
    return normalized.replace(/\/+$/, '');
  } catch {
    return null;
  }
}

const router = express.Router();

// Get OpenClaw configuration for authenticated user
router.get('/config', (req, res) => {
  const userId = req.user.id;
  
  db.get('SELECT openclaw_endpoint, openclaw_token FROM users WHERE id = ?', 
    [userId], (err, user) => {
      if (err) {
        console.error('Error fetching OpenClaw config:', err);
        return res.status(500).json({ error: 'Failed to fetch configuration' });
      }
      
      res.json({
        endpoint: user?.openclaw_endpoint || null,
        token: user?.openclaw_token ? '***CONFIGURED***' : null,
        connected: !!(user?.openclaw_endpoint)
      });
    });
});

// Test OpenClaw connection
router.post('/test', async (req, res) => {
  const { endpoint, token } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }
  
  try {
    const result = await testOpenClawConnection(endpoint, token);
    res.json(result);
  } catch (error) {
    console.error('OpenClaw connection test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Connection test failed',
      details: error.message 
    });
  }
});

// Save OpenClaw configuration
router.post('/config', async (req, res) => {
  const { endpoint, token } = req.body;
  const userId = req.user.id;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  const normalized = normalizeOpenClawEndpoint(endpoint);
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid endpoint URL: use http or https with a host (e.g. http://127.0.0.1:18789 or http://192.168.1.5/)' });
  }
  
  try {
    // Test connection first
    const testResult = await testOpenClawConnection(normalized, token);
    
    if (!testResult.success) {
      return res.status(400).json({ 
        error: 'Connection test failed',
        details: testResult.error 
      });
    }
    
    // Save configuration (store normalized URL)
    db.run(`UPDATE users SET 
             openclaw_endpoint = ?, 
             openclaw_token = ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
      [normalized, token || null, userId], (err) => {
        if (err) {
          console.error('Error saving OpenClaw config:', err);
          return res.status(500).json({ error: 'Failed to save configuration' });
        }
        
        res.json({ 
          success: true,
          message: 'OpenClaw configuration saved successfully',
          test_result: testResult
        });
      });
    
  } catch (error) {
    console.error('OpenClaw configuration error:', error);
    res.status(500).json({ 
      error: 'Failed to configure OpenClaw',
      details: error.message 
    });
  }
});

// Remove OpenClaw configuration
router.delete('/config', (req, res) => {
  const userId = req.user.id;
  
  db.run(`UPDATE users SET 
           openclaw_endpoint = NULL, 
           openclaw_token = NULL,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
    [userId], (err) => {
      if (err) {
        console.error('Error removing OpenClaw config:', err);
        return res.status(500).json({ error: 'Failed to remove configuration' });
      }
      
      res.json({ success: true, message: 'OpenClaw configuration removed' });
    });
});

// Get OpenClaw status and statistics
router.get('/status', (req, res) => {
  const userId = req.user.id;
  
  // Get user's OpenClaw config
  db.get('SELECT openclaw_endpoint, openclaw_token FROM users WHERE id = ?', 
    [userId], async (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user?.openclaw_endpoint) {
        return res.json({
          connected: false,
          message: 'OpenClaw not configured'
        });
      }
      
      try {
        // Test current connection
        const connectionTest = await testOpenClawConnection(
          user.openclaw_endpoint, 
          user.openclaw_token
        );
        
        // Get task statistics
        db.all(`SELECT status, COUNT(*) as count
                FROM tasks 
                WHERE user_id = ? AND openclaw_session_id IS NOT NULL
                GROUP BY status`,
          [userId], (err, stats) => {
            if (err) {
              console.error('Error fetching task stats:', err);
              return res.status(500).json({ error: 'Failed to fetch statistics' });
            }
            
            const taskStats = stats.reduce((acc, stat) => {
              acc[stat.status] = stat.count;
              return acc;
            }, {});
            
            res.json({
              connected: connectionTest.success,
              endpoint: user.openclaw_endpoint,
              version: connectionTest.version,
              connection_status: connectionTest,
              task_stats: taskStats,
              total_openclaw_tasks: Object.values(taskStats).reduce((a, b) => a + b, 0)
            });
          });
        
      } catch (error) {
        console.error('OpenClaw status check error:', error);
        res.json({
          connected: false,
          endpoint: user.openclaw_endpoint,
          error: error.message
        });
      }
    });
});

// Webhook endpoint for OpenClaw completion notifications
// This endpoint should be called by OpenClaw when tasks complete
router.post('/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    
    console.log('Received OpenClaw webhook:', webhookData);
    
    // Validate webhook data
    if (!webhookData.session_id) {
      return res.status(400).json({ error: 'Missing session_id in webhook data' });
    }
    
    // Handle the webhook
    const result = await handleOpenClawWebhook(webhookData);
    
    if (result) {
      console.log(`Webhook processed: Task ${result.task_id} updated from ${result.old_status} to ${result.new_status}`);
      res.json({ success: true, result });
    } else {
      // No matching task found, but that's okay
      res.json({ success: true, message: 'No matching task found' });
    }
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      details: error.message 
    });
  }
});

// Get webhook URL for user configuration
router.get('/webhook-url', (req, res) => {
  const baseUrl = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  const webhookUrl = `${baseUrl}/api/openclaw/webhook`;
  
  res.json({ 
    webhook_url: webhookUrl,
    instructions: [
      'Configure your OpenClaw instance to send completion webhooks to this URL',
      'The webhook should include: session_id, status, metadata, and result',
      'Supported statuses: completed, finished, failed, error'
    ]
  });
});

export default router;