export interface ILink {
    getReference(): Promise<string | null>;
}
