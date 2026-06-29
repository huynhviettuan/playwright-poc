import { type Identifiable } from '@models/test-data/test-data.interface';

export class BaseTestDataHelper<T extends Identifiable> {
    constructor(protected readonly items: T[]) {}

    getAll(): T[] {
        return this.items;
    }

    getById(id: string): T {
        const item = this.items.find((i) => i.id === id);
        if (!item) throw new Error(`Test data with id "${id}" not found`);
        return item;
    }

    findBy<K extends keyof T>(key: K, value: T[K]): T | undefined {
        return this.items.find((i) => i[key] === value);
    }

    filterBy<K extends keyof T>(key: K, value: T[K]): T[] {
        return this.items.filter((i) => i[key] === value);
    }

    first(): T {
        if (this.items.length === 0) throw new Error('No test data available');
        return this.items[0];
    }

    count(): number {
        return this.items.length;
    }
}
