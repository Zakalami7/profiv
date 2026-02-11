/**
 * Database Adapter - Unified Interface
 * Replaces Supabase client with SQLite backend
 * Provides query builder pattern similar to Supabase
 */

import { getDatabase, withTransaction } from './connection.js';
import type { Database } from 'sqlite';
import type sqlite3 from 'sqlite3';

// Type definitions for query building
type QueryFilter = {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
    value: any;
};

type QueryOrder = {
    column: string;
    ascending?: boolean;
};

type QueryOptions = {
    select?: string[];
    filters?: QueryFilter[];
    order?: QueryOrder;
    limit?: number;
    single?: boolean;
};

// Result types matching Supabase patterns
export type DbResult<T> = {
    data: T | null;
    error: Error | null;
};

export type DbResultArray<T> = {
    data: T[] | null;
    error: Error | null;
};

/**
 * Base Database Adapter Class
 * Provides Supabase-like interface for SQLite
 */
export class DatabaseAdapter {
    private tableName: string;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    /**
     * Build SELECT query with filters
     */
    async select<T = any>(columns: string | string[] = '*', options?: QueryOptions): Promise<DbResultArray<T>> {
        try {
            const db = await getDatabase();
            
            // Build column list
            const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
            
            // Build WHERE clause
            const { whereClause, params } = this.buildWhereClause(options?.filters);
            
            // Build ORDER BY
            const orderClause = options?.order 
                ? `ORDER BY ${options.order.column} ${options.order.ascending ? 'ASC' : 'DESC'}`
                : '';
            
            // Build LIMIT
            const limitClause = options?.limit ? `LIMIT ${options.limit}` : '';
            
            // Construct query
            const query = `
                SELECT ${columnList} 
                FROM ${this.tableName}
                ${whereClause}
                ${orderClause}
                ${limitClause}
            `.trim();
            
            const data = await db.all<T[]>(query, params);
            
            return { data, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Select single row
     */
    async selectSingle<T = any>(columns: string | string[] = '*', options?: QueryOptions): Promise<DbResult<T>> {
        const result = await this.select<T>(columns, { ...options, limit: 1 });
        
        if (result.error) {
            return { data: null, error: result.error };
        }
        
        return { 
            data: result.data && result.data.length > 0 ? result.data[0] : null, 
            error: null 
        };
    }

    /**
     * Insert data
     */
    async insert<T = any>(data: Record<string, any>): Promise<DbResult<T>> {
        try {
            const db = await getDatabase();
            
            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(data);
            
            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders})
            `;
            
            const result = await db.run(query, values);
            
            // Return inserted data with ID
            const insertedData = { ...data, id: result.lastID } as T;
            
            return { data: insertedData, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Insert multiple rows
     */
    async insertMany<T = any>(dataArray: Record<string, any>[]): Promise<DbResultArray<T>> {
        try {
            return await withTransaction(async (db) => {
                const results: T[] = [];
                
                for (const data of dataArray) {
                    const columns = Object.keys(data);
                    const placeholders = columns.map(() => '?').join(', ');
                    const values = Object.values(data);
                    
                    const query = `
                        INSERT INTO ${this.tableName} (${columns.join(', ')})
                        VALUES (${placeholders})
                    `;
                    
                    const result = await db.run(query, values);
                    results.push({ ...data, id: result.lastID } as T);
                }
                
                return { data: results, error: null };
            });
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Update data with filters
     */
    async update<T = any>(
        data: Record<string, any>, 
        filters: QueryFilter[]
    ): Promise<DbResultArray<T>> {
        try {
            const db = await getDatabase();
            
            // Build SET clause
            const setColumns = Object.keys(data);
            const setClause = setColumns.map(col => `${col} = ?`).join(', ');
            const setValues = Object.values(data);
            
            // Build WHERE clause
            const { whereClause, params } = this.buildWhereClause(filters);
            
            // Combine params: SET values first, then WHERE values
            const allParams = [...setValues, ...params];
            
            const query = `
                UPDATE ${this.tableName}
                SET ${setClause}
                ${whereClause}
                RETURNING *
            `;
            
            // SQLite doesn't support RETURNING in all versions, so we need to fetch after update
            // First, get the IDs of rows to update
            const idQuery = `SELECT id FROM ${this.tableName} ${whereClause}`;
            const rowsToUpdate = await db.all<{ id: string }[]>(idQuery, params);
            
            if (rowsToUpdate.length === 0) {
                return { data: [], error: null };
            }
            
            // Perform update
            const updateQuery = `
                UPDATE ${this.tableName}
                SET ${setClause}
                ${whereClause}
            `;
            
            await db.run(updateQuery, allParams);
            
            // Fetch updated rows
            const ids = rowsToUpdate.map(r => r.id);
            const fetchQuery = `
                SELECT * FROM ${this.tableName}
                WHERE id IN (${ids.map(() => '?').join(', ')})
            `;
            
            const updatedData = await db.all<T[]>(fetchQuery, ids);
            
            return { data: updatedData, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Delete data with filters
     */
    async delete(filters: QueryFilter[]): Promise<DbResult<{ count: number }>> {
        try {
            const db = await getDatabase();
            
            const { whereClause, params } = this.buildWhereClause(filters);
            
            // Get count before delete
            const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
            const countResult = await db.get<{ count: number }>(countQuery, params);
            
            // Perform delete
            const deleteQuery = `DELETE FROM ${this.tableName} ${whereClause}`;
            await db.run(deleteQuery, params);
            
            return { 
                data: { count: countResult?.count || 0 }, 
                error: null 
            };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Upsert (Insert or Update on conflict)
     */
    async upsert<T = any>(
        data: Record<string, any>, 
        conflictColumn: string
    ): Promise<DbResult<T>> {
        try {
            const db = await getDatabase();
            
            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(data);
            
            // Build ON CONFLICT update clause
            const updateColumns = columns.filter(col => col !== conflictColumn);
            const updateClause = updateColumns.map(col => `${col} = excluded.${col}`).join(', ');
            
            const query = `
                INSERT INTO ${this.tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT(${conflictColumn}) DO UPDATE SET
                ${updateClause}
            `;
            
            await db.run(query, values);
            
            // Fetch the upserted row
            const fetchQuery = `
                SELECT * FROM ${this.tableName}
                WHERE ${conflictColumn} = ?
            `;
            
            const result = await db.get<T>(fetchQuery, data[conflictColumn]);
            
            return { data: result || null, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Raw SQL query execution
     */
    async raw<T = any>(sql: string, params?: any[]): Promise<DbResultArray<T>> {
        try {
            const db = await getDatabase();
            const data = await db.all<T[]>(sql, params);
            return { data, error: null };
        } catch (error) {
            return { data: null, error: error as Error };
        }
    }

    /**
     * Build WHERE clause from filters
     */
    private buildWhereClause(filters?: QueryFilter[]): { whereClause: string; params: any[] } {
        if (!filters || filters.length === 0) {
            return { whereClause: '', params: [] };
        }

        const conditions: string[] = [];
        const params: any[] = [];

        for (const filter of filters) {
            const { column, operator, value } = filter;
            
            switch (operator) {
                case 'eq':
                    conditions.push(`${column} = ?`);
                    params.push(value);
                    break;
                case 'neq':
                    conditions.push(`${column} != ?`);
                    params.push(value);
                    break;
                case 'gt':
                    conditions.push(`${column} > ?`);
                    params.push(value);
                    break;
                case 'gte':
                    conditions.push(`${column} >= ?`);
                    params.push(value);
                    break;
                case 'lt':
                    conditions.push(`${column} < ?`);
                    params.push(value);
                    break;
                case 'lte':
                    conditions.push(`${column} <= ?`);
                    params.push(value);
                    break;
                case 'like':
                    conditions.push(`${column} LIKE ?`);
                    params.push(`%${value}%`);
                    break;
                case 'ilike':
                    // SQLite is case-insensitive by default for ASCII
                    conditions.push(`LOWER(${column}) LIKE LOWER(?)`);
                    params.push(`%${value}%`);
                    break;
                case 'in':
                    if (Array.isArray(value)) {
                        conditions.push(`${column} IN (${value.map(() => '?').join(', ')})`);
                        params.push(...value);
                    }
                    break;
                case 'is':
                    if (value === null) {
                        conditions.push(`${column} IS NULL`);
                    } else {
                        conditions.push(`${column} IS ?`);
                        params.push(value);
                    }
                    break;
            }
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return { whereClause, params };
    }

    /**
     * Filter builder helpers
     */
    eq(column: string, value: any): QueryFilter {
        return { column, operator: 'eq', value };
    }

    neq(column: string, value: any): QueryFilter {
        return { column, operator: 'neq', value };
    }

    gt(column: string, value: any): QueryFilter {
        return { column, operator: 'gt', value };
    }

    gte(column: string, value: any): QueryFilter {
        return { column, operator: 'gte', value };
    }

    lt(column: string, value: any): QueryFilter {
        return { column, operator: 'lt', value };
    }

    lte(column: string, value: any): QueryFilter {
        return { column, operator: 'lte', value };
    }

    like(column: string, value: any): QueryFilter {
        return { column, operator: 'like', value };
    }

    ilike(column: string, value: any): QueryFilter {
        return { column, operator: 'ilike', value };
    }

    in(column: string, value: any[]): QueryFilter {
        return { column, operator: 'in', value };
    }

    is(column: string, value: any): QueryFilter {
        return { column, operator: 'is', value };
    }
}

/**
 * Table-specific adapters
 * Pre-configured adapters for each table
 */

export const profiles = () => new DatabaseAdapter('profiles');
export const systemConfig = () => new DatabaseAdapter('system_config');
export const exerciseCache = () => new DatabaseAdapter('exercise_cache');
export const userHistories = () => new DatabaseAdapter('user_histories');
export const assignments = () => new DatabaseAdapter('assignments');
export const quizSubmissions = () => new DatabaseAdapter('quiz_submissions');
export const authUsers = () => new DatabaseAdapter('auth_users');

/**
 * Main database client export
 * Drop-in replacement for supabase client
 */
export const sqlite = {
    from: (tableName: string) => new DatabaseAdapter(tableName),
    
    // Auth namespace (will be implemented in auth-system.ts)
    auth: {
        // Placeholder - will be replaced by actual auth implementation
        signUp: async () => ({ data: null, error: new Error('Use auth-system.ts instead') }),
        signIn: async () => ({ data: null, error: new Error('Use auth-system.ts instead') }),
        signOut: async () => ({ data: null, error: null }),
        getUser: async () => ({ data: null, error: new Error('Use auth-system.ts instead') }),
    },
    
    // Functions namespace (for edge functions replacement)
    functions: {
        invoke: async (functionName: string, options?: { body?: any }) => {
            // This will be implemented to call local API endpoints
            console.warn(`Edge function ${functionName} called - implement local replacement`);
            return { data: null, error: new Error('Edge functions not implemented in SQLite mode') };
        }
    }
};

// Default export for compatibility
export default sqlite;
