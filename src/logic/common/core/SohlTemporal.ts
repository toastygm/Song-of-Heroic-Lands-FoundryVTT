/**
 * @file SohlTemporal.ts
 * @project Song of Heroic Lands (SoHL)
 * @module logic.common.core
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

import { SohlLocalize, DurationValue } from "@module/utils/SohlLocalize";

/**
 * SohlTemporal
 * Represents a point in game time, typically tied to worldTime.
 * Stores the time as a number for JSON serialization and provides
 * utility methods for formatted and localized display.
 */
export class SohlTemporal {
    /** The world time, stored as a numeric timestamp */
    protected _worldTime: number;

    constructor(worldTime?: number) {
        this._worldTime = worldTime ?? game.time.worldTime;
    }

    /** Get the time as a numeric value */
    get value(): number {
        return this._worldTime;
    }

    /** Set the time as a numeric value */
    set value(time: number) {
        this._worldTime = time;
    }

    formatWorldDate(time?: number): string {
        let worldDateLabel = "No Calendar";
        if (sohl.simpleCalendar) {
            time ??= this._worldTime;
            const ct = sohl.simpleCalendar.api.timestampToDate(time);
            worldDateLabel = `${ct.display.day} ${ct.display.monthName} ${ct.display.yearPrefix}${ct.display.year}${ct.display.yearPostfix} ${ct.display.time}`;
        }
        return worldDateLabel;
    }

    /**
     * Format the duration between the stored time and the provided time.
     * @param duration - The duration to format, or the current duration if not provided
     * @returns A human-readable string of the duration
     */
    formatDuration(duration?: DurationValue): string {
        duration ??= this.currentDuration();
        return sohl.i18n.formatDuration(duration);
    }

    /**
     * Advance time by a given amount
     * @param amount - The amount of time to advance
     */
    advanceTime(amount: number): void {
        this._worldTime += amount;
    }

    /**
     * Compare this time to another time
     * @param other - The other SohlTemporal to compare
     * @returns Positive if this is later, negative if earlier, 0 if equal
     */
    compare(other: SohlTemporal): number {
        return this._worldTime - other._worldTime;
    }

    /**
     * Check if the current time is in the past
     * @returns True if the time is in the past, false otherwise
     */
    past(): boolean {
        return this._worldTime < game.time.worldTime;
    }

    /**
     * Check if the current time is in the future
     * @returns True if the time is in the future, false otherwise
     */
    future(): boolean {
        return this._worldTime > game.time.worldTime;
    }

    /**
     * Compare the stored time to the current world time and return a DurationValue object
     * @returns A DurationValue representing the difference in time
     */
    currentDuration(): DurationValue {
        const diffInSeconds = Math.abs(game.time.worldTime - this._worldTime);
        return sohl.i18n.secondsToDuration(diffInSeconds);
    }

    /**
     * Convert the world time to a JSON-safe format (number)
     */
    toJSON(): number {
        return this._worldTime;
    }

    /**
     * Create a new instance from JSON data
     * @param data - Numeric time value
     */
    static fromJSON(data: number): SohlTemporal {
        return new SohlTemporal(data);
    }

    clone(): SohlTemporal {
        return new SohlTemporal(this._worldTime);
    }

    /**
     * Create a new instance from a numeric time value
     * @param time - The world time value to create from
     */
    static from(time: number): SohlTemporal {
        return new SohlTemporal(time);
    }
}
