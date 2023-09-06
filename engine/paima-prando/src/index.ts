type Seed = string | number;

class Prando {
  _seed: Seed;
  _value: number;
  seed: number;
  iteration: number;
  MIN = -2147483648; // Int32 min
  MAX = 2147483647; // Int32 max

  constructor(seed: Seed) {
    this._value = NaN;
    this._seed = seed;
    this.iteration = 0;
    if (!seed) throw Error(`Prando initialized without a valid seed (${seed})`);
    if (typeof seed === 'string') this.seed = this.hashCode(seed);
    else if (typeof seed === 'number') this.seed = seed;
    else {
      throw Error(`Prando initialized without a valid seed (${seed})`);
    }
    this.reset();
  }

  next(min = 0, pseudoMax = 1): number {
    this.recalculate();
    return this.map(this._value, this.MIN, this.MAX, min, pseudoMax);
  }

  /**
   * @returns pseudo random number in the given range, inclusive: <min, max>
   */
  nextInt(min = 10, max = 100): number {
    this.recalculate();
    return Math.floor(this.map(this._value, this.MIN, this.MAX, min, max + 1));
  }

  nextString(
    length = 16,
    chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  ): string {
    let str = '';
    while (str.length < length) {
      str += this.nextChar(chars);
    }
    return str;
  }

  nextChar(chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
    return chars.substr(this.nextInt(0, chars.length - 1), 1);
  }

  nextArrayItem<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  nextBoolean(): boolean {
    this.recalculate();
    return this._value > 0.5;
  }

  skip(iterations = 1): void {
    while (iterations-- > 0) {
      this.recalculate();
    }
  }

  reset(): void {
    this.iteration = 0;
    this._value = this.seed;
  }

  recalculate(): void {
    this.iteration++;
    this._value = this.xorshift(this._value);
  }

  xorshift(value: number): number {
    // Xorshift*32
    // Based on George Marsaglia's work: http://www.jstatsoft.org/v08/i14/paper
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    return value;
  }

  map(val: number, minFrom: number, maxFrom: number, minTo: number, maxTo: number): number {
    return ((val - minFrom) / (maxFrom - minFrom)) * (maxTo - minTo) + minTo;
  }

  hashCode(str: string): number {
    let hash = 0;
    if (str) {
      let l = str.length;
      for (let i = 0; i < l; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
        hash = this.xorshift(hash);
      }
    }
    return this.getSafeSeed(hash);
  }

  getSafeSeed(seed: number): number {
    if (seed === 0) return 1;
    return seed;
  }
}

export default Prando;
