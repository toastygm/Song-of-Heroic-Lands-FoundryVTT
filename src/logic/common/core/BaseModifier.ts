/**
 * @file BaseModifier.ts
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

import { SohlMap } from "@module/utils/SohlMap";
import {
    DeltaInfo,
    ValueDelta,
    ValueDeltaData,
    ValueDeltaOperator,
} from "./ValueDelta";
import {
    SohlBase,
    SohlBaseData,
    SohlBaseMetadata,
    SohlBaseOptions,
} from "./SohlBase";
import { AnyLogic } from "./SohlLogic";

export interface BaseModifierData extends SohlBaseData {
    disabledReason: string;
    baseValue: number;
    customFunction: Function;
    deltas: ValueDeltaData[];
}

export interface BaseModifierOptions extends SohlBaseOptions<AnyLogic> {}

export type BaseModifierMap = SohlMap<string, BaseModifier>;

/**
 * Represents a value and its modifying deltas.
 */
export abstract class BaseModifier<
    D extends BaseModifierData = BaseModifierData,
> extends SohlBase<AnyLogic, D, BaseModifierOptions> {
    static readonly metadata: SohlBaseMetadata = {
        name: "BaseModifier",
        schemaVersion: "0.6.0",
    } as const;

    private _disabledReason?: string;
    private _baseValue?: number;
    private _customFunction?: Function;
    private _effective: number;
    private _deltas: ValueDelta[];
    private _abbrev: string;
    private _dirty: boolean;

    constructor(
        data: Partial<D> = {},
        options: Partial<BaseModifierOptions> = {},
    ) {
        super(data, options);

        const { disabledReason, baseValue, customFunction, deltas = [] } = data;

        if (!this._parent) {
            throw new Error("BaseModifier requires a parent");
        }
        this._dirty = true;
        this._disabledReason = disabledReason;
        this._baseValue = baseValue;
        this._customFunction = customFunction;
        this._effective = 0;
        this._abbrev = "";
        this._deltas = deltas.map((d) => ValueDelta.fromJSON(d));
    }

    get effective(): number {
        return this._effective;
    }

    get modifier(): number {
        return this.effective - (this.base || 0);
    }

    get abbrev(): string {
        return this.abbrev;
    }

    get index(): number {
        return Math.trunc((this._baseValue || 0) / 10);
    }

    get disabled(): string {
        return this._disabledReason ?? "";
    }

    set disabled(reason: string | boolean) {
        if (typeof reason === "string") {
            if (reason === "") this._disabledReason = undefined;
            else this._disabledReason = reason;
        } else {
            if (!reason) this._disabledReason = undefined;
            else this._disabledReason = "SOHL.DELTAINFO.DISABLED";
        }
    }

    get base(): number {
        return this._baseValue || 0;
    }

    set base(value) {
        if (value !== undefined) {
            value = Number(value);
            if (Number.isNaN(value))
                throw new TypeError("value must be numeric or null");
        }
        this._baseValue = value;
    }

    get hasBase(): boolean {
        return this._baseValue !== undefined;
    }

    get empty(): boolean {
        return !this._deltas.length;
    }

    _oper(
        name: string,
        abbrev: string,
        value: string | number,
        op: ValueDeltaOperator,
        data: PlainObject = {},
    ): BaseModifier {
        if (!(typeof name === "string" && name.startsWith("SOHL.MOD."))) {
            throw new TypeError("name is not valid");
        } else if (op === ValueDeltaOperator.CUSTOM && !this._customFunction) {
            throw new TypeError("custom handler is not defined");
        }

        abbrev = data.abbrev;

        const existingOverride = this._deltas.find(
            (m) => m.op === ValueDeltaOperator.OVERRIDE,
        );
        if (existingOverride) {
            // If the operation is not override, then ignore it (leave current override in place)
            if (op === ValueDeltaOperator.OVERRIDE) {
                // If this BaseModifier already been overriden to zero, all other modifications are ignored.
                if (existingOverride.value !== 0) {
                    // If this BaseModifier is being overriden, throw out all other modifications
                    this._deltas = [
                        new ValueDelta({ name, abbrev, op, value }),
                    ];
                    this._dirty = true;
                }
            }
        } else {
            const deltas = this._deltas.filter((m) => m.abbrev !== abbrev);
            deltas.push(new ValueDelta({ name, abbrev, op, value }));
            this._dirty = true;
        }

        return this;
    }

    get(abbrev: string) {
        if (typeof abbrev !== "string") return false;
        return this._deltas.find((m) => m.abbrev === abbrev);
    }

    has(abbrev: string) {
        if (typeof abbrev !== "string") return false;
        return this._deltas.some((m) => m.abbrev === abbrev) || false;
    }

    delete(abbrev: string) {
        if (typeof abbrev !== "string") return;
        const newMods = this._deltas.filter((m) => m.abbrev !== abbrev) || [];
        this._dirty = true;
    }

    add(...args: any[]) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(name, abbrev, value, ValueDeltaOperator.ADD, data);
    }

    multiply(...args: any[]) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(
            name,
            abbrev,
            value,
            ValueDeltaOperator.MULTIPLY,
            data,
        );
    }

    set(...args: any[]) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        return this._oper(
            name,
            abbrev,
            value,
            ValueDeltaOperator.OVERRIDE,
            data,
        );
    }

    floor(...args: any[]) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(
            name,
            abbrev,
            value,
            ValueDeltaOperator.UPGRADE,
            data,
        );
    }

    ceiling(...args: any[]) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(
            name,
            abbrev,
            value,
            ValueDeltaOperator.DOWNGRADE,
            data,
        );
    }

    get chatHtml(): string {
        function getValue(delta: ValueDelta): string {
            switch (delta.op) {
                case ValueDeltaOperator.ADD:
                    return `${(delta.value as number) >= 0 ? "+" : ""}${delta.value}`;

                case ValueDeltaOperator.MULTIPLY:
                    return `${sohl.utils.CHARS.TIMES}${delta.value}`;

                case ValueDeltaOperator.DOWNGRADE:
                    return `${sohl.utils.CHARS.LESSTHANOREQUAL}${delta.value}`;

                case ValueDeltaOperator.UPGRADE:
                    return `${sohl.utils.CHARS.GREATERTHANOREQUAL}${delta.value}`;

                case ValueDeltaOperator.OVERRIDE:
                    return `=${delta.value}`;

                case ValueDeltaOperator.CUSTOM:
                    return `${sohl.utils.CHARS.STAR}${delta.value}`;

                default:
                    throw Error(
                        `SoHL | Specified mode "${delta.op}" not recognized while processing ${delta.abbrev}`,
                    );
            }
        }

        if (this.disabled) return "";
        const fragHtml = `<div class="adjustment">
        <div class="flexrow">
            <span class="label adj-name">${sohl.i18n.format("SOHL.BaseModifier.Adjustment")}</span>
            <span class="label adj-value">${sohl.i18n.format("SOHL.BaseModifier.Value")}</span>    
        </div>${this._deltas
            .map((m) => {
                return `<div class="flexrow">
            <span class="adj-name">${m.name}</span>
            <span class="adj-value">${getValue(m)}</span></div>`;
            })
            .join("")}</div>`;

        return fragHtml;
    }

    _calcAbbrev() {
        this._abbrev = "";
        if (this.disabled) {
            this._abbrev = DeltaInfo.DISABLED;
        } else {
            this._deltas.forEach((adj) => {
                if (this._abbrev) {
                    this._abbrev += ", ";
                }

                switch (adj.op) {
                    case ValueDeltaOperator.ADD:
                        this._abbrev += `${adj.abbrev} ${(adj.value as number) > 0 ? "+" : ""}${adj.value}`;
                        break;

                    case ValueDeltaOperator.MULTIPLY:
                        this._abbrev += `${adj.abbrev} ${sohl.utils.CHARS.TIMES}${adj.value}`;
                        break;

                    case ValueDeltaOperator.DOWNGRADE:
                        this._abbrev += `${adj.abbrev} ${sohl.utils.CHARS.LESSTHANOREQUAL}${adj.value}`;
                        break;

                    case ValueDeltaOperator.UPGRADE:
                        this._abbrev += `${adj.abbrev} ${sohl.utils.CHARS.GREATERTHANOREQUAL}${adj.value}`;
                        break;

                    case ValueDeltaOperator.OVERRIDE:
                        this._abbrev += `${adj.abbrev} =${adj.value}`;
                        break;

                    case ValueDeltaOperator.CUSTOM:
                        if (adj.value === "disabled")
                            this._abbrev += `${adj.abbrev}`;
                        break;
                }
            });
        }
    }

    toJSON(): D {
        return {
            ...super.toJSON(),
            disabledReason: this.disabled,
            baseValue: this.base,
            customFunction: this._customFunction,
            deltas: this._deltas.map((d) => d.toJSON()),
        };
    }
}
