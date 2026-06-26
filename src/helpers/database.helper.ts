import { Config } from '@constants/config.constant';
import { type DbCleanupEntry, type DbQueryResult, type DbSeedEntry } from '@models/database/database.interface';
import { Pool, type PoolConfig } from 'pg';

export class DatabaseHelper {
    private readonly pool: Pool;
    private readonly cleanupQueue: DbCleanupEntry[] = [];

    constructor(config?: PoolConfig) {
        this.pool = new Pool(
            config ?? {
                host: Config.db.host,
                port: Config.db.port,
                database: Config.db.name,
                user: Config.db.user,
                password: Config.db.password,
                ssl: Config.db.ssl ? { rejectUnauthorized: false } : false,
                max: 5,
                idleTimeoutMillis: 30000
            }
        );
    }

    async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<DbQueryResult<T>> {
        const result = await this.pool.query<T>(sql, params);
        return { rows: result.rows, rowCount: result.rowCount };
    }

    async findOne<T = Record<string, unknown>>(table: string, where: Record<string, unknown>): Promise<T | null> {
        const { clause, values } = DatabaseHelper.buildWhereClause(where);
        const result = await this.query<T>(`SELECT * FROM ${table} WHERE ${clause} LIMIT 1`, values);
        return result.rows[0] ?? null;
    }

    async findMany<T = Record<string, unknown>>(table: string, where: Record<string, unknown>): Promise<T[]> {
        const { clause, values } = DatabaseHelper.buildWhereClause(where);
        const result = await this.query<T>(`SELECT * FROM ${table} WHERE ${clause}`, values);
        return result.rows;
    }

    async insert<T = Record<string, unknown>>(entry: DbSeedEntry): Promise<T | null> {
        const columns = Object.keys(entry.data);
        const values = Object.values(entry.data);
        const placeholders = columns.map((_, i) => `$${i + 1}`);
        const returning = entry.returning ? `RETURNING ${entry.returning}` : 'RETURNING *';

        const sql = `INSERT INTO ${entry.table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) ${returning}`;
        const result = await this.query<T>(sql, values);
        return result.rows[0] ?? null;
    }

    async seed<T = Record<string, unknown>>(entry: DbSeedEntry, autoCleanup = true): Promise<T | null> {
        const row = await this.insert<T>(entry);

        if (autoCleanup && row) {
            const idField = entry.returning ?? 'id';
            this.cleanupQueue.push({
                table: entry.table,
                where: { [idField]: (row as Record<string, unknown>)[idField] }
            });
        }

        return row;
    }

    async delete(table: string, where: Record<string, unknown>): Promise<number> {
        const { clause, values } = DatabaseHelper.buildWhereClause(where);
        const result = await this.query(`DELETE FROM ${table} WHERE ${clause}`, values);
        return result.rowCount ?? 0;
    }

    async update(table: string, where: Record<string, unknown>, data: Record<string, unknown>): Promise<number> {
        const setCols = Object.keys(data);
        const setValues = Object.values(data);
        const setClause = setCols.map((col, i) => `${col} = $${i + 1}`).join(', ');

        const whereKeys = Object.keys(where);
        const whereValues = Object.values(where);
        const whereClause = whereKeys.map((col, i) => `${col} = $${setCols.length + i + 1}`).join(' AND ');

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
        const result = await this.query(sql, [...setValues, ...whereValues]);
        return result.rowCount ?? 0;
    }

    async count(table: string, where?: Record<string, unknown>): Promise<number> {
        if (!where || Object.keys(where).length === 0) {
            const result = await this.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`);
            return Number(result.rows[0]?.count ?? 0);
        }

        const { clause, values } = DatabaseHelper.buildWhereClause(where);
        const result = await this.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM ${table} WHERE ${clause}`,
            values
        );
        return Number(result.rows[0]?.count ?? 0);
    }

    async exists(table: string, where: Record<string, unknown>): Promise<boolean> {
        const count = await this.count(table, where);
        return count > 0;
    }

    async cleanup(): Promise<void> {
        for (const entry of this.cleanupQueue.reverse()) {
            // eslint-disable-next-line @typescript-eslint/no-empty-function
            await this.delete(entry.table, entry.where).catch(() => {});
        }
        this.cleanupQueue.length = 0;
    }

    async close(): Promise<void> {
        await this.pool.end();
    }

    private static buildWhereClause(where: Record<string, unknown>): { clause: string; values: unknown[] } {
        const keys = Object.keys(where);
        const values = Object.values(where);
        const clause = keys.map((col, i) => `${col} = $${i + 1}`).join(' AND ');
        return { clause, values };
    }
}
