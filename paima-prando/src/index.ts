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
    if (typeof seed === "string") this.seed = this.hashCode(seed);
    else if (typeof seed === "number") this.seed = this.getSafeSeed(seed);
    else
      this.seed = this.getSafeSeed(
        this.MIN + Math.floor((this.MAX - this.MIN) * Math.random())
      );
    this.reset();
  }
  next(min = 0, pseudoMax = 1): number {
    this.recalculate();
    return this.map(this._value, this.MIN, this.MAX, min, pseudoMax);
  }
  nextInt(min = 10, max = 100): number {
    this.recalculate();
    return Math.floor(this.map(this._value, this.MIN, this.MAX, min, max + 1));
  }
  nextString(
    length = 16,
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  ): string {
    var str = "";
    while (str.length < length) {
      str += this.nextChar(chars);
    }
    return str;
  }
  nextChar(
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  ): string {
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
  reset() {
    this.iteration = 0;
    this._value = this.seed;
  }
  recalculate() {
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
  map(
    val: number,
    minFrom: number,
    maxFrom: number,
    minTo: number,
    maxTo: number
  ) {
    return ((val - minFrom) / (maxFrom - minFrom)) * (maxTo - minTo) + minTo;
  }
  hashCode(str: string): number {
    var hash = 0;
    if (str) {
      var l = str.length;
      for (var i = 0; i < l; i++) {
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
