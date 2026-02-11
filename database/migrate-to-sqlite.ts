/**
 * Migration Script - Initialize SQLite Database
 * Sets up the database schema and verifies the migration
 */

import { initializeDatabase, getDatabaseStats, healthCheck } from './connection.js';
import { readFileSync } from 'fs';
import { join } from 'path';

async function main() {
    console.log('🚀 Starting SQLite migration...\n');

    try {
        // Step 1: Initialize database connection
        console.log('📁 Initializing database connection...');
        await initializeDatabase();
        console.log('✅ Database connection established\n');

        // Step 2: Health check
        console.log('🏥 Performing health check...');
        const health = await healthCheck();
        if (!health.healthy) {
            throw new Error(`Health check failed: ${health.message}`);
        }
        console.log('✅ Database is healthy\n');

        // Step 3: Get initial stats
        console.log('📊 Initial database stats:');
        const initialStats = await getDatabaseStats();
        console.log(`   Tables: ${initialStats.tables}`);
        console.log(`   Indexes: ${initialStats.indexes}`);
        console.log(`   Size: ${formatBytes(initialStats.size)}`);
        console.log(`   WAL Size: ${formatBytes(initialStats.walSize)}\n`);

        // Step 4: Verify schema exists
        console.log('🔍 Verifying database schema...');
        const db = await initializeDatabase();

        // Check if tables exist
        const tables = await db.all(`
            SELECT name FROM sqlite_master
            WHERE type='table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        const expectedTables = [
            'profiles',
            'system_config',
            'exercise_cache',
            'user_histories',
            'assignments',
            'quiz_submissions',
            'auth_users'
        ];

        const existingTables = tables.map(t => t.name);
        const missingTables = expectedTables.filter(t => !existingTables.includes(t));

        if (missingTables.length > 0) {
            throw new Error(`Missing tables: ${missingTables.join(', ')}`);
        }

        console.log('✅ All tables present:');
        tables.forEach(table => {
            console.log(`   - ${table.name}`);
        });
        console.log('');

        // Step 5: Verify indexes
        const indexes = await db.all(`
            SELECT name FROM sqlite_master
            WHERE type='index' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
        `);

        console.log('✅ Indexes created:');
        indexes.forEach(index => {
            console.log(`   - ${index.name}`);
        });
        console.log('');

        // Step 6: Test basic operations
        console.log('🧪 Testing basic operations...');

        // Test system_config
        const config = await db.get('SELECT * FROM system_config WHERE id = 1');
        if (!config) {
            throw new Error('System config not initialized');
        }
        console.log('   ✅ System config initialized');

        // Test views
        const views = await db.all(`
            SELECT name FROM sqlite_master
            WHERE type='view'
            ORDER BY name
        `);
        console.log(`   ✅ Views created: ${views.length}`);

        console.log('✅ All basic operations working\n');

        // Step 7: Final stats
        console.log('📊 Final database stats:');
        const finalStats = await getDatabaseStats();
        console.log(`   Tables: ${finalStats.tables}`);
        console.log(`   Indexes: ${finalStats.indexes}`);
        console.log(`   Size: ${formatBytes(finalStats.size)}`);
        console.log(`   WAL Size: ${formatBytes(finalStats.walSize)}\n`);

        console.log('🎉 Migration completed successfully!');
        console.log('📁 Database file: data/profiv.db');
        console.log('🔄 Ready for service refactoring');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run migration
main().catch(console.error);
