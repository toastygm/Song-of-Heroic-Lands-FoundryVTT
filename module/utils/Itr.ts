/**
 * @file Itr.ts
 * @project Song of Heroic Lands (SoHL)
 * @module utils
 * @author Tom Rodriguez aka "Toasty" <toasty@heroiclands.com>
 * @contact Email: toasty@heroiclands.com
 * @contact Join the SoHL Discord: https://discord.gg/f2Qjar3Rqv
 * @license GPL-3.0 (https://www.gnu.org/licenses/gpl-3.0.html)
 * @copyright (c) 2025 Tom Rodriguez
 *
 * Permission is granted to copy, modify, and distribute this work under the
 * terms of the GNU General Public License v3.0 (GPLv3). You must provide
 * appropriate credit, state any changes made, and distribute modified versions
 * under the same license. You may not impose additional restrictions on the
 * recipients' exercise of the rights granted under this license. This is only a
 * summary of the GNU GPLv3 License. For the full terms, see the LICENSE.md
 * file in the project root or visit: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * @description
 * Brief description of what this file does and its role in the system.
 *
 * @see GitHub Repository: https://github.com/toastygm/Song-of-Heroic-Lands-FoundryVTT
 * @see Foundry VTT System Page: https://foundryvtt.com/packages/sohl
 */

export class Itr<T> implements IterableIterator<T> {
    private _iterator: Iterator<T>;

    constructor(iterable: Iterable<T>) {
        this._iterator = iterable[Symbol.iterator]();
    }

    /**
     * Create a new Itr instance from an iterable.
     */
    static from<U>(iterable: Iterable<U>): Itr<U> {
        return new Itr(iterable);
    }

    /**
     * Default iterator to enable `for...of` usage.
     */
    *[Symbol.iterator](): IterableIterator<T> {
        let result = this._iterator.next();
        while (!result.done) {
            yield result.value;
            result = this._iterator.next();
        }
    }

    /**
     * Return the next element in the iterator.
     */
    next(...args: [] | [undefined]): IteratorResult<T> {
        return this._iterator.next(...args);
    }

    /**
     * Convert to an array.
     */
    toArray(): T[] {
        return Array.from(this);
    }

    /**
     * Take the first `n` elements.
     */
    take(n: number): Itr<T> {
        function* generator(iter: Iterable<T>) {
            let i = 0;
            for (const item of iter) {
                if (i++ >= n) break;
                yield item;
            }
        }
        return new Itr(generator(this));
    }

    /**
     * Skip the first `n` elements.
     */
    drop(n: number): Itr<T> {
        function* generator(iter: Iterable<T>) {
            let i = 0;
            for (const item of iter) {
                if (i++ >= n) yield item;
            }
        }
        return new Itr(generator(this));
    }

    /**
     * Apply a function to each element.
     */
    forEach(callback: (value: T, index: number) => void): void {
        let index = 0;
        for (const item of this) {
            callback(item, index++);
        }
    }

    /**
     * Map values to a new Itr.
     */
    map<U>(callback: (value: T, index: number) => U): Itr<U> {
        function* generator(iter: Iterable<T>) {
            let index = 0;
            for (const item of iter) {
                yield callback(item, index++);
            }
        }
        return new Itr(generator(this));
    }

    /**
     * Filter values to a new Itr.
     */
    filter(callback: (value: T, index: number) => boolean): Itr<T> {
        function* generator(iter: Iterable<T>) {
            let index = 0;
            for (const item of iter) {
                if (callback(item, index++)) yield item;
            }
        }
        return new Itr(generator(this));
    }

    /**
     * Reduce to a single value.
     */
    reduce<U>(
        callback: (accumulator: U, value: T, index: number) => U,
        initialValue: U,
    ): U {
        let index = 0;
        let accumulator = initialValue;
        for (const item of this) {
            accumulator = callback(accumulator, item, index++);
        }
        return accumulator;
    }

    /**
     * Find the first element that matches a condition.
     */
    find(callback: (value: T, index: number) => boolean): T | undefined {
        let index = 0;
        for (const item of this) {
            if (callback(item, index++)) return item;
        }
        return undefined;
    }

    /**
     * Check if some elements match a condition.
     */
    some(callback: (value: T, index: number) => boolean): boolean {
        let index = 0;
        for (const item of this) {
            if (callback(item, index++)) return true;
        }
        return false;
    }

    /**
     * Check if all elements match a condition.
     */
    every(callback: (value: T, index: number) => boolean): boolean {
        let index = 0;
        for (const item of this) {
            if (!callback(item, index++)) return false;
        }
        return true;
    }
}
