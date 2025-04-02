/**
 * @file SohlMap.ts
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

import { Itr } from "./Itr";

/**
 * SohlMap - An extension of Map that returns Itr instances for iterator methods.
 */
export class SohlMap<K, V> extends Map<K, V> {
    /**
     * Returns an Itr of the keys in the map.
     */
    override keys(): Itr<K> {
        return Itr.from(super.keys());
    }

    /**
     * Returns an Itr of the values in the map.
     */
    override values(): Itr<V> {
        return Itr.from(super.values());
    }

    /**
     * Returns an Itr of key-value pairs in the map.
     */
    override entries(): Itr<[K, V]> {
        return Itr.from(super.entries());
    }

    /**
     * Returns an Itr of key-value pairs as the default iterator.
     */
    override [Symbol.iterator](): Itr<[K, V]> {
        return this.entries();
    }

    /**
     * Map through the entries and return a new SohlMap.
     */
    map<T>(callback: (value: V, key: K, index: number) => T): SohlMap<K, T> {
        const result = new SohlMap<K, T>();
        let index = 0;
        for (const [key, value] of this) {
            result.set(key, callback(value, key, index++));
        }
        return result;
    }

    /**
     * Filter entries and return a new SohlMap with the matching entries.
     */
    filter(
        callback: (value: V, key: K, index: number) => boolean,
    ): SohlMap<K, V> {
        const result = new SohlMap<K, V>();
        let index = 0;
        for (const [key, value] of this) {
            if (callback(value, key, index++)) {
                result.set(key, value);
            }
        }
        return result;
    }

    /**
     * Drop the first `n` entries and return a new SohlMap.
     */
    drop(n: number): SohlMap<K, V> {
        const result = new SohlMap<K, V>();
        let i = 0;
        for (const [key, value] of this) {
            if (i++ >= n) {
                result.set(key, value);
            }
        }
        return result;
    }

    /**
     * Take the first `n` entries and return a new SohlMap.
     */
    take(n: number): SohlMap<K, V> {
        const result = new SohlMap<K, V>();
        let i = 0;
        for (const [key, value] of this) {
            if (i++ >= n) break;
            result.set(key, value);
        }
        return result;
    }

    override forEach(
        callbackfn: (value: V, key: K, map: SohlMap<K, V>) => void,
        thisArg?: any,
    ): void {
        for (const [key, value] of this) {
            callbackfn.call(thisArg, value, key, this);
        }
    }

    /**
     * Reduce entries to a single value.
     */
    reduce<T>(
        callback: (acc: T, value: V, key: K, index: number) => T,
        initialValue: T,
    ): T {
        let accumulator = initialValue;
        let index = 0;
        for (const [key, value] of this) {
            accumulator = callback(accumulator, value, key, index++);
        }
        return accumulator;
    }

    /**
     * Find the first entry that matches a condition.
     */
    find(
        callback: (value: V, key: K, index: number) => boolean,
    ): [K, V] | undefined {
        let index = 0;
        for (const [key, value] of this) {
            if (callback(value, key, index++)) {
                return [key, value];
            }
        }
        return undefined;
    }

    /**
     * Check if some entries match a condition.
     */
    some(callback: (value: V, key: K, index: number) => boolean): boolean {
        let index = 0;
        for (const [key, value] of this) {
            if (callback(value, key, index++)) return true;
        }
        return false;
    }

    /**
     * Check if all entries match a condition.
     */
    every(callback: (value: V, key: K, index: number) => boolean): boolean {
        let index = 0;
        for (const [key, value] of this) {
            if (!callback(value, key, index++)) return false;
        }
        return true;
    }
}
