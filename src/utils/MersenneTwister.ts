/**
 * A highly efficient TypeScript implementation of the Mersenne Twister pseudo-random number generator.
 * Optimized for runtime speed and compact memory access.
 *
 * Original algorithm by Makoto Matsumoto and Takuji Nishimura.
 * Port adapted and tuned for TypeScript by OpenAI for SOHL.
 */
export class MersenneTwister {
    private static readonly N = 624;
    private static readonly M = 397;
    private static readonly MATRIX_A = 0x9908b0df;
    private static readonly UPPER_MASK = 0x80000000;
    private static readonly LOWER_MASK = 0x7fffffff;
    private static readonly MAX_INT = 4294967296.0;

    private mt: number[] = new Array(MersenneTwister.N);
    private mti = MersenneTwister.N + 1;
    private _seed: number;

    constructor(seed: number = Date.now()) {
        this._seed = this.seed(seed);
    }

    seed(seed: number): number {
        this.mt[0] = seed >>> 0;
        for (this.mti = 1; this.mti < MersenneTwister.N; this.mti++) {
            const prev = this.mt[this.mti - 1] ^ (this.mt[this.mti - 1] >>> 30);
            this.mt[this.mti] =
                ((((prev & 0xffff0000) >>> 16) * 1812433253) << 16) +
                (prev & 0x0000ffff) * 1812433253 +
                this.mti;
            this.mt[this.mti] >>>= 0;
        }
        return (this._seed = seed);
    }

    seedArray(vector: number[]): void {
        let i = 1,
            j = 0,
            k = Math.max(MersenneTwister.N, vector.length);
        this.seed(19650218);
        while (k--) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] =
                (this.mt[i] ^
                    ((((s >>> 16) * 1664525) << 16) + (s & 0xffff) * 1664525)) +
                vector[j] +
                j;
            this.mt[i] >>>= 0;
            i = (i + 1) % MersenneTwister.N;
            j = (j + 1) % vector.length;
        }
        for (k = MersenneTwister.N - 1; k > 0; k--) {
            const s = this.mt[i - 1] ^ (this.mt[i - 1] >>> 30);
            this.mt[i] =
                (this.mt[i] ^
                    ((((s >>> 16) * 1566083941) << 16) +
                        (s & 0xffff) * 1566083941)) -
                i;
            this.mt[i] >>>= 0;
            i = (i + 1) % MersenneTwister.N;
        }
        this.mt[0] = 0x80000000;
    }

    int(): number {
        if (this.mti >= MersenneTwister.N) this.twist();

        let y = this.mt[this.mti++];
        y ^= y >>> 11;
        y ^= (y << 7) & 0x9d2c5680;
        y ^= (y << 15) & 0xefc60000;
        y ^= y >>> 18;
        return y >>> 0;
    }

    private twist(): void {
        const { N, M, UPPER_MASK, LOWER_MASK, MATRIX_A } = MersenneTwister;
        const mag01 = [0, MATRIX_A];
        let y: number;
        let kk = 0;

        for (; kk < N - M; kk++) {
            y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
            this.mt[kk] = this.mt[kk + M] ^ (y >>> 1) ^ mag01[y & 1];
        }
        for (; kk < N - 1; kk++) {
            y = (this.mt[kk] & UPPER_MASK) | (this.mt[kk + 1] & LOWER_MASK);
            this.mt[kk] = this.mt[kk + (M - N)] ^ (y >>> 1) ^ mag01[y & 1];
        }
        y = (this.mt[N - 1] & UPPER_MASK) | (this.mt[0] & LOWER_MASK);
        this.mt[N - 1] = this.mt[M - 1] ^ (y >>> 1) ^ mag01[y & 1];
        this.mti = 0;
    }

    int31(): number {
        return this.int() >>> 1;
    }

    real(): number {
        return this.int() * (1.0 / (MersenneTwister.MAX_INT - 1));
    }

    realx(): number {
        return (this.int() + 0.5) * (1.0 / MersenneTwister.MAX_INT);
    }

    rnd(): number {
        return this.int() * (1.0 / MersenneTwister.MAX_INT);
    }

    random(): number {
        return this.rnd();
    }

    rndHiRes(): number {
        return (
            ((this.int() >>> 5) * 67108864 + (this.int() >>> 6)) /
            9007199254740992
        );
    }

    normal(mu: number, sigma: number): number {
        let u = 0,
            v = 0;
        while (u === 0) u = this.random();
        while (v === 0) v = this.random();
        return (
            Math.sqrt(-2.0 * Math.log(u)) *
                Math.cos(2.0 * Math.PI * v) *
                sigma +
            mu
        );
    }

    // Singleton support
    private static _instance: MersenneTwister | null = null;

    static get instance(): MersenneTwister {
        if (!this._instance) this._instance = new MersenneTwister(Date.now());
        return this._instance;
    }

    static setSeed(seed: number): void {
        this._instance = new MersenneTwister(seed);
    }

    static useMock(mock: MersenneTwister): void {
        this._instance = mock;
    }

    static reset(): void {
        this._instance = null;
    }

    static int(): number {
        return this.instance.int();
    }

    static random(): number {
        return this.instance.random();
    }

    static normal(mu: number, sigma: number): number {
        return this.instance.normal(mu, sigma);
    }
}
