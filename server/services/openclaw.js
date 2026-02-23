import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import db from '../database.js';

// Default OpenClaw endpoints if not configured
const DEFAULT_OPENCLAW_ENDPOINT = 'http://localhost:18789';

function baseUrl(endpoint) {
  if (!endpoint) return endpoint;
  return String(endpoint).replace(/\/+$/, '');
}

export async function testOpenClawConnection(endpoint, token) {
  const base = baseUrl(endpoint);
  try {
    // Validate URL format first
    if (!endpoint || typeof endpoint !== 'string') {
      throw new Error('Invalid endpoint URL');
    }

    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${base}/api/status`, {
      headers,
      timeout: 10000 // 10 second timeout
    });
    
    // Validate that this is actually an OpenClaw instance
    // OpenClaw should return specific fields in its status response
    if (!response.data) {
      throw new Error('Invalid response from endpoint - not an OpenClaw instance');
    }

    // Check for OpenClaw-specific status indicators
    const isOpenClaw = 
      response.data.hasOwnProperty('status') && 
      (response.data.version || response.data.service === 'openclaw' || response.data.name === 'OpenClaw');

    if (!isOpenClaw) {
      throw new Error('Endpoint is not a valid OpenClaw instance');
    }
    
    return {
      success: true,
      version: response.data.version || 'unknown',
      status: response.data.status || 'ok',
      service: response.data.service || 'openclaw'
    };
  } catch (error) {
    console.error('OpenClaw connection test failed:', error.message);
    
    // Provide more helpful error messages
    let errorMessage = error.message;
    if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Connection refused - OpenClaw is not running at this URL';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Host not found - please check the URL';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Connection timed out - OpenClaw may not be responding';
    }
    
    return {
      success: false,
      error: errorMessage,
      code: error.code
    };
  }
}

export async function sendTaskToOpenClaw(user, task) {
  const endpoint = user.openclaw_endpoint || DEFAULT_OPENCLAW_ENDPOINT;
  const base = baseUrl(endpoint);
  const token = user.openclaw_token;
  
  if (!base) {
    throw new Error('OpenClaw endpoint not configured');
  }
  
  try {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Create a detailed prompt for the AI agent
    const prompt = createTaskPrompt(task);
    
    // Send task to OpenClaw
    const response = await axios.post(`${base}/api/sessions`, {
      message: prompt,
      session_key: `mission-control-${task.id}-${uuidv4()}`,
      metadata: {
        source: 'mission-control',
        task_id: task.id,
        priority: task.priority,
        created_at: task.created_at
      }
    }, {
      headers,
      timeout: 30000 // 30 second timeout
    });
    
    const sessionId = response.data.session_id || response.data.sessionId;
    
    if (!sessionId) {
      throw new Error('OpenClaw did not return a session ID');
    }
    
    console.log(`Task ${task.id} sent to OpenClaw with session ${sessionId}`);
    return sessionId;
    
  } catch (error) {
    console.error('Failed to send task to OpenClaw:', error);
    
    if (error.response) {
      throw new Error(`OpenClaw API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Cannot reach OpenClaw instance - check endpoint and network connectivity');
    } else {
      throw new Error(`OpenClaw integration error: ${error.message}`);
    }
  }
}

export async function getOpenClawSessionStatus(user, sessionId) {
  const endpoint = user.openclaw_endpoint || DEFAULT_OPENCLAW_ENDPOINT;
  const base = baseUrl(endpoint);
  const token = user.openclaw_token;
  
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${base}/api/sessions/${sessionId}`, {
      headers,
      timeout: 10000
    });
    
    return response.data;
    
  } catch (error) {
    console.error(`Failed to get OpenClaw session status for ${sessionId}:`, error);
    throw error;
  }
}

export async function getOpenClawSessionHistory(user, sessionId) {
  const endpoint = user.openclaw_endpoint || DEFAULT_OPENCLAW_ENDPOINT;
  const base = baseUrl(endpoint);
  const token = user.openclaw_token;
  
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.get(`${base}/api/sessions/${sessionId}/history`, {
      headers,
      timeout: 10000
    });
    
    return response.data;
    
  } catch (error) {
    console.error(`Failed to get OpenClaw session history for ${sessionId}:`, error);
    throw error;
  }
}

function createTaskPrompt(task) {
  let prompt = `Mission Control Task: ${task.title}\n\n`;
  
  if (task.description) {
    prompt += `Description: ${task.description}\n\n`;
  }
  
  prompt += `Priority: ${task.priority}\n`;
  prompt += `Task ID: ${task.id}\n\n`;
  
  prompt += `Please complete this task and provide detailed output. `;
  prompt += `When finished, include a summary of what was accomplished and any deliverables created.\n\n`;
  
  // Add context based on priority
  if (task.priority === 'high') {
    prompt += `This is a HIGH PRIORITY task. Please prioritize this work.\n\n`;
  }
  
  prompt += `Please structure your response with:
1. Understanding of the task
2. Approach and methodology 
3. Execution and implementation
4. Results and deliverables
5. Summary and next steps (if any)

Begin working on this task now.`;
  
  return prompt;
}

// Webhook handler for OpenClaw completion notifications
export function handleOpenClawWebhook(webhookData) {
  return new Promise((resolve, reject) => {
    try {
      const { session_id, status, metadata, result } = webhookData;
      
      if (!session_id) {
        return reject(new Error('No session ID in webhook data'));
      }
      
      // Find task by OpenClaw session ID
      db.get('SELECT * FROM tasks WHERE openclaw_session_id = ?', 
        [session_id], (err, task) => {
          if (err) {
            return reject(new Error(`Database error: ${err.message}`));
          }
          
          if (!task) {
            console.log(`No task found for OpenClaw session ${session_id}`);
            return resolve(null);
          }
          
          // Update task based on webhook status
          let newStatus = task.status;
          let resultData = null;
          let completedAt = null;
          
          if (status === 'completed' || status === 'finished') {
            newStatus = 'built';
            completedAt = new Date().toISOString();
            resultData = JSON.stringify(result || {});
          } else if (status === 'failed' || status === 'error') {
            newStatus = 'failed';
            resultData = JSON.stringify({ error: result?.error || 'Unknown error' });
          }
          
          // Update task in database
          db.run(`UPDATE tasks SET 
                   status = ?, result_data = ?, completed_at = COALESCE(?, completed_at),
                   updated_at = CURRENT_TIMESTAMP
                   WHERE id = ?`,
            [newStatus, resultData, completedAt, task.id], (err) => {
              if (err) {
                return reject(new Error(`Failed to update task: ${err.message}`));
              }
              
              console.log(`Task ${task.id} updated via webhook: ${newStatus}`);
              resolve({
                task_id: task.id,
                old_status: task.status,
                new_status: newStatus
              });
            });
        });
    } catch (error) {
      reject(error);
    }
  });
}

// Periodic task to check on in-progress OpenClaw sessions
export async function pollOpenClawSessions() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT t.*, u.openclaw_endpoint, u.openclaw_token 
            FROM tasks t
            JOIN users u ON t.user_id = u.id
            WHERE t.status = 'in_progress' 
              AND t.openclaw_session_id IS NOT NULL
              AND datetime(t.updated_at, '+5 minutes') < datetime('now')`,
      async (err, tasks) => {
        if (err) {
          return reject(err);
        }
        
        console.log(`Polling ${tasks.length} in-progress OpenClaw sessions`);
        
        for (const task of tasks) {
          try {
            const user = {
              openclaw_endpoint: task.openclaw_endpoint,
              openclaw_token: task.openclaw_token
            };
            
            const status = await getOpenClawSessionStatus(user, task.openclaw_session_id);
            
            // Check if session is complete
            if (status.completed || status.status === 'completed') {
              const history = await getOpenClawSessionHistory(user, task.openclaw_session_id);
              
              // Update task as completed
              db.run(`UPDATE tasks SET 
                       status = 'built', 
                       result_data = ?, 
                       completed_at = CURRENT_TIMESTAMP,
                       updated_at = CURRENT_TIMESTAMP
                       WHERE id = ?`,
                [JSON.stringify(history), task.id], (err) => {
                  if (err) {
                    console.error(`Failed to update completed task ${task.id}:`, err);
                  } else {
                    console.log(`Task ${task.id} marked as completed via polling`);
                  }
                });
            }
            
            // Update last checked time
            db.run('UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [task.id]);
            
          } catch (error) {
            console.error(`Failed to poll OpenClaw session for task ${task.id}:`, error);
          }
        }
        
        resolve(tasks.length);
      });
  });
}