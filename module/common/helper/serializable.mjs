/** @typedef {import("@sohl-global")} */

/**
 * A base class for serializable objects with BigInt and undefined support.
 */
export class Serializable {
    /**
     * Convert this object to a plain, JSON-serializable structure.
     * @param {PlainObject} data - The data to serialize.
     * @returns {object}
     */
    toJSON(data = {}) {
        return Object.entries(this).reduce((acc, [k, v]) => {
            if (k in acc) return acc;
            if (typeof v === "bigint") acc[k] = `@bigint:${v.toString()}`;
            else if (typeof v === "undefined") acc[k] = "@undefined";
            else if (Array.isArray(v)) return v.map((o) => o.toJSON());
            else if (v && typeof v === "object") {
                const proto = Object.getPrototypeOf(v);
                if (proto !== Object.prototype && proto !== null) {
                    if (typeof v.toJSON === "function") acc[k] = v.toJSON();
                    throw new TypeError(
                        `Cannot serialize non-plain object: ${v.constructor?.name}`,
                    );
                }
                acc[k] = Object.fromEntries(
                    Object.entries(v).map(([k, v]) => [k, v.toJSON()]),
                );
            }
            return acc;
        }, data);
    }

    /**
     * Rehydrate a Serializable subclass from a string or plain object. Subclasses
     * should override this method to handle their own properties and construct
     * the object correctly.
     * @param {*} raw
     * @returns {Serializable}
     * @throws {Error} Throws an error if the method is not implemented by a subclass.
     * @abstract
     */
    static fromData(raw) {
        throw new Error("fromData() must be implemented by subclasses.");
    }

    /**
     * Rehydrate a Serializable subclass from a string or plain object.
     *
     * @static
     * @param {*} raw
     * @returns {PlainObject}
     * @throws {TypeError} Throws an error if the input is not a plain object or string.
     * @private
     */
    static _fromData(raw) {
        let parsed;

        if (typeof raw === "string") {
            parsed = JSON.parse(raw, (key, value) => {
                if (typeof value === "string") {
                    if (value === "@undefined") return undefined;
                    if (value.startsWith("@bigint:"))
                        return BigInt(value.slice(8));
                }
                return value;
            });
        } else if (raw === null) {
            return null;
        } else if (typeof raw === "object") {
            const proto = Object.getPrototypeOf(raw);
            if (proto === Object.prototype || proto === null) {
                parsed =
                    Array.isArray(raw) ?
                        raw.map((v) => this.fromData(v))
                    :   Object.fromEntries(
                            Object.entries(raw).map(([k, v]) => [
                                k,
                                this.fromData(v),
                            ]),
                        );
            } else {
                throw new TypeError(
                    "fromData() expects a plain object or string.",
                );
            }
        } else {
            parsed = raw;
        }

        return parsed;
    }
}
