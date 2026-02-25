import express from 'express';
import db from '../database.js';

const router = express.Router();

// Get all projects for authenticated user
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT id, name, description, github_url, status, tags,
                 created_at, updated_at
          FROM projects 
          WHERE user_id = ? 
          ORDER BY created_at DESC`, 
    [userId], (err, projects) => {
      if (err) {
        console.error('Error fetching projects:', err);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      
      // Parse tags for each project
      const projectsWithParsedTags = projects.map(project => {
        let parsedTags = null;
        if (project.tags) {
          try {
            parsedTags = JSON.parse(project.tags);
          } catch (e) {
            console.error('Error parsing project tags:', e);
          }
        }
        
        return {
          ...project,
          tags: parsedTags
        };
      });
      
      res.json({ projects: projectsWithParsedTags });
    });
});

// Get project with task count
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.id;
  
  // Get project details
  db.get(`SELECT id, name, description, github_url, status, tags,
                 created_at, updated_at
          FROM projects 
          WHERE user_id = ? AND id = ?`, 
    [userId, projectId], (err, project) => {
      if (err) {
        console.error('Error fetching project:', err);
        return res.status(500).json({ error: 'Failed to fetch project' });
      }
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get task counts for this project
      db.all(`SELECT status, COUNT(*) as count
              FROM tasks 
              WHERE user_id = ? AND project_id = ?
              GROUP BY status`, 
        [userId, projectId], (err, taskCounts) => {
          if (err) {
            console.error('Error fetching task counts:', err);
            return res.status(500).json({ error: 'Failed to fetch task counts' });
          }

          // Calculate progress
          const counts = taskCounts.reduce((acc, row) => {
            acc[row.status] = row.count;
            return acc;
          }, { new: 0, in_progress: 0, built: 0 });

          const totalTasks = counts.new + counts.in_progress + counts.built;
          const completedTasks = counts.built;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          // Parse tags
          let parsedTags = null;
          if (project.tags) {
            try {
              parsedTags = JSON.parse(project.tags);
            } catch (e) {
              console.error('Error parsing project tags:', e);
            }
          }

          res.json({ 
            project: {
              ...project,
              tags: parsedTags,
              taskCounts: counts,
              totalTasks,
              completedTasks,
              progress
            }
          });
        });
    });
});

// Create new project
router.post('/', (req, res) => {
  const { name, description, github_url, status = 'active', tags } = req.body;
  const userId = req.user.id;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const tagsJson = tags ? JSON.stringify(tags) : null;
  
  db.run(`INSERT INTO projects (user_id, name, description, github_url, status, tags)
          VALUES (?, ?, ?, ?, ?, ?)`,
    [userId, name.trim(), description?.trim(), github_url?.trim(), status, tagsJson],
    function(err) {
      if (err) {
        console.error('Error creating project:', err);
        return res.status(500).json({ error: 'Failed to create project' });
      }
      
      // Return the created project
      db.get('SELECT * FROM projects WHERE id = ?', [this.lastID], (err, project) => {
        if (err) {
          console.error('Error fetching created project:', err);
          return res.status(500).json({ error: 'Project created but failed to retrieve' });
        }
        
        let parsedTags = null;
        if (project.tags) {
          try {
            parsedTags = JSON.parse(project.tags);
          } catch (e) {
            console.error('Error parsing project tags:', e);
          }
        }
        
        res.status(201).json({ 
          project: {
            ...project,
            tags: parsedTags
          }
        });
      });
    });
});

// Update project
router.put('/:id', (req, res) => {
  const { name, description, github_url, status, tags } = req.body;
  const userId = req.user.id;
  const projectId = req.params.id;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required' });
  }

  const tagsJson = tags ? JSON.stringify(tags) : null;
  
  db.run(`UPDATE projects 
          SET name = ?, description = ?, github_url = ?, status = ?, tags = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND id = ?`,
    [name.trim(), description?.trim(), github_url?.trim(), status, tagsJson, userId, projectId],
    function(err) {
      if (err) {
        console.error('Error updating project:', err);
        return res.status(500).json({ error: 'Failed to update project' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Return the updated project
      db.get('SELECT * FROM projects WHERE id = ?', [projectId], (err, project) => {
        if (err) {
          console.error('Error fetching updated project:', err);
          return res.status(500).json({ error: 'Project updated but failed to retrieve' });
        }
        
        let parsedTags = null;
        if (project.tags) {
          try {
            parsedTags = JSON.parse(project.tags);
          } catch (e) {
            console.error('Error parsing project tags:', e);
          }
        }
        
        res.json({ 
          project: {
            ...project,
            tags: parsedTags
          }
        });
      });
    });
});

// Delete project
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.id;
  
  db.run('DELETE FROM projects WHERE user_id = ? AND id = ?', [userId, projectId], function(err) {
    if (err) {
      console.error('Error deleting project:', err);
      return res.status(500).json({ error: 'Failed to delete project' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json({ message: 'Project deleted successfully' });
  });
});

// Get tasks for a specific project
router.get('/:id/tasks', (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.id;
  
  db.all(`SELECT id, title, description, status, priority, tags, estimated_hours,
                 created_at, updated_at, completed_at
          FROM tasks 
          WHERE user_id = ? AND project_id = ?
          ORDER BY created_at DESC`, 
    [userId, projectId], (err, tasks) => {
      if (err) {
        console.error('Error fetching project tasks:', err);
        return res.status(500).json({ error: 'Failed to fetch project tasks' });
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

export default router;