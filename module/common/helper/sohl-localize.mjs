import * as utils from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/utils/module.mjs";

/**
 * A utility class for localization and internationalization (i18n) in FoundryVTT.
 * Provides methods for locale-aware string comparison, object sorting, and formatting
 * of durations, relative times, numbers, lists, and internationalized strings.
 *
 * @class SohlLocalize
 * @example
 * // Example usage:
 * const sortedObjects = SohlLocalize.sortObjects(objectsArray, "name");
 * const formattedDuration = SohlLocalize.formatDuration({ hours: 1, minutes: 30 });
 * const localizedString = SohlLocalize.format("HELLO_WORLD", { count: 2 });
 */

export class SohlLocalize {
    static get lang() {
        return game.i18n?.lang ?? "en";
    }

    /**
     * Locale-aware string comparison.
     * @param {string} first
     * @param {string} second
     * @returns {number} - Negative if first < second, 0 if equal, positive if first > second
     */
    static compare(first, second) {
        const collator = new Intl.Collator(SohlLocalize.lang);
        return collator.compare(first, second);
    }

    /**
     * Sorts an array of objects based on the values of a specified property key.
     *
     * @param {Object[]} objects - The array of objects to be sorted.
     * @param {string} key - The property key used to retrieve values for comparison.
     * @returns {Object[]} The sorted array of objects.
     */
    static sortObjects(objects, key) {
        objects.sort((a, b) => {
            return this.compare(
                sohl.utils.getProperty(a, key),
                sohl.utils.getProperty(b, key),
            );
        });
        return objects;
    }

    /**
     * Formats a duration value into a localized string representation.
     *
     * @param {Object} value - The duration value to format. This should be an object
     *                         containing properties such as years, months, days, hours,
     *                         minutes, and seconds, as supported by `Intl.DurationFormat`.
     * @returns {string} A localized, formatted string representing the duration.
     */
    static formatDuration(value) {
        const formatter = new Intl.DurationFormat(SohlLocalize.lang, {
            style: "narrow",
        });
        return formatter.format(value);
    }

    /**
     * Formats a relative time value into a localized string.
     *
     * @param {number} value - The numeric value representing the amount of time.
     * @param {Intl.RelativeTimeFormatUnit} unit - The unit of time to format (e.g., "second", "minute", "hour", "day", "week", "month", "year").
     * @returns {string} A localized string representing the relative time.
     */
    static formatRelativeTime(value, unit) {
        const formatter = new Intl.RelativeTimeFormat(SohlLocalize.lang);
        return formatter.format(value, unit);
    }

    /**
     * Formats a given number according to the current locale settings.
     *
     * @param {number} value - The number to be formatted.
     * @returns {string} The formatted number as a string.
     */
    static formatNumber(value) {
        const formatter = new Intl.NumberFormat(SohlLocalize.lang);
        return formatter.format(value);
    }

    /**
     * Formats an array of strings into a localized, human-readable list using "and" as the conjunction.
     *
     * @param {string[]} value - An array of strings to be formatted into a list.
     * @returns {string} A formatted string representing the list with proper localization.
     *
     * @example
     * // Assuming SohlLocalize.lang is set to "en":
     * formatListAnd(["apple", "banana", "cherry"]);
     * // Returns: "apple, banana, and cherry"
     */
    static formatListAnd(value) {
        const formatter = new Intl.ListFormat(SohlLocalize.lang, {
            style: "long",
            type: "conjunction",
        });
        return formatter.format(value);
    }

    /**
     * Formats an array of strings into a localized, human-readable list using "or" as the conjunction.
     *
     * @param {string[]} value - An array of strings to format into a list.
     * @returns {string} A formatted string representing the list with "or" as the conjunction.
     *
     * @example
     * // Assuming SohlLocalize.lang is set to "en":
     * formatListOr(["apple", "banana", "cherry"]);
     * // Returns: "apple, banana, or cherry"
     */
    static formatListOr(value) {
        const formatter = new Intl.ListFormat(SohlLocalize.lang, {
            style: "long",
            type: "disjunction",
        });
        return formatter.format(value);
    }

    /**
     * Outputs an internationalized string, formatting it with data from the values object.  If the values
     * object includes 'count', then the messageKey will be modified to include the plural as a suffix.
     * E.g., if messageKey = MSG, count = 1, and lang = en-US, resulting key will become "MSG.one"
     *
     * @param {*} messageKey
     * @param {object} values Data values to pass to format function
     * @param {number} [values.count] If present, plural rules will be used to select the correct form.
     * @param {boolean} [values.ordinal] If true, plural rules will use ordinal type, otherwise cardinal
     * @returns {string} The formatted string.
     */
    static format(messageKey, values = {}) {
        if (values.count) {
            const plurals = new Intl.PluralRules(SohlLocalize.lang, {
                type: values.ordinal ? "ordinal" : "cardinal",
            });
            const plural = plurals.select(values.count);
            messageKey = `${messageKey}.${plural}`;
        }
        return game.i18n?.format(messageKey) || "";
    }
}
/**
 * Localizes a string based on the provided string ID and optional data.
 *
 * @param {string} stringId - The identifier for the localized string.
 * @param {Object} [data={}] - An optional object containing data to interpolate into the localized string.
 * @returns {string} The localized and formatted string.
 */
export function _l(stringId, data = {}) {
    return SohlLocalize.format(stringId, data);
} /**
 * Retrieves the current language setting from the game's internationalization (i18n) system.
 * If the language is not defined, it defaults to "en" (English).
 *
 * @returns {string} The current language code (e.g., "en", "fr", "de").
 */
function getLang() {
    return game.i18n?.lang ?? "en";
}
