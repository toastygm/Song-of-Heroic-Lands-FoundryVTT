/**
 * @typedef {(fn: (...args: any[]) => any, iter: number, callArgs: any[]) => Promise<void>} BenchmarkFn
 */

/**
 * Run a benchmarking loop for a given function.
 * Falls back to a local implementation if sohl.utils.benchmark is not available.
 *
 * @param {(...args: any[]) => any} func - The function to benchmark.
 * @param {number} iterations - How many times to invoke the function.
 * @param {...any} args - Arguments to pass to the function on each call.
 * @returns {Promise<void>} Resolves when complete.
 * @see https://foundryvtt.com/api/sohl.utils.html#benchmark
 */
export async function benchmark(func, iterations, ...args) {
    /** @type {BenchmarkFn} */
    const fallback = async (fn, iter, callArgs) => {
        for (let i = 0; i < iter; i++) {
            const result = fn(...callArgs);
            if (result instanceof Promise) await result;
        }
    };

    /** @type {BenchmarkFn} */
    const impl = foundry?.utils?.benchmark ?? fallback;

    return impl(func, iterations, args);
}

/**
 * Apply special keys like `merge`, `overwrite`, etc., to an object.
 * Falls back to identity function if `sohl.utils.applySpecialKeys` is not available.
 *
 * @template T
 * @param {T} obj - The object to transform.
 * @returns {T} The transformed object (or original if no-op).
 * @see https://foundryvtt.com/api/sohl.utils.html#applySpecialKeys
 */
export function applySpecialKeys(obj) {
    /** @type {(o: any) => any} */
    const impl =
        /** @type {any} */ (foundry?.utils)?.applySpecialKeys ?? ((o) => o);
    return impl(obj);
}

/**
 * Compare objects for equality.
 * @param {any} a
 * @param {any} b
 * @returns {boolean}
 * @see https://foundryvtt.com/api/sohl.utils.html#objectsEqual
 */
export function objectsEqual(a, b) {
    const impl =
        foundry?.utils?.objectsEqual ??
        ((x, y) => JSON.stringify(x) === JSON.stringify(y));
    return impl(a, b);
}

/**
 * Clone an object deeply.
 * @param {any} obj
 * @returns {any}
 * @see https://foundryvtt.com/api/sohl.utils.html#duplicate
 */
export function duplicate(obj) {
    const impl =
        foundry?.utils?.duplicate ?? ((o) => JSON.parse(JSON.stringify(o)));
    return impl(obj);
}

/**
 * Check if a key press string corresponds to a deletion key (e.g. "Delete", "Backspace").
 * Falls back to a local check if not available in `foundry.utils`.
 *
 * @param {string} key - The key string to check.
 * @returns {boolean} True if the key is a deletion key.
 * @see https://foundryvtt.com/api/sohl.utils.html#isDeletionKey
 */
export function isDeletionKey(key) {
    /** @type {(key: string) => boolean} */
    const impl =
        /** @type {any} */ (foundry?.utils)?.isDeletionKey ??
        ((k) => k === "Delete" || k === "Backspace");
    return impl(key);
}

/**
 * Check if one class is a subclass of another.
 * @param {new (...args: any[]) => any} cls - The constructor being checked.
 * @param {new (...args: any[]) => any} parent - The parent class constructor.
 * @returns {boolean} True if cls is a subclass of parent.
 * @see https://foundryvtt.com/api/sohl.utils.html#isSubclass
 */
export function isSubclass(cls, parent) {
    const impl =
        foundry?.utils?.isSubclass ?? ((c, p) => c.prototype instanceof p);
    return impl(cls, parent);
}

/**
 * Get the defining class of a property.
 * @param {object} obj
 * @param {string} property
 * @returns {Function|undefined}
 * @see https://foundryvtt.com/api/sohl.utils.html#getDefiningClass
 */
export function getDefiningClass(obj, property) {
    const impl =
        foundry?.utils?.getDefiningClass ??
        ((o, p) => {
            while (o && !Object.prototype.hasOwnProperty.call(o, p))
                o = Object.getPrototypeOf(o);
            return o?.constructor;
        });
    return impl(obj, property);
}

/**
 * Encode a URI component safely.
 * @param {string} str
 * @returns {string}
 * @see https://foundryvtt.com/api/sohl.utils.html#encodeURL
 */
export function encodeURL(str) {
    const impl = foundry?.utils?.encodeURL ?? encodeURIComponent;
    return impl(str);
}

/**
 * Expand a flattened object.
 * @param {object} obj
 * @returns {object}
 * @see https://foundryvtt.com/api/sohl.utils.html#expandObject
 */
export function expandObject(obj) {
    const impl = foundry?.utils?.expandObject ?? ((o) => o);
    return impl(obj);
}

/**
 * Filter properties from an object.
 * @template T
 * @param {T} obj - The object to filter.
 * @param {(value: T[keyof T], key: string) => boolean} fn - The filter function.
 * @returns {Partial<T>} A new object with only matching entries.
 * @see https://foundryvtt.com/api/sohl.utils.html#filterObject
 */
export function filterObject(obj, fn) {
    /** @type {(o: any, f: (v: any, k: string) => boolean) => any} */
    const impl =
        /** @type {any} */ (foundry?.utils)?.filterObject ??
        ((o, f) =>
            Object.fromEntries(Object.entries(o).filter(([k, v]) => f(v, k))));
    return impl(obj, fn);
}

/**
 * Flatten a nested object.
 * @param {object} obj
 * @param {number} [depth=0]
 * @returns {object}
 * @see https://foundryvtt.com/api/sohl.utils.html#flattenObject
 */
export function flattenObject(obj, depth = 0) {
    const impl = foundry?.utils?.flattenObject ?? ((o) => o);
    return impl(obj, depth);
}

/**
 * Get parent classes for a class.
 * @param {new (...args: any[]) => any} cls - The constructor being checked.
 * @returns {Function[]}
 * @see https://foundryvtt.com/api/sohl.utils.html#getParentClasses
 */
export function getParentClasses(cls) {
    const impl = foundry?.utils?.getParentClasses ?? ((cls) => []);
    return impl(cls);
}

/**
 * Get a route path.
 * @param {string} path
 * @returns {string}
 * @see https://foundryvtt.com/api/sohl.utils.html#getRoute
 */
export function getRoute(path) {
    const impl = foundry?.utils?.getRoute ?? ((p) => p);
    return impl(path);
}

/**
 * Determine the type of a value.
 * @param {any} value
 * @returns {string}
 * @see https://foundryvtt.com/api/sohl.utils.html#getType
 */
export function getType(value) {
    const impl = foundry?.utils?.getType ?? ((v) => typeof v);
    return impl(value);
}

/**
 * Check if an object has a property.
 * @param {object} obj
 * @param {string} path
 * @returns {boolean}
 * @see https://foundryvtt.com/api/sohl.utils.html#hasProperty
 */
export function hasProperty(obj, path) {
    const impl = foundry?.utils?.hasProperty ?? ((o, p) => p in o);
    return impl(obj, path);
}

/**
 * Get a property from an object.
 * @param {object} obj
 * @param {string} path
 * @returns {any}
 * @see https://foundryvtt.com/api/sohl.utils.html#getProperty
 */
export function getProperty(obj, path) {
    const impl = foundry?.utils?.getProperty ?? ((o, p) => o[p]);
    return impl(obj, path);
}

/**
 * Set a property on an object.
 * @param {object} obj
 * @param {string} path
 * @param {any} value
 * @returns {object}
 * @see https://foundryvtt.com/api/sohl.utils.html#setProperty
 */
export function setProperty(obj, path, value) {
    const impl = foundry?.utils?.setProperty ?? ((o, p, v) => ((o[p] = v), o));
    return impl(obj, path, value);
}

/**
 * Delete a property from an object.
 * @param {object} obj
 * @param {string} path
 * @returns {boolean}
 * @see https://foundryvtt.com/api/sohl.utils.html#deleteProperty
 */
export function deleteProperty(obj, path) {
    const impl =
        /** @type {any} */ (foundry?.utils)?.deleteProperty ??
        ((o, p) => delete o[p]);
    return impl(obj, path);
}

/**
 * Invert keys and values of an object.
 * @param {object} obj
 * @returns {object}
 * @see https://foundryvtt.com/api/sohl.utils.html#invertObject
 */
export function invertObject(obj) {
    const impl =
        foundry?.utils?.invertObject ??
        ((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k])));
    return impl(obj);
}

/**
 * Check if version string A is newer than B.
 * @param {string} v1
 * @param {string} v2
 * @returns {boolean}
 * @see https://foundryvtt.com/api/sohl.utils.html#isNewerVersion
 */
export function isNewerVersion(v1, v2) {
    const impl = foundry?.utils?.isNewerVersion ?? ((a, b) => a > b);
    return impl(v1, v2);
}

/**
 * Parse an S3 URL.
 * @param {string} url
 * @returns {object}
 * @see https://foundryvtt.com/api/sohl.utils.html#parseS3URL
 */
export function parseS3URL(url) {
    const impl = foundry?.utils?.parseS3URL ?? ((url) => new URL(url));
    return impl(url);
}

/**
 * Build a UUID from parts.
 * @param {...string} parts
 * @returns {string}
 * @see https://foundryvtt.com/api/sohl.utils.html#buildUuid
 */
export function buildUuid(...parts) {
    const impl =
        /** @type {any} */ (foundry?.utils)?.buildUuid ??
        ((...p) => p.join("."));
    return impl(...parts);
}

/**
 * Escape HTML special characters.
 * @param {string} str
 * @returns {string}
 * @see https://foundryvtt.com/api/sohl.utils.html#escapeHTML
 */
export function escapeHTML(str) {
    const impl =
        /** @type {any} */ (foundry?.utils)?.escapeHTML ??
        ((s) =>
            s.replace(
                /[&<>"]/g,
                (c) =>
                    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[
                        c
                    ],
            ));
    return impl(str);
}

/**
 * Unescape HTML entities.
 * @param {string} str
 * @returns {string}
 * @see https://foundryvtt.com/api/sohl.utils.html#unescapeHTML
 */
export function unescapeHTML(str) {
    const impl =
        /** @type {any} */ (foundry?.utils)?.unescapeHTML ??
        ((s) =>
            s.replace(
                /&(?:amp|lt|gt|quot);/g,
                (c) =>
                    ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"' })[
                        c
                    ],
            ));
    return impl(str);
}

/**
 * A wrapper around Foundry's Collection class, or a compatible fallback if Foundry is not available.
 * This class uses composition, not inheritance, to avoid signature conflicts.
 *
 * @template V
 */
export class SohlCollection {
    /**
     * @param {Iterable<[string, V]>} [entries]
     */
    constructor(entries) {
        const FoundryCollection = foundry?.utils?.Collection;
        this._isFoundry = Boolean(FoundryCollection);
        this._collection =
            FoundryCollection ?
                new FoundryCollection(entries ? Array.from(entries) : undefined)
            :   new Map(entries);
    }

    /**
     * FoundryVTT's Collection overrides `[Symbol.iterator]()` to return values directly.
     * We use a method to explicitly yield the same.
     *
     * @returns {IterableIterator<V>}
     */
    iterateValues() {
        return this._collection instanceof Map ?
                this._collection.values()
            :   /** @type {IterableIterator<V>} */ (
                    this._collection[Symbol.iterator]()
                );
    }

    /**
     * All values in the collection.
     * @returns {V[]}
     */
    get contents() {
        return Array.from(this.iterateValues());
    }

    /**
     * Get an entry by its key.
     * @param {string} key
     * @param {{strict?: boolean}} [options]
     * @returns {V|undefined}
     */
    get(key, { strict = false } = {}) {
        const entry = this._collection.get(key);
        if (strict && entry === undefined) {
            throw new Error(`Key ${key} not found in SohlCollection.`);
        }
        return entry;
    }

    /**
     * Find an entry by a condition.
     * @param {(value: V, index: number, coll: this) => boolean} condition
     * @returns {V|undefined}
     */
    find(condition) {
        let i = 0;
        for (const v of this.iterateValues()) {
            if (condition(v, i++, this)) return v;
        }
        return undefined;
    }

    /**
     * Filter entries by a condition.
     * @param {(value: V, index: number, coll: this) => boolean} condition
     * @returns {V[]}
     */
    filter(condition) {
        const result = [];
        let i = 0;
        for (const v of this.iterateValues()) {
            if (condition(v, i++, this)) result.push(v);
        }
        return result;
    }

    /**
     * Apply a function to each element.
     * @param {(value: V, key: string, coll: any) => void} fn
     * @param {*} [thisArg]
     */
    forEach(fn, thisArg) {
        if (this._collection instanceof Map) {
            for (const [k, v] of this._collection.entries()) {
                fn.call(thisArg, v, k, this._collection);
            }
        } else {
            let i = 0;
            for (const v of this._collection) {
                const key =
                    (
                        typeof v === "object" &&
                        v &&
                        "id" in v &&
                        typeof v.id === "string"
                    ) ?
                        v.id
                    :   `index-${i++}`;
                fn.call(thisArg, v, key, this._collection);
            }
        }
    }

    /**
     * Get an entry by its name property.
     * @param {string} name
     * @param {{strict?: boolean}} [options]
     * @returns {V|undefined}
     */
    getName(name, { strict = false } = {}) {
        const entry = this.find(
            (e) =>
                typeof e === "object" &&
                e !== null &&
                "name" in e &&
                e.name === name,
        );

        if (strict && entry === undefined) {
            throw new Error(`Name "${name}" not found in SohlCollection.`);
        }

        return entry;
    }

    /**
     * Map each value to something else.
     * @param {(value: V, index: number, coll: this) => any} transformer
     * @returns {any[]}
     */
    map(transformer) {
        const out = [];
        let i = 0;
        for (const v of this.iterateValues()) {
            out.push(transformer(v, i++, this));
        }
        return out;
    }

    /**
     * Reduce the collection.
     * @param {(acc: any, value: V, index: number, coll: this) => any} reducer
     * @param {*} initial
     * @returns {*}
     */
    reduce(reducer, initial) {
        let acc = initial;
        let i = 0;
        for (const v of this.iterateValues()) {
            acc = reducer(acc, v, i++, this);
        }
        return acc;
    }

    /**
     * Check if at least one item passes a condition.
     * @param {(value: V, index: number, coll: this) => boolean} condition
     * @returns {boolean}
     */
    some(condition) {
        let i = 0;
        for (const v of this.iterateValues()) {
            if (condition(v, i++, this)) return true;
        }
        return false;
    }

    /**
     * Convert to JSON.
     * @returns {object[]}
     */
    toJSON() {
        return this.map((e) => {
            if (
                e &&
                typeof e === "object" &&
                "toJSON" in e &&
                typeof e.toJSON === "function"
            ) {
                return e.toJSON();
            }
            return e;
        });
    }
}
