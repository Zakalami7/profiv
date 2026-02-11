/**
 * Query Builder for SQLite Database Adapter
 * Provides Supabase-like chainable query interface
 */

import { getDatabase } from './connection.js';

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

/**
 * QueryBuilder class for building chainable queries
 */
export class QueryBuilder<T = any> {
    private tableName: string;
    private columns: string = '*';
    private filters: QueryFilter[] = [];
    private orderBy: QueryOrder | null = null;
    private limitValue: number | null = null;

    constructor(tableName: string) {
        this.tableName = tableName;
    }

    /**
     * Select columns
     */
    select(columns: string | string[]): QueryBuilder<T> {
        this.columns = Array.isArray(columns) ? columns.join(', ') : columns;
        return this;
    }

    /**
     * Equality filter
     */
    eq(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'eq', value });
        return this;
    }

    /**
     * Not equal filter
     */
    neq(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'neq', value });
        return this;
    }

    /**
     * Greater than filter
     */
    gt(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'gt', value });
        return this;
    }

    /**
     * Greater than or equal filter
     */
    gte(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'gte', value });
        return this;
    }

    /**
     * Less than filter
     */
    lt(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'lt', value });
        return this;
    }

    /**
     * Less than or equal filter
     */
    lte(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'lte', value });
        return this;
    }

    /**
     * Like filter (case sensitive)
     */
    like(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'like', value });
        return this;
    }

    /**
     * ILike filter (case insensitive)
     */
    ilike(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'ilike', value });
        return this;
    }

    /**
     * In filter
     */
    in(column: string, values: any[]): QueryBuilder<T> {
        this.filters.push({ column, operator: 'in', value: values });
        return this;
    }

    /**
     * Is null filter
     */
    is(column: string, value: any): QueryBuilder<T> {
        this.filters.push({ column, operator: 'is', value });
        return this;
    }

    /**
     * Order by
     */
    order(column: string, options?: { ascending?: boolean }): QueryBuilder<T> {
        this.orderBy = { 
            column, 
            ascending: options?.ascending ?? true 
        };
        return this;
    }

    /**
     * Limit results
     */
    limit(count: number): QueryBuilder<T> {
        this.limitValue = count;
        return this;
    }

    /**
     * Execute the query and return array of results
     */
    async execute(): Promise<DbResultArray<T>> {
        try {
            const db = await getDatabase();
            
            const { whereClause, params } = this.buildWhereClause();
            
            const orderClause = this.orderBy 
                ? `ORDER BY ${this.orderBy.column} ${this.orderBy.ascending ? 'ASC' : 'DESC'}`
                : '';
            
            const limitClause = this.limitValue ? `LIMIT ${this.limitValue}` : '';
            
            const query = `
                SELECT ${this.columns} 
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
     * Execute and return single result
     */
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

    /**
     * Insert data
     */
    async insert(data: Record<string, any>): Promise<DbResult<T>> {
        try {
            const db = await getDatabase();
            
            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(data).map(v => 
                typeof v === 'object' ? JSON.stringify(v) : v
            );
            
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
     * Update data with current filters
     */
    async update(data: Record<string, any>): Promise<DbResultArray<T>> {
        try {
            const db = await getDatabase();
            
            // Build SET clause
            const setColumns = Object.keys(data);
            const setClause = setColumns.map(col => `${col} = ?`).join(', ');
            const setValues = Object.values(data).map(v => 
                typeof v === 'object' ? JSON.stringify(v) : v
            );
            
            // Build WHERE clause
            const { whereClause, params } = this.buildWhereClause();
            
            // Combine params: SET values first, then WHERE values
            const allParams = [...setValues, ...params];
            
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
     * Delete data with current filters
     */
    async delete(): Promise<DbResult<{ count: number }>> {
        try {
            const db = await getDatabase();
            
            const { whereClause, params } = this.buildWhereClause();
            
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
    async upsert(data: Record<string, any>, conflictColumn: string): Promise<DbResult<T>> {
        try {
            const db = await getDatabase();
            
            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(', ');
            const values = Object.values(data).map(v => 
                typeof v === 'object' ? JSON.stringify(v) : v
            );
            
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
     * Build WHERE clause from filters
     */
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

/**
 * Create a new query builder for a table
 */
export const from = <T = any>(tableName: string): QueryBuilder<T> => {
    return new QueryBuilder<T>(tableName);
};
