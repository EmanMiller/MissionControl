import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'mission-control.db');

const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON');
    try {
      await initializeDatabase();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    }
  }
});

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        provider TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        openclaw_endpoint TEXT,
        openclaw_token TEXT,
        settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tasks table
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'backlog',
        priority TEXT DEFAULT 'medium',
        tags TEXT,
        assigned_agent_id TEXT,
        processing_metrics TEXT,
        openclaw_session_id TEXT,
        result_url TEXT,
        result_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // Agents table for dynamic agent tracking
      `CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'general',
        status TEXT DEFAULT 'idle',
        capabilities TEXT,
        current_task_id INTEGER,
        performance_stats TEXT DEFAULT '{}',
        last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
        FOREIGN KEY (current_task_id) REFERENCES tasks (id) ON DELETE SET NULL
      )`,

      // Sessions table for OAuth state management
      `CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER,
        data TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )`,

      // OAuth states table
      `CREATE TABLE IF NOT EXISTS oauth_states (
        state TEXT PRIMARY KEY,
        provider TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    let hasError = false;

    tables.forEach((sql) => {
      db.run(sql, (err) => {
        if (err && !hasError) {
          hasError = true;
          console.error('Error creating table:', err.message);
          reject(err);
          return;
        }
        
        completed++;
        if (completed === tables.length && !hasError) {
          // Create indexes after all tables are created
          const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
            'CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id)',
            'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)',
            'CREATE INDEX IF NOT EXISTS idx_oauth_states_created ON oauth_states(created_at)'
          ];

          let indexCompleted = 0;
          indexes.forEach((sql) => {
            db.run(sql, (err) => {
              if (err) console.error('Error creating index:', err.message);
              indexCompleted++;
              if (indexCompleted === indexes.length) {
                // Run migrations after indexes are created
                runMigrations().then(() => {
                  console.log('Database initialized successfully');
                  resolve();
                }).catch((err) => {
                  console.error('Migration failed:', err);
                  resolve(); // Don't fail initialization for migration issues
                });
              }
            });
          });
        }
      });
    });
  });
}

// Run database migrations
function runMigrations() {
  return new Promise((resolve) => {
    const migrations = [
      // Migration: Add tags column to tasks table
      {
        name: 'add_tags_to_tasks',
        sql: 'ALTER TABLE tasks ADD COLUMN tags TEXT'
      },
      // Migration: Add estimated_hours column to tasks table
      {
        name: 'add_estimated_hours_to_tasks',
        sql: 'ALTER TABLE tasks ADD COLUMN estimated_hours REAL'
      },
      // Migration: Add openclaw_id column to agents table
      {
        name: 'add_openclaw_id_to_agents',
        sql: 'ALTER TABLE agents ADD COLUMN openclaw_id TEXT'
      }
    ];

    let completed = 0;
    
    migrations.forEach((migration) => {
      // Determine table name from migration SQL
      let tableName = 'tasks'; // default
      if (migration.sql.includes('agents')) {
        tableName = 'agents';
      }
      
      // Check if column already exists
      db.all(`PRAGMA table_info(${tableName})`, (err, columns) => {
        if (err) {
          console.error(`Migration ${migration.name} failed:`, err);
          completed++;
          if (completed === migrations.length) resolve();
          return;
        }

        // Extract column name from migration (assumes ADD COLUMN syntax)
        const columnMatch = migration.sql.match(/ADD COLUMN (\w+)/);
        const columnName = columnMatch ? columnMatch[1] : null;
        
        const hasColumn = columnName && columns.some(col => col.name === columnName);
        
        if (!hasColumn && columnName) {
          db.run(migration.sql, (err) => {
            if (err) {
              console.error(`Migration ${migration.name} failed:`, err);
            } else {
              console.log(`Migration ${migration.name} completed successfully`);
            }
            completed++;
            if (completed === migrations.length) resolve();
          });
        } else {
          console.log(`Migration ${migration.name} already applied`);
          completed++;
          if (completed === migrations.length) resolve();
        }
      });
    });
  });
}

// Clean up expired sessions and OAuth states
function cleanupExpiredData() {
  const now = new Date().toISOString();
  
  db.run('DELETE FROM sessions WHERE expires_at < ?', [now]);
  db.run('DELETE FROM oauth_states WHERE datetime(created_at, "+10 minutes") < datetime("now")');
}

// Run cleanup every hour
setInterval(cleanupExpiredData, 60 * 60 * 1000);

export default db;