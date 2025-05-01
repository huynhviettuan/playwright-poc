export interface IImage {
    getSource(): Promise<string | null>;
    getAlt(): Promise<string | null>;
    getBoundingBox(): Promise<{ x: number; y: number; width: number; height: number }>;
}
