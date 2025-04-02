/**
 * @file helpers.ts
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

/**
 * A collection of constant character symbols used across the system.
 */
export const CHARS: StrictObject<string> = {
    TIMES: "\u00D7",
    GREATERTHANOREQUAL: "\u2265",
    LESSTHANOREQUAL: "\u2264",
    INFINITY: "\u221E",
    STARF: "\u2605",
    STAR: "\u2606",
};

/**
 * Creates a deep clone of a value.
 * @template T
 * @param {T} value - The value to clone.
 * @param {{ strict?: boolean }} [options] - Whether to throw on non-plain objects.
 * @returns {T} The deep clone.
 */
export function deepClone<T>(
    value: T,
    { strict = false }: { strict?: boolean } = {},
): T {
    function recurse(val: any, depth: number): any {
        if (depth > 100) throw new Error("Max depth exceeded in deepClone");
        if (val === null || typeof val !== "object") return val;
        if (val instanceof Date) return new Date(val);
        if (Array.isArray(val)) return val.map((v) => recurse(v, depth + 1));
        if (val.constructor !== Object) {
            if (strict) throw new Error("Cannot deepClone non-plain objects");
            return val;
        }
        const clone: any = {};
        for (const key in val) clone[key] = recurse(val[key], depth + 1);
        return clone;
    }
    return recurse(value, 0);
}

/**
 * Checks if two values or objects are deeply equal.
 * @param {any} a - First value.
 * @param {any} b - Second value.
 * @returns {boolean} True if the values are deeply equal.
 */
export function objectsEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b || typeof a !== "object" || typeof b !== "object")
        return false;
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
        if (!objectsEqual(a[key], b[key])) return false;
    }
    return true;
}

/**
 * Determines if a class is a subclass of another class.
 * @param {unknown} cls - The candidate class.
 * @param {Function} parent - The parent class.
 * @returns {boolean} True if `cls` is a subclass of `parent`.
 */
export function isSubclass(cls: unknown, parent: Function): boolean {
    if (typeof cls !== "function") return false;
    return cls === parent || parent.isPrototypeOf(cls);
}

/**
 * Finds the class that defines a property.
 * @param {object | Function} target - The instance or constructor.
 * @param {string} property - The property name.
 * @returns {Optional<Function>} The class that defines the property.
 */
export function getDefiningClass(
    target: object | Function,
    property: string,
): Optional<Function> {
    const proto =
        typeof target === "function" ? target : Object.getPrototypeOf(target);
    let current = proto;
    while (current) {
        if (Object.prototype.hasOwnProperty.call(current, property)) {
            return typeof target === "function" ? current : current.constructor;
        }
        current = Object.getPrototypeOf(current);
    }
    return undefined;
}

interface InIdCacheOptions {
    save?: boolean;
}

const IDCACHE = new Set<string>();
function _inIdCache(
    id: string,
    options: InIdCacheOptions = { save: true },
): boolean {
    if (IDCACHE.has(id)) return true;
    if (options.save) IDCACHE.add(id);
    return false;
}

export function generateUniqueId(): string {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let idStr: string = "";

    // Keep generating until we find a unique id
    while (!idStr) {
        let result: string[] = [];
        for (let i = 0; i < 16; i++) {
            result.push(
                chars.charAt(Math.floor(game.twist.random() * chars.length)),
            );
        }

        idStr = result.join("");
        if (_inIdCache(idStr)) idStr = "";
    }
    return idStr;
}
/**
 * Safely encodes each segment of a URL path.
 * @param {string} path - The URL path.
 * @returns {string} The encoded path.
 */
export function encodeURL(path: string): string {
    const parts = path.split("/");
    return parts
        .map((p) => encodeURIComponent(p).replace(/'/g, "%27"))
        .join("/");
}

/**
 * Expands a flattened object with dot-separated keys into nested structure.
 * @param {PlainObject} flat - The flattened object.
 * @returns {PlainObject} The expanded object.
 */
export function expandObject(flat: PlainObject): PlainObject {
    const expanded: PlainObject = {};
    for (const [compoundKey, value] of Object.entries(flat)) {
        setProperty(expanded, compoundKey, value);
    }
    return expanded;
}

/**
 * Filters a source object based on the shape of a template object.
 * @param {PlainObject} source - The object to filter.
 * @param {PlainObject} template - Template shape to follow.
 * @returns {PlainObject} Filtered object.
 */
export function filterObject(
    source: PlainObject,
    template: PlainObject,
): PlainObject {
    const filtered: PlainObject = {};
    for (const key in template) {
        if (key in source) {
            const sourceValue = source[key];
            const templateValue = template[key];
            if (
                typeof sourceValue === "object" &&
                typeof templateValue === "object"
            ) {
                filtered[key] = filterObject(sourceValue, templateValue);
            } else {
                filtered[key] = sourceValue;
            }
        }
    }
    return filtered;
}

/**
 * Flattens a nested object into dot-separated keys.
 * @param {PlainObject} obj - The object to flatten.
 * @param {string} [prefix] - Current prefix path.
 * @param {PlainObject} [result] - Accumulator object.
 * @returns {PlainObject} Flattened object.
 */
export function flattenObject(
    obj: PlainObject,
    prefix = "",
    result: PlainObject = {},
): PlainObject {
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
            flattenObject(value, newKey, result);
        } else {
            result[newKey] = value;
        }
    }
    return result;
}

/**
 * Returns all parent classes of a given class.
 * @param {Function} cls - The class to inspect.
 * @returns {Function[]} List of parent classes.
 */
export function getParentClasses(cls: Function): Function[] {
    const parents: Function[] = [];
    let current = Object.getPrototypeOf(cls);
    while (current && current !== Function.prototype) {
        parents.push(current);
        current = Object.getPrototypeOf(current);
    }
    return parents;
}

/**
 * Returns a string describing the type of a value.
 * @param {unknown} value - The value to inspect.
 * @returns {string} Type name.
 */
export function getType(value: unknown): string {
    if (value === null) return "null";
    if (Array.isArray(value)) return "Array";
    if (value instanceof Set) return "Set";
    if (value instanceof Map) return "Map";
    if (value instanceof Date) return "Date";
    return typeof value;
}

/**
 * Checks if an object has a property, even deeply nested.
 * @param {any} obj - The object to search.
 * @param {string} key - Dot-separated key.
 * @returns {boolean} True if property exists.
 */
export function hasProperty(obj: any, key: string): boolean {
    return getProperty(obj, key) !== undefined;
}

/**
 * Retrieves a property using a dot-separated key.
 * @param {any} obj - The object.
 * @param {string} key - Dot-separated key path.
 * @returns {any} The value.
 */
export function getProperty(obj: any, key: string): any {
    return key.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}

/**
 * Sets a property using a dot-separated key path.
 * @param {any} obj - The object to update.
 * @param {string} key - Dot-separated key path.
 * @param {any} value - New value.
 * @returns {boolean} True if value was changed.
 */
export function setProperty(obj: any, key: string, value: any): boolean {
    const keys = key.split(".");
    let current = obj;
    while (keys.length > 1) {
        const part = keys.shift()!;
        current = current[part] = current[part] ?? {};
    }
    const finalKey = keys[0];
    const changed = current[finalKey] !== value;
    current[finalKey] = value;
    return changed;
}

/**
 * Deletes a property using a dot-separated key path.
 * @param {any} obj - The object.
 * @param {string} key - Dot-separated key.
 * @returns {boolean} True if deletion occurred.
 */
export function deleteProperty(obj: any, key: string): boolean {
    const keys = key.split(".");
    const last = keys.pop();
    const target = keys.reduce((o, k) => (o ? o[k] : undefined), obj);
    return target && last ? delete target[last] : false;
}

/**
 * Inverts the keys and values of an object.
 * @param {PlainObject} obj - The object to invert.
 * @returns {PlainObject} Inverted object.
 */
export function invertObject(obj: PlainObject): PlainObject {
    const inverted: PlainObject = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v in inverted) throw new Error("Values must be unique to invert");
        inverted[v] = k;
    }
    return inverted;
}

/**
 * Checks if a value is considered empty.
 * @param {any} value - The value to inspect.
 * @returns {boolean} True if empty.
 */
export function isEmpty(value: any): boolean {
    if (value == null) return true;
    if (typeof value === "string") return value.length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (value instanceof Map || value instanceof Set) return value.size === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
}

/**
 * Deeply merges properties from source into target.
 * @param {PlainObject} target - Target object.
 * @param {PlainObject} source - Source object.
 * @returns {PlainObject} Merged object.
 */
export function mergeObject(
    target: PlainObject,
    source: PlainObject,
): PlainObject {
    for (const [k, v] of Object.entries(source)) {
        if (
            typeof target[k] === "object" &&
            typeof v === "object" &&
            !Array.isArray(target[k]) &&
            !Array.isArray(v)
        ) {
            target[k] = mergeObject({ ...target[k] }, v);
        } else {
            target[k] = v;
        }
    }
    return target;
}

/**
 * Escapes HTML special characters.
 * @param {string} str - Input string.
 * @returns {string} Escaped string.
 */
export function escapeHTML(str: string): string {
    return str.replace(
        /[&<>"']/g,
        (char) =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#x27;",
            })[char]!,
    );
}

/**
 * Unescapes HTML special characters.
 * @param {string} str - Escaped string.
 * @returns {string} Unescaped string.
 */
export function unescapeHTML(str: string): string {
    return str.replace(
        /&(amp|lt|gt|quot|#x27);/g,
        (match) =>
            ({
                "&amp;": "&",
                "&lt;": "<",
                "&gt;": ">",
                "&quot;": '"',
                "&#x27;": "'",
            })[match]!,
    );
}

/**
 * Returns the value of a SOHL system setting.
 *
 * @template T - The expected return type of the setting.
 * @param key - The key of the setting to retrieve.
 * @returns The value of the setting.
 */
export function getSetting<T = unknown>(key: string): Optional<T> {
    return game.settings?.get("sohl", key) as T;
}

/**
 * Sets the value of a SOHL system setting.
 *
 * @template T - The type of the setting value.
 * @param key - The key of the setting to update.
 * @param value - The value to assign.
 * @returns A promise resolving once the setting has been updated.
 */
export function setSetting<T = unknown>(
    key: string,
    value: T,
): Optional<Promise<unknown>> {
    return game.settings?.set("sohl", key, value);
}

export function registerSetting<
    K extends string,
    T extends ClientSettings.Type,
>(key: K, data: ClientSettings.RegisterOptions<NoInfer<T>>): void {
    game.settings?.register("sohl", key, data);
}
