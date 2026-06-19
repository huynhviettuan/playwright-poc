export interface ISkeleton {
    waitForHidden(timeout?: number): Promise<void>;
    waitForAllHidden(timeout?: number): Promise<void>;
    count(): Promise<number>;
    isVisible(): Promise<boolean>;
    hasVisibleSkeleton(): Promise<boolean>;
}
