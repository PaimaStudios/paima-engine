declare type Seed = string | number;
declare class Prando {
    _seed: Seed;
    _value: number;
    seed: number;
    iteration: number;
    MIN: number;
    MAX: number;
    constructor(seed: Seed);
    next(min?: number, pseudoMax?: number): number;
    nextInt(min?: number, max?: number): number;
    nextString(length?: number, chars?: string): string;
    nextChar(chars?: string): string;
    nextArrayItem<T>(array: T[]): T;
    nextBoolean(): boolean;
    skip(iterations?: number): void;
    reset(): void;
    recalculate(): void;
    xorshift(value: number): number;
    map(val: number, minFrom: number, maxFrom: number, minTo: number, maxTo: number): number;
    hashCode(str: string): number;
    getSafeSeed(seed: number): number;
}
export default Prando;
