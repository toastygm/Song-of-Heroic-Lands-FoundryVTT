/**
 * @file SohlLocalize.ts
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

export enum TemporalDirection {
    PAST = "past",
    FUTURE = "future",
    NOW = "now",
}

/**
 * A partial duration object compatible with Intl.DurationFormat.
 */
export type DurationValue = {
    direction?: TemporalDirection;
    years?: number;
    months?: number;
    weeks?: number;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
};

/**
 * A utility class for localization and internationalization (i18n).
 * Provides methods for locale-aware string comparison, sorting, formatting of durations,
 * relative times, numbers, lists, and message templates.
 */
export class SohlLocalize {
    private static _instance: SohlLocalize | null = null;
    private _lang: string;

    private constructor(options: { lang?: string } = {}) {
        this._lang = options.lang ?? game?.i18n?.lang ?? "en";
    }

    // Static method to get the singleton instance
    public static getInstance(options: { lang?: string } = {}): SohlLocalize {
        if (!SohlLocalize._instance) {
            SohlLocalize._instance = new SohlLocalize(options);
        }
        return SohlLocalize._instance;
    }

    get lang(): string {
        return this._lang;
    }

    /**
     * Locale-aware string comparison.
     * @param first - The first string to compare.
     * @param second - The second string to compare.
     * @returns A negative number if first < second, 0 if equal, positive if first > second.
     */
    compare(first: string, second: string): number {
        return new Intl.Collator(this.lang).compare(first, second);
    }

    /**
     * Sort an array of objects by a property using locale-aware string comparison.
     * @param objects - The array of objects to sort.
     * @param key - The key to sort by (dot-separated path).
     * @returns The sorted array.
     */
    sortObjects<T extends Record<string, any>>(objects: T[], key: string): T[] {
        objects.sort((a, b) => {
            return this.compare(
                sohl.utils.getProperty(a, key),
                sohl.utils.getProperty(b, key),
            );
        });
        return objects;
    }

    /**
     * Format a duration object into a compact string (e.g., "2y 3m 5d").
     * Falls back to English formatting for unsupported languages.
     * @param value - An object with time fields to format.
     * @returns A formatted string.
     */
    formatDuration(value: DurationValue): string {
        switch (this.lang) {
            case "en":
            default:
                return SohlLocalize._formatDurationEn(value);
        }
    }

    /**
     * Internal formatter for English duration strings.
     * Outputs a space-separated string of abbreviated time parts.
     * @param value - Duration components.
     * @returns Formatted string like "2y 3m 4d"
     */
    private static _formatDurationEn(value: DurationValue): string {
        if (value?.direction !== TemporalDirection.NOW) {
            const parts: string[] = [];
            if (value.years) parts.push(`${value.years}y`);
            if (value.months) parts.push(`${value.months}mo`);
            if (value.weeks) parts.push(`${value.weeks}w`);
            if (value.days) parts.push(`${value.days}d`);
            if (value.hours) parts.push(`${value.hours}h`);
            if (value.minutes) parts.push(`${value.minutes}m`);
            if (value.seconds) parts.push(`${value.seconds}s`);
            let result = parts.join(" ");
            if (value.direction === TemporalDirection.PAST) {
                return `${result} ago`;
            } else if (value.direction === TemporalDirection.FUTURE) {
                return `in ${result}`;
            }
        }
        return "Now";
    }

    /**
     * Format a value relative to now.
     * @param value - Numeric value.
     * @param unit - A time unit for Intl.RelativeTimeFormat.
     * @returns A formatted string.
     */
    formatRelativeTime(
        value: number,
        unit: Intl.RelativeTimeFormatUnit,
    ): string {
        return new Intl.RelativeTimeFormat(this.lang).format(value, unit);
    }

    /**
     * Format a number in the current locale.
     * @param value - The number to format.
     * @returns A formatted string.
     */
    formatNumber(value: number): string {
        return new Intl.NumberFormat(this.lang).format(value);
    }

    /**
     * Format a list with "+and" conjunction.
     * @param value - Array of string items.
     * @returns A human-readable, localized list.
     */
    formatListAnd(value: string[]): string {
        return new Intl.ListFormat(this.lang, {
            style: "long",
            type: "conjunction",
        }).format(value);
    }

    /**
     * Format a list with "or" disjunction.
     * @param value - Array of string items.
     * @returns A human-readable, localized list.
     */
    formatListOr(value: string[]): string {
        return new Intl.ListFormat(this.lang, {
            style: "long",
            type: "disjunction",
        }).format(value);
    }

    /**
     * Format an internationalized message string, optionally pluralized.
     * @param messageKey - The base key to use for i18n.
     * @param values - An object containing interpolation values.
     * @param values.count - If present, plural form will be chosen.
     * @param values.ordinal - If true, uses ordinal plural rules.
     * @param values.useFallback - If true, uses fallback localization ("en" by default).
     * @returns A formatted message string.
     */
    format(
        messageKey: string,
        values: {
            count?: number;
            ordinal?: boolean;
            useFallback?: boolean;
        } & Record<
            Exclude<string, "count" | "ordinal" | "useFallback">,
            string
        > = {},
    ): string {
        if (values.count != null) {
            const rule = new Intl.PluralRules(values.lang, {
                type: values.ordinal ? "ordinal" : "cardinal",
            });
            const form = rule.select(values.count);
            messageKey = `${messageKey}.${form}`;
        }
        let str = this.localize(messageKey, values.useFallback);
        const fmt = /{[^}]+/g;
        str = str.replace(fmt, (k: string) => values[k.slice(1, -1)]);
        return str || "";
    }

    /**
     * Localizes a string based on the provided string ID using the game's internationalization system.
     * If the string ID is not found or is invalid, it returns the string ID itself as a fallback.
     *
     * @param stringId - The ID of the string to localize. This should correspond to a key in the localization files.
     * @param useFallback - If true, attempts to use a fallback localization if the string ID is not found.
     *                      Defaults to false.
     * @returns The localized string if found, or the string ID itself if not found or invalid.
     */
    localize(stringId: string, useFallback: boolean = false): string {
        if (!useFallback) {
            return game.i18n.localize(stringId);
        } else {
            const v = foundry.utils.getProperty(game.i18n._fallback, stringId);
            return typeof v === "string" ? v : stringId;
        }
    }

    /**
     * Convert seconds to a DurationValue object
     * @param seconds - The number of seconds to convert
     * @returns A DurationValue object
     */
    secondsToDuration(seconds: number): DurationValue {
        let duration: DurationValue = {};
        if (seconds < 0) {
            duration.direction = TemporalDirection.PAST;
        } else if (seconds > 0) {
            duration.direction = TemporalDirection.FUTURE;
        } else {
            duration.direction = TemporalDirection.NOW;
        }
        duration.days = Math.floor(seconds / 86400);
        seconds %= 86400;
        duration.hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        duration.minutes = Math.floor(seconds / 60);
        duration.seconds = seconds % 60;
        return duration;
    }
}

/**
 * Alias for internationalized message formatting.
 * @param stringId - i18n key to look up.
 * @param data - Optional interpolation values.
 * @returns Localized string.
 */
export function _l(stringId: string, data: Record<string, any> = {}): string {
    return sohl.i18n.format(stringId, data);
}
