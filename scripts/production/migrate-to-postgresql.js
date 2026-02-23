#!/usr/bin/env node

/**
 * Mission Control - SQLite to PostgreSQL Migration Script
 * 
 * This script migrates all data from the SQLite development database
 * to a PostgreSQL production database.
 * 
 * Usage:
 *   node scripts/production/migrate-to-postgresql.js
 * 
 * Environment Variables Required:
 *   DATABASE_URL - PostgreSQL connection string
 *   SQLITE_DB_PATH - Path to SQLite database (default: ./server/mission-control.db)
 */

const sqlite3 = require('sqlite3');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

class DatabaseMigration {
    constructor() {
        this.sqliteDbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../../server/mission-control.db');
        this.postgresUrl = process.env.DATABASE_URL;
        
        if (!this.postgresUrl) {
            console.error('❌ DATABASE_URL environment variable is required');
            process.exit(1);
        }
        
        if (!fs.existsSync(this.sqliteDbPath)) {
            console.error(`❌ SQLite database not found at: ${this.sqliteDbPath}`);
            process.exit(1);
        }
        
        this.sqliteDb = null;
        this.pgClient = null;
    }
    
    async connect() {
        console.log('🔗 Connecting to databases...');
        
        // Connect to SQLite
        this.sqliteDb = new sqlite3.Database(this.sqliteDbPath, sqlite3.OPEN_READONLY);
        console.log(`✅ Connected to SQLite: ${this.sqliteDbPath}`);
        
        // Connect to PostgreSQL
        this.pgClient = new Client({
            connectionString: this.postgresUrl,
            ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
        });
        
        await this.pgClient.connect();
        console.log('✅ Connected to PostgreSQL');
    }
    
    async disconnect() {
        if (this.sqliteDb) {
            this.sqliteDb.close();
            console.log('✅ SQLite connection closed');
        }
        
        if (this.pgClient) {
            await this.pgClient.end();
            console.log('✅ PostgreSQL connection closed');
        }
    }
    
    async getSqliteData(tableName) {
        return new Promise((resolve, reject) => {
            this.sqliteDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }
    
    async truncatePostgresTable(tableName) {
        await this.pgClient.query(`TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE`);
        console.log(`🗑️  Truncated ${tableName} table`);
    }
    
    async migrateUsers() {
        console.log('\n👥 Migrating users...');
        
        const users = await this.getSqliteData('users');
        console.log(`📊 Found ${users.length} users in SQLite`);
        
        if (users.length === 0) {
            console.log('⚠️  No users to migrate');
            return;
        }
        
        await this.truncatePostgresTable('users');
        
        for (const user of users) {
            const query = `
                INSERT INTO users (
                    id, email, name, avatar_url, provider, provider_id,
                    openclaw_endpoint, openclaw_token, settings, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;
            
            const values = [
                user.id,
                user.email,
                user.name,
                user.avatar_url,
                user.provider,
                user.provider_id,
                user.openclaw_endpoint,
                user.openclaw_token,
                user.settings || '{}',
                user.created_at,
                user.updated_at
            ];
            
            await this.pgClient.query(query, values);
        }
        
        // Update sequence to match the highest ID
        const maxId = Math.max(...users.map(u => u.id));
        await this.pgClient.query(`SELECT setval('users_id_seq', $1)`, [maxId]);
        
        console.log(`✅ Migrated ${users.length} users`);
    }
    
    async migrateTasks() {
        console.log('\n📋 Migrating tasks...');
        
        const tasks = await this.getSqliteData('tasks');
        console.log(`📊 Found ${tasks.length} tasks in SQLite`);
        
        if (tasks.length === 0) {
            console.log('⚠️  No tasks to migrate');
            return;
        }
        
        await this.truncatePostgresTable('tasks');
        
        for (const task of tasks) {
            const query = `
                INSERT INTO tasks (
                    id, user_id, title, description, status, priority, tags,
                    openclaw_session_id, result_url, result_data,
                    created_at, updated_at, completed_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            
            // Parse tags from SQLite (stored as JSON string) to JSONB
            let tags = null;
            if (task.tags) {
                try {
                    tags = JSON.stringify(JSON.parse(task.tags));
                } catch (e) {
                    console.warn(`⚠️  Invalid JSON in task ${task.id} tags: ${task.tags}`);
                    tags = null;
                }
            }
            
            const values = [
                task.id,
                task.user_id,
                task.title,
                task.description,
                task.status,
                task.priority,
                tags,
                task.openclaw_session_id,
                task.result_url,
                task.result_data,
                task.created_at,
                task.updated_at,
                task.completed_at
            ];
            
            await this.pgClient.query(query, values);
        }
        
        // Update sequence to match the highest ID
        const maxId = Math.max(...tasks.map(t => t.id));
        await this.pgClient.query(`SELECT setval('tasks_id_seq', $1)`, [maxId]);
        
        console.log(`✅ Migrated ${tasks.length} tasks`);
    }
    
    async migrateSessions() {
        console.log('\n🔐 Migrating sessions...');
        
        const sessions = await this.getSqliteData('sessions');
        console.log(`📊 Found ${sessions.length} sessions in SQLite`);
        
        if (sessions.length === 0) {
            console.log('⚠️  No sessions to migrate');
            return;
        }
        
        await this.truncatePostgresTable('sessions');
        
        for (const session of sessions) {
            // Skip expired sessions
            const expiresAt = new Date(session.expires_at);
            if (expiresAt < new Date()) {
                continue;
            }
            
            const query = `
                INSERT INTO sessions (id, user_id, data, expires_at, created_at)
                VALUES ($1, $2, $3, $4, $5)
            `;
            
            const values = [
                session.id,
                session.user_id,
                session.data,
                session.expires_at,
                session.created_at
            ];
            
            await this.pgClient.query(query, values);
        }
        
        console.log(`✅ Migrated ${sessions.filter(s => new Date(s.expires_at) >= new Date()).length} valid sessions`);
    }
    
    async migrateOAuthStates() {
        console.log('\n🔑 Migrating OAuth states...');
        
        const states = await this.getSqliteData('oauth_states');
        console.log(`📊 Found ${states.length} OAuth states in SQLite`);
        
        if (states.length === 0) {
            console.log('⚠️  No OAuth states to migrate');
            return;
        }
        
        await this.truncatePostgresTable('oauth_states');
        
        for (const state of states) {
            // Skip old states (older than 10 minutes)
            const createdAt = new Date(state.created_at);
            const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
            if (createdAt < tenMinutesAgo) {
                continue;
            }
            
            const query = `
                INSERT INTO oauth_states (state, provider, created_at)
                VALUES ($1, $2, $3)
            `;
            
            const values = [
                state.state,
                state.provider,
                state.created_at
            ];
            
            await this.pgClient.query(query, values);
        }
        
        console.log(`✅ Migrated ${states.filter(s => new Date(s.created_at) >= new Date(Date.now() - 10 * 60 * 1000)).length} valid OAuth states`);
    }
    
    async validateMigration() {
        console.log('\n🔍 Validating migration...');
        
        const tables = ['users', 'tasks', 'sessions', 'oauth_states'];
        
        for (const table of tables) {
            const sqliteCount = await this.getSqliteData(table);
            const pgResult = await this.pgClient.query(`SELECT COUNT(*) FROM ${table}`);
            const pgCount = parseInt(pgResult.rows[0].count);
            
            console.log(`📊 ${table}: SQLite=${sqliteCount.length}, PostgreSQL=${pgCount}`);
            
            if (table === 'sessions' || table === 'oauth_states') {
                // These tables may have fewer records due to cleanup of expired data
                console.log(`ℹ️  ${table}: Expired records were cleaned up during migration`);
            } else if (sqliteCount.length !== pgCount) {
                console.error(`❌ Mismatch in ${table} count!`);
                throw new Error(`Migration validation failed for ${table}`);
            }
        }
        
        console.log('✅ Migration validation passed!');
    }
    
    async run() {
        const startTime = Date.now();
        
        try {
            console.log('🚀 Starting Mission Control database migration');
            console.log(`📂 SQLite DB: ${this.sqliteDbPath}`);
            console.log(`🐘 PostgreSQL: ${this.postgresUrl.replace(/:\/\/.*@/, '://***@')}`);
            
            await this.connect();
            
            await this.migrateUsers();
            await this.migrateTasks();
            await this.migrateSessions();
            await this.migrateOAuthStates();
            
            await this.validateMigration();
            
            const duration = Math.round((Date.now() - startTime) / 1000);
            console.log(`\n🎉 Migration completed successfully in ${duration}s!`);
            console.log('📝 Next steps:');
            console.log('   1. Update your .env.production with DATABASE_URL');
            console.log('   2. Test the application with the new database');
            console.log('   3. Keep SQLite backup for rollback if needed');
            
        } catch (error) {
            console.error('\n❌ Migration failed:', error.message);
            console.error(error.stack);
            process.exit(1);
        } finally {
            await this.disconnect();
        }
    }
}

// Run migration if called directly
if (require.main === module) {
    const migration = new DatabaseMigration();
    migration.run().catch(console.error);
}

module.exports = DatabaseMigration;