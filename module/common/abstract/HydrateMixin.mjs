/**
 * @template {object} T
 * @typedef {new (...args: any[]) => T} Constructor
 */

/**
 * @template {object} T
 * @typedef {Constructor<T> & {
 *    fromData(data: UnknownObject, context?: UnknownObject): T
 * }} HydrateableConstructor
 */

/**
 * A mixin function that extends a base class to provide functionality for hydrating
 * and restoring data into its original form. This mixin handles various data types
 * including primitives, strings, arrays, objects, Maps, Sets, and custom classes.
 *
 *
 * @template {object} T
 * @param {Constructor<T>} Base
 * @returns {HydrateableConstructor<T>}
 */
export function HydrateMixin(Base) {
    return class extends Base {
        /**
         * @param {any} data
         * @param {any} [context]
         * @returns {T}
         */
        static fromData(data, context = {}) {
            return new this(data, context);
        }
    };
}
