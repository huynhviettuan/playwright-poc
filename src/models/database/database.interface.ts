export interface DbQueryResult<T = Record<string, unknown>> {
    readonly rows: T[];
    readonly rowCount: number | null;
}

export interface DbSeedEntry {
    readonly table: string;
    readonly data: Record<string, unknown>;
    readonly returning?: string;
}

export interface DbCleanupEntry {
    readonly table: string;
    readonly where: Record<string, unknown>;
}
