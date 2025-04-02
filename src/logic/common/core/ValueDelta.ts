/**
 * @file ValueDelta.ts
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

import { BaseModifier } from "./BaseModifier"; // Adjust the path as needed

export enum DeltaInfo {
    DISABLED = "Dsbl",
    DURABILITY = "Dur",
    FATEBNS = "FateBns",
    ITEMWT = "ItmWt",
    MAGIC = "Magic",
    MAGICMOD = "MagicMod",
    MAXVALUE = "MaxVal",
    MINVALUE = "MinVal",
    MLATTRBOOST = "MlAtrBst",
    MLDSBL = "MLDsbl",
    NOFATE = "NoFateAvail",
    NOTATTRNOML = "NotAttrNoML",
    OFFHAND = "OffHnd",
    OUTNUMBERED = "Outn",
    PLAYER = "SitMod",
    SSMOD = "SSMod",
}

export enum ValueDeltaOperator {
    CUSTOM = 0,
    MULTIPLY = 1,
    ADD = 2,
    DOWNGRADE = 3,
    UPGRADE = 4,
    OVERRIDE = 5,
}

export interface ValueDeltaData {
    name: string;
    abbrev: string;
    op: ValueDeltaOperator;
    value: number | string;
}

// Constructor type for ValueDelta and its subclasses
export interface ValueDeltaConstructor<T extends ValueDelta = ValueDelta> {
    new (data: ValueDeltaData): T;
}

/**
 * Represents a single change (delta) applied to a numeric value.
 */
export class ValueDelta {
    private _name: string;
    private _abbrev: string;
    private _op: ValueDeltaOperator;
    private _value: number | string;

    static metadata = {
        name: "ValueDelta",
        schemaVersion: "0.5.0",
    };

    constructor({
        name,
        abbrev,
        op = ValueDeltaOperator.ADD,
        value = 0,
    }: ValueDeltaData) {
        if (!parent) {
            throw new Error("ValueDelta requires a parent BaseModifier");
        }

        if (!abbrev) {
            throw new Error("ValueDelta requires an abbrev");
        }

        if (!name?.startsWith("SOHL.DELTAINFO."))
            throw new Error("ValueDelta name must start with SOHL.DELTAINFO.");

        this._name = name;
        this._abbrev = abbrev;
        this._op = op;
        if (op === ValueDeltaOperator.CUSTOM) {
            if (typeof value !== "string") {
                throw new TypeError(
                    "ValueDelta value must be a string for CUSTOM operator",
                );
            } else if (value.toLowerCase() === "true") {
                this._value = "true";
            } else if (value.toLowerCase() === "false") {
                this._value = "false";
            }
        } else {
            if (typeof value !== "number") {
                throw new TypeError("ValueDelta value must be a number");
            }
        }
        this._value ??= value;
    }

    get name(): string {
        return this._name;
    }

    get abbrev(): string {
        return this._abbrev;
    }

    get op(): ValueDeltaOperator {
        return this._op;
    }

    get value(): number | string {
        return this._value;
    }

    /**
     * Apply this delta to a numeric base value.
     * @param {number} base
     * @returns {number}
     */
    apply(base: number): number {
        switch (this.op) {
            case ValueDeltaOperator.ADD:
                return base + (this.value as number); // ADD
            case ValueDeltaOperator.MULTIPLY:
                return base * (this.value as number); // MULTIPLY
            case ValueDeltaOperator.OVERRIDE:
                return this.value as number; // OVERRIDE
            case ValueDeltaOperator.UPGRADE:
                return Math.min(base, this.value as number); // FLOOR
            case ValueDeltaOperator.DOWNGRADE:
                return Math.max(base, this.value as number); // CEIL
            default:
                throw new Error(`Unknown operator: ${this.op}`);
        }
    }

    toJSON(): ValueDeltaData {
        return {
            name: this.name,
            abbrev: this.abbrev,
            op: this.op,
            value: this.value,
        };
    }

    static fromJSON(data: ValueDeltaData): ValueDelta {
        return new ValueDelta(data);
    }

    clone(): ValueDelta {
        return new ValueDelta(this.toJSON());
    }
}

export const DISABLED = new ValueDelta({
    name: `SOHL.DELTAINFO.${DeltaInfo.DISABLED}`,
    abbrev: DeltaInfo.DISABLED,
    op: ValueDeltaOperator.CUSTOM,
    value: "disabled",
});
