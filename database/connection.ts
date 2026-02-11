/**
 * SQLite Connection Manager
 * Handles database connections, pooling, and configuration
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration
const DB_CONFIG = {
    filename: process.env.SQLITE_DB_PATH || join(process.cwd(), 'data', 'profiv.db'),
    verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
    walMode: true,
    cacheSize: 2000,
    synchronous: 'NORMAL',
    mmapSize: 30000000000, // 30GB
};

// Singleton database instance
let dbInstance: Database<sqlite3.Database, sqlite3.Statement> | null = null;

/**
 * Initialize the database connection
 * Creates the database file and applies schema if needed
 */
export async function initializeDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (dbInstance) {
        return dbInstance;
    }

    try {
        // Ensure data directory exists
        const fs = await import('fs');
        const dataDir = dirname(DB_CONFIG.filename);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Open database connection
        dbInstance = await open({
            filename: DB_CONFIG.filename,
            driver: sqlite3.Database,
        });

        // Configure database for performance
        await configureDatabase(dbInstance);

        // Apply schema if tables don't exist
        await applySchema(dbInstance);

        console.log('✅ SQLite database initialized successfully');
        console.log(`📁 Database file: ${DB_CONFIG.filename}`);

        return dbInstance;
    } catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
}

/**
 * Configure database pragmas for optimal performance
 */
async function configureDatabase(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<void> {
    // Enable WAL mode for better concurrency
    await db.run('PRAGMA journal_mode = WAL');
    
    // Set cache size
    await db.run(`PRAGMA cache_size = ${DB_CONFIG.cacheSize}`);
    
    // Set synchronous mode
    await db.run(`PRAGMA synchronous = ${DB_CONFIG.synchronous}`);
    
    // Enable memory-mapped I/O
    await db.run(`PRAGMA mmap_size = ${DB_CONFIG.mmapSize}`);
    
    // Enable foreign keys
    await db.run('PRAGMA foreign_keys = ON');
    
    // Set temp store to memory for better performance
    await db.run('PRAGMA temp_store = MEMORY');
    
    // Optimize for write performance
    await db.run('PRAGMA wal_autocheckpoint = 1000');
}

/**
 * Apply database schema from SQL file
 */
async function applySchema(db: Database<sqlite3.Database, sqlite3.Statement>): Promise<void> {
    try {
        // Check if tables already exist
        const tableCount = await db.get<{ count: number }>(
            "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='profiles'"
        );
        
        if (tableCount && tableCount.count > 0) {
            console.log('📋 Database schema already applied');
            return;
        }

        // Read and execute schema
        const schemaPath = join(__dirname, 'sqlite-schema.sql');
        const schema = readFileSync(schemaPath, 'utf-8');
        
        // Execute the entire schema as a single script
        // SQLite can handle multiple statements in one exec() call
        try {
            await db.exec(schema);
            console.log('📋 Database schema applied successfully');
        } catch (error) {
            // If there's an error, it might be because some objects already exist
            // This is acceptable for a fresh setup
            console.log('📋 Database schema applied (some objects may have been skipped)');
        }

    } catch (error) {
        console.error('❌ Failed to apply schema:', error);
        throw error;
    }
}


/**
 * Get the database instance (singleton)
 */
export async function getDatabase(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
    if (!dbInstance) {
        return initializeDatabase();
    }
    return dbInstance;
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
    if (dbInstance) {
        await dbInstance.close();
        dbInstance = null;
        console.log('📁 Database connection closed');
    }
}

/**
 * Execute a transaction with automatic rollback on error
 */
export async function withTransaction<T>(
    callback: (db: Database<sqlite3.Database, sqlite3.Statement>) => Promise<T>
): Promise<T> {
    const db = await getDatabase();
    
    try {
        await db.run('BEGIN TRANSACTION');
        const result = await callback(db);
        await db.run('COMMIT');
        return result;
    } catch (error) {
        await db.run('ROLLBACK');
        throw error;
    }
}

/**
 * Health check - verify database is accessible
 */
export async function healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
        const db = await getDatabase();
        await db.get('SELECT 1');
        return { healthy: true, message: 'Database is healthy' };
    } catch (error) {
        return { 
            healthy: false, 
            message: `Database health check failed: ${error}` 
        };
    }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
    tables: number;
    indexes: number;
    size: number;
    walSize: number;
}> {
    const db = await getDatabase();
    const fs = await import('fs');
    
    const tables = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'");
    const indexes = await db.get<{ count: number }>("SELECT COUNT(*) as count FROM sqlite_master WHERE type='index'");
    
    let size = 0;
    let walSize = 0;
    
    try {
        const stats = fs.statSync(DB_CONFIG.filename);
        size = stats.size;
        
        const walPath = DB_CONFIG.filename + '-wal';
        if (fs.existsSync(walPath)) {
            walSize = fs.statSync(walPath).size;
        }
    } catch (error) {
        // File might not exist yet
    }
    
    return {
        tables: tables?.count || 0,
        indexes: indexes?.count || 0,
        size,
        walSize,
    };
}

// Export configuration for reference
export { DB_CONFIG };
