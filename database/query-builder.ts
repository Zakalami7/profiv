/// <reference types="vite/client" />

/**
 * Query Builder for SQLite Database Adapter
 * Provides Supabase-like chainable query interface
 * 
 * This module automatically detects the environment (browser vs Node.js)
 * and uses the appropriate implementation.
 * 
 * IMPORTANT: Server-only code is conditionally defined using import.meta.env.SSR
 * to ensure Vite tree-shakes it from client builds.
 */


// Type definitions
type QueryFilter = {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'is';
    value: any;
};

type QueryOrder = {
    column: string;
    ascending: boolean;
};

export type DbResult<T> = {
    data: T | null;
    error: Error | null;
};

export type DbResultArray<T> = {
    data: T[] | null;
    error: Error | null;
};

// Define interface for query builder constructors
interface QueryBuilderConstructor {
    new <T = any>(tableName: string): any;
}

// Browser adapter is only imported client-side
// This import is conditional to prevent server code from being bundled for client
let fromBrowser: <T = any>(tableName: string) => any;
let BrowserQueryBuilder: QueryBuilderConstructor;

// ServerQueryBuilder will only be defined in SSR mode
let ServerQueryBuilder: QueryBuilderConstructor;


// This block will be tree-shaken in browser builds due to import.meta.env.SSR being false
if (import.meta.env.SSR) {
    // Lazy-loaded server database connection
    // Dynamic import only happens in Node.js environment
    let getDatabasePromise: Promise<any> | null = null;

    const getDatabase = async (): Promise<any> => {
        if (!getDatabasePromise) {
            // Dynamic import - this module is only loaded in Node.js
            const { getDatabase: getDb } = await import('./connection.js');
            getDatabasePromise = getDb();
        }
        return getDatabasePromise;
    };


    /**
     * Server-side QueryBuilder implementation
     * This class is only available in SSR mode
     */
    ServerQueryBuilder = class <T = any> {
        private tableName: string;
        private columns: string = '*';
        private filters: QueryFilter[] = [];
        private orderBy: QueryOrder | null = null;
        private limitValue: number | null = null;

        constructor(tableName: string) {
            this.tableName = tableName;
        }

        select(columns: string | string[]): any {
            this.columns = Array.isArray(columns) ? columns.join(', ') : columns;
            return this;
        }

        eq(column: string, value: any): any {
            this.filters.push({ column, operator: 'eq', value });
            return this;
        }
        
        neq(column: string, value: any): any {
            this.filters.push({ column, operator: 'neq', value });
            return this;
        }

        gt(column: string, value: any): any {
            this.filters.push({ column, operator: 'gt', value });
            return this;
        }

        gte(column: string, value: any): any {
            this.filters.push({ column, operator: 'gte', value });
            return this;
        }

        lt(column: string, value: any): any {
            this.filters.push({ column, operator: 'lt', value });
            return this;
        }

        lte(column: string, value: any): any {
            this.filters.push({ column, operator: 'lte', value });
            return this;
        }

        like(column: string, value: any): any {
            this.filters.push({ column, operator: 'like', value });
            return this;
        }
        
        ilike(column: string, value: any): any {
            this.filters.push({ column, operator: 'ilike', value });
            return this;
        }

        in(column: string, values: any[]): any {
            this.filters.push({ column, operator: 'in', value: values });
            return this;
        }

        is(column: string, value: any): any {
            this.filters.push({ column, operator: 'is', value });
            return this;
        }
        
        order(column: string, options?: { ascending?: boolean }): any {
            this.orderBy = {
                column,
                ascending: options?.ascending ?? true
            };
            return this;
        }

        limit(count: number): any {
            this.limitValue = count;
            return this;
        }

        async execute(): Promise<DbResultArray<T>> {
            try {
                const db = await getDatabase();
                const { whereClause, params } = this.buildWhereClause();
                const orderClause = this.orderBy ? `ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? 'ASC' : 'DESC'}` : '';
                const limitClause = this.limitValue ? `LIMIT ${this.limitValue}` : '';
                const query = `SELECT ${this.columns} FROM ${this.tableName} ${whereClause} ${orderClause} ${limitClause}`.trim();
                const data = await db.all(query, params);
                return { data: data as T[], error: null };
            } catch (error) {
                return { data: null, error: error as Error };
            }
        }

        async single(): Promise<DbResult<T>> {
            this.limitValue = 1;
            const result = await this.execute();
            if (result.error) {
                return { data: null, error: result.error };
            }
            return {
                data: result.data && result.data.length > 0 ? result.data[0] : null,
                error: null
            };
        }

        async insert(data: Record<string, any>): Promise<DbResult<T>> {
            try {
                const db = await getDatabase();
                const columns = Object.keys(data);
                const placeholders = columns.map(() => '?').join(', ');
                const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
                const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
                const result = await db.run(query, values);
                const insertedData = { ...data, id: result.lastID } as T;
                return { data: insertedData, error: null };
            } catch (error) {
                return { data: null, error: error as Error };
            }
        }
        
        async update(data: Record<string, any>): Promise<DbResultArray<T>> {
            try {
                const db = await getDatabase();
                const setColumns = Object.keys(data);
                const setClause = setColumns.map(col => `${col} = ?`).join(', ');
                const setValues = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
                const { whereClause, params } = this.buildWhereClause();
                const allParams = [...setValues, ...params];
                const idQuery = `SELECT id FROM ${this.tableName} ${whereClause}`;
                const rowsToUpdate = await db.all(idQuery, params) as { id: string }[];
                if (rowsToUpdate.length === 0) {
                    return { data: [], error: null };
                }
                const updateQuery = `UPDATE ${this.tableName} SET ${setClause} ${whereClause}`;
                await db.run(updateQuery, allParams);
                const ids = rowsToUpdate.map((r: { id: string }) => r.id);
                const fetchQuery = `SELECT * FROM ${this.tableName} WHERE id IN (${ids.map(() => '?').join(', ')})`;
                const updatedData = await db.all(fetchQuery, ids) as T[];
                return { data: updatedData, error: null };
            } catch (error) {
                return { data: null, error: error as Error };
            }
        }

        async delete(): Promise<DbResult<{ count: number }>> {
            try {
                const db = await getDatabase();
                const { whereClause, params } = this.buildWhereClause();
                const countQuery = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause}`;
                const countResult = await db.get(countQuery, params) as { count: number } | undefined;
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
        
        async upsert(data: Record<string, any>, conflictColumn: string): Promise<DbResult<T>> {
            try {
                const db = await getDatabase();
                const columns = Object.keys(data);
                const placeholders = columns.map(() => '?').join(', ');
                const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
                const updateColumns = columns.filter(col => col !== conflictColumn);
                const updateClause = updateColumns.map(col => `${col} = excluded.${col}`).join(', ');
                const query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT(${conflictColumn}) DO UPDATE SET ${updateClause}`;
                await db.run(query, values);
                const fetchQuery = `SELECT * FROM ${this.tableName} WHERE ${conflictColumn} = ?`;
                const result = await db.get(fetchQuery, data[conflictColumn]) as T | undefined;
                return { data: result || null, error: null };
            } catch (error) {
                return { data: null, error: error as Error };
            }
        }

        private buildWhereClause(): { whereClause: string; params: any[] } {
            if (this.filters.length === 0) {
                return { whereClause: '', params: [] };
            }
            const conditions: string[] = [];
            const params: any[] = [];
            for (const filter of this.filters) {
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
    }
}

// Client-side initialization - lazy load browser adapter
let browserModulePromise: Promise<any> | null = null;

async function loadBrowserModule(): Promise<any> {
    if (!browserModulePromise) {
        browserModulePromise = import('./database-adapter-browser.js');
    }
    return browserModulePromise;
}

// Initialize browser module - can be called early in app lifecycle
export async function initializeBrowserModule(): Promise<void> {
    if (!fromBrowser) {
        const browserModule = await loadBrowserModule();
        fromBrowser = browserModule.fromBrowser;
        BrowserQueryBuilder = browserModule.BrowserQueryBuilder;
    }
}


/**
 * Create a new query builder for a table
 * Automatically detects environment and returns appropriate implementation
 */
export function from<T = any>(tableName: string): any {
    if (import.meta.env.SSR) {
        // In Node.js, use the server implementation
        if (!ServerQueryBuilder) {
            throw new Error('ServerQueryBuilder is not available in client builds');
        }
        return new ServerQueryBuilder<T>(tableName);
    }
    // In browser, use the browser adapter
    // Lazy load and cache the browser module
    if (!fromBrowser) {
        // Return a proxy that loads the module on first use
        return createBrowserQueryProxy<T>(tableName);
    }
    return fromBrowser<T>(tableName);
}

// Proxy for lazy loading browser module
function createBrowserQueryProxy<T>(tableName: string): any {
    const handler: ProxyHandler<any> = {
        async get(target, prop) {
            if (!fromBrowser) {
                // Load the browser module asynchronously
                const browserModule = await loadBrowserModule();
                fromBrowser = browserModule.fromBrowser;
                BrowserQueryBuilder = browserModule.BrowserQueryBuilder;
            }
            const query = fromBrowser<T>(tableName);
            return (query as any)[prop];
        }
    };
    return new Proxy({}, handler);
}

// Async initialization for browser environment
export async function fromAsync<T = any>(tableName: string): Promise<any> {
    // Pre-load browser module if needed
    if (!import.meta.env.SSR && !fromBrowser) {
        await initializeBrowserModule();
    }
    if (import.meta.env.SSR) {
        if (!ServerQueryBuilder) {
            throw new Error('ServerQueryBuilder is not available in client builds');
        }
        return new ServerQueryBuilder<T>(tableName);
    }
    if (!fromBrowser) {
        const browserModule = await loadBrowserModule();
        fromBrowser = browserModule.fromBrowser;
        BrowserQueryBuilder = browserModule.BrowserQueryBuilder;
    }
    return fromBrowser<T>(tableName);
}



// Conditional exports - only export what's available in the current environment
// In SSR: ServerQueryBuilder is available
// In browser: BrowserQueryBuilder and fromBrowser are available
export { ServerQueryBuilder, fromBrowser, BrowserQueryBuilder };
