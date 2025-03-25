import * as abstract from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.mjs";
import * as utils from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/utils/module.mjs";
import { SOHL } from "../helper/constants.mjs";
import { NestableDataModelMixin } from "../abstract/NestableDataModelMixin.mjs";
import { _l } from "../helper/sohl-localize.mjs";
import { SohlFunctionField } from "../SohlFunctionField.mjs";
import { Utility } from "../helper/utility.mjs";
import { fields } from "../../sohl-common.mjs";
import { SohlBaseData } from "../abstract/SohlBaseData.mjs";

/**
 * A class representing a value and associated modifications. It includes methods
 * to set and get properties, add named modifiers to the data, and determine
 * effective value.
 *
 * @export
 * @class ValueModifier
 * @typedef {ValueModifier}
 */

export class ValueModifier extends NestableDataModelMixin(
    foundry.abstract.DataModel,
) {
    _effective;
    _abbrev;

    static OPERATOR = Object.freeze({
        CUSTOM: 0,
        MULTIPLY: 1,
        ADD: 2,
        DOWNGRADE: 3,
        UPGRADE: 4,
        OVERRIDE: 5,
    });

    static MOD = Object.freeze({
        DISABLED: {
            name: "Disabled",
            abbrev: "DSBL",
            op: this.OPERATOR.CUSTOM,
            value: "disabled",
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze({
        locId: "VALUEMODIFIER",
        schemaVersion: "0.5.6",
        reservedWords: [],
    });

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema, {
            modifiers: new fields.ArrayField(
                new fields.SchemaField({
                    name: new fields.StringField({
                        blank: false,
                        required: true,
                    }),
                    abbrev: new fields.StringField({
                        blank: false,
                        required: true,
                    }),
                    op: new fields.NumberField({
                        required: true,
                        initial: this.OPERATOR.ADD,
                        choices: Utility.getChoicesMap(
                            ValueModifier.OPERATOR,
                            "SOHL.VALUEMODIFIER.OPERATOR",
                        ),
                        validationError:
                            "must be a value in ValueModifier.OPERATOR",
                    }),
                    value: new fields.StringField(),
                }),
            ),
            disabledReason: new fields.StringField({
                initial: game.sohl?.MOD.NotDisabled,
                choices: Utility.getChoicesMap(SOHL.MOD, "SOHL.MOD"),
            }),
            baseValue: new fields.NumberField({
                nullable: true,
                integer: true,
                initial: null,
            }),
            custom: new SohlFunctionField({
                initial: null,
                nullable: true,
            }),
        });
    }

    /**
     * Constructs a new ValueModifier using the data supplied in the {@link data} plain object. Note that although
     * this can take an object created by {@link #toJSON}, this is not required, and appropriate default values will
     * be supplied for missing parameters.
     *
     * @param {object} data A plain object that was created with a corresponding {@link #toJSON} method
     * @param {object} context Contextual information relating to the object
     * @param {string} context.parent {@link SohlItemData} associated with the object
     */
    constructor(data = {}, context = {}) {
        if (!(context.parent instanceof SohlBaseData)) {
            throw new Error("parent must be a subclass of SohlBaseData");
        }
        super(data, context);
    }

    _initialize(_options = {}) {
        if (this.disabled) {
            this._effective = 0;
        } else {
            const mods = this.modifiers.concat();

            // Sort modifiers so that we process Adds first, then Mults, then Floor, then Ceil
            mods.sort((a, b) =>
                a.op < b.op ? -1
                : a.op > b.op ? 1
                : 0,
            );

            let minVal = null;
            let maxVal = null;
            let overrideVal;

            this._effective = 0;

            // Process each modifier
            mods.forEach((adj) => {
                let value = adj.value;

                if (adj.op === ValueModifier.OPERATOR.CUSTOM) {
                    if (this.custom) {
                        const result = this.custom?.call(this, value);
                        if (Number.isNumber(result)) this._effective = result;
                    }
                } else {
                    // Convert strings to boolean; "true" is true, anything else
                    // is false
                    if (typeof value === "string") value = value === "true";

                    if (typeof value === "number") {
                        value ||= 0;
                        switch (adj.op) {
                            case ValueModifier.OPERATOR.ADD:
                                this._effective += value;
                                break;

                            case ValueModifier.OPERATOR.MULTIPLY:
                                this._effective *= value;
                                break;

                            case ValueModifier.OPERATOR.UPGRADE:
                                // set minVal to the largest minimum value
                                minVal = Math.max(
                                    minVal ?? Number.MIN_SAFE_INTEGER,
                                    value,
                                );
                                break;

                            case ValueModifier.OPERATOR.DOWNGRADE:
                                // set maxVal to the smallest maximum value
                                maxVal = Math.min(
                                    maxVal ?? Number.MAX_SAFE_INTEGER,
                                    value,
                                );
                                break;

                            case ValueModifier.OPERATOR.OVERRIDE:
                                overrideVal = value;
                                break;
                        }
                    } else if (typeof value === "boolean") {
                        switch (adj.op) {
                            case ValueModifier.OPERATOR.ADD:
                                this._effective ||= value ? 1 : 0;
                                break;

                            case ValueModifier.OPERATOR.MULTIPLY:
                                this._effective =
                                    value && this._effective ? 1 : 0;
                                break;

                            case ValueModifier.OPERATOR.UPGRADE:
                                // set minVal to the largest minimum value
                                minVal = 0;
                                break;

                            case ValueModifier.OPERATOR.DOWNGRADE:
                                // set maxVal to the smallest maximum value
                                maxVal = 1;
                                break;

                            case ValueModifier.OPERATOR.OVERRIDE:
                                overrideVal = value ? 1 : 0;
                                break;
                        }
                    } else {
                        throw new TypeError(
                            `ValueModifier: ${adj.name} value is not a number or boolean`,
                        );
                    }
                }
            });

            this._effective =
                minVal === null ?
                    this._effective
                :   Math.max(minVal, this._effective);
            this._effective =
                maxVal === null ?
                    this._effective
                :   Math.min(maxVal, this._effective);
            this._effective = overrideVal ?? this._effective;
            this._effective ||= 0;

            // All values must be rounded to no more than 3 significant digits.
            this._effective = Utility.maxPrecision(this._effective, 3);
        }

        this._calcAbbrev();
    }

    get effective() {
        return this._effective;
    }

    get modifier() {
        return this.effective - (this.base || 0);
    }

    get abbrev() {
        return this._abbrev;
    }

    get index() {
        return Math.trunc((this.base || 0) / 10);
    }

    get disabled() {
        return this.disabledReason;
    }

    set disabled(reason) {
        if (
            typeof reason === "object" &&
            reason.name?.startsWith("SOHL.MOD.")
        ) {
            this.updateSource({ disabledReason: reason.name });
        } else {
            throw new TypeError(
                `reason is not valid, must be a SOHL.MOD object`,
            );
        }
    }

    get base() {
        return this.baseValue || 0;
    }

    set base(value) {
        if (value !== null) {
            value = Number(value);
            if (Number.isNaN(value))
                throw new TypeError("value must be numeric or null");
        }
        this.updateSource({ disabledReason: value });
    }

    get hasBase() {
        return this.baseValue !== null;
    }

    get empty() {
        return !this.modifiers.length;
    }

    _oper(name, abbrev, value, op, data = {}) {
        if (!(typeof name === "string" && name.startsWith("SOHL.MOD."))) {
            throw new TypeError("name is not valid");
        } else if (op === this.OPERATOR.OVERRIDE && !this.custom) {
            throw new TypeError("custom handler is not defined");
        }

        name = _l(name, data);

        if (data.abbrev) {
            abbrev = data.abbrev;
        }

        if (typeof value === "string") {
            value = Utility.stringParse(value);
        }
        const existingOverride = this.modifiers.find(
            (m) => m.op === this.OPERATOR.OVERRIDE,
        );
        if (existingOverride) {
            // If the operation is not override, then ignore it (leave current override in place)
            if (op === this.OPERATOR.OVERRIDE) {
                // If this ValueModifier already been overriden to zero, all other modifications are ignored.
                if (existingOverride.value !== 0) {
                    // If this ValueModifier is being overriden, throw out all other modifications
                    this.updateSource({
                        modifiers: [{ name, abbrev, op, value }],
                    });
                }
            }
        } else {
            const mods = this.modifiers.filter((m) => m.abbrev !== abbrev);
            mods.push({
                name: name,
                abbrev: abbrev,
                op: op,
                value: value,
            });
            this.updateSource({ modifiers: mods });
            this._dirty = true;
        }

        return this;
    }

    get(abbrev) {
        if (typeof abbrev !== "string") return false;
        return this.modifiers.find((m) => m.abbrev === abbrev);
    }

    has(abbrev) {
        if (typeof abbrev !== "string") return false;
        return this.modifiers.some((m) => m.abbrev === abbrev) || false;
    }

    delete(abbrev) {
        if (typeof abbrev !== "string") return;
        const newMods = this.modifiers.filter((m) => m.abbrev !== abbrev) || [];
        this.updateSource({ modifiers: newMods });
    }

    add(...args) {
        let name, abbrev, value, data;
        if (typeof args[0] === "object") {
            [{ name, abbrev }, value, data = {}] = args;
        } else {
            [name, abbrev, value, data = {}] = args;
        }
        if (!Number.isNumeric(value))
            throw new TypeError("value is not numeric");
        return this._oper(name, abbrev, value, this.OPERATOR.ADD, data);
    }

    multiply(...args) {
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
            ValueModifier.OPERATOR.MULTIPLY,
            data,
        );
    }

    set(...args) {
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
            ValueModifier.OPERATOR.OVERRIDE,
            data,
        );
    }

    floor(...args) {
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
            ValueModifier.OPERATOR.UPGRADE,
            data,
        );
    }

    ceiling(...args) {
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
            ValueModifier.OPERATOR.DOWNGRADE,
            data,
        );
    }

    get chatHtml() {
        function getValue(mod) {
            switch (mod.op) {
                case ValueModifier.OPERATOR.ADD:
                    return `${mod.value >= 0 ? "+" : ""}${mod.value}`;

                case ValueModifier.OPERATOR.MULTIPLY:
                    return `${SOHL.CHARS.TIMES}${mod.value}`;

                case ValueModifier.OPERATOR.DOWNGRADE:
                    return `${SOHL.CHARS.LESSTHANOREQUAL}${mod.value}`;

                case ValueModifier.OPERATOR.UPGRADE:
                    return `${SOHL.CHARS.GREATERTHANOREQUAL}${mod.value}`;

                case ValueModifier.OPERATOR.OVERRIDE:
                    return `=${mod.value}`;

                case ValueModifier.OPERATOR.CUSTOM:
                    return `${SOHL.CHARS.STAR}${mod.value}`;

                default:
                    throw Error(
                        `SoHL | Specified mode "${mod.op}" not recognized while processing ${mod.abbrev}`,
                    );
            }
        }

        if (this.disabled) return "";
        const fragHtml = `<div class="adjustment">
        <div class="flexrow">
            <span class="label adj-name">${_l("SOHL.ValueModifier.Adjustment")}</span>
            <span class="label adj-value">${_l("SOHL.ValueModifier.Value")}</span>    
        </div>${this.modifiers
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
            this._abbrev = ValueModifier.DISABLED_ABBREV;
        } else {
            this.modifiers.forEach((adj) => {
                if (this._abbrev) {
                    this._abbrev += ", ";
                }

                switch (adj.op) {
                    case ValueModifier.OPERATOR.ADD:
                        this._abbrev += `${adj.abbrev} ${adj.value > 0 ? "+" : ""}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.MULTIPLY:
                        this._abbrev += `${adj.abbrev} ${SOHL.CHARS.TIMES}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.DOWNGRADE:
                        this._abbrev += `${adj.abbrev} ${SOHL.CHARS.LESSTHANOREQUAL}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.UPGRADE:
                        this._abbrev += `${adj.abbrev} ${SOHL.CHARS.GREATERTHANOREQUAL}${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.OVERRIDE:
                        this._abbrev += `${adj.abbrev} =${adj.value}`;
                        break;

                    case ValueModifier.OPERATOR.CUSTOM:
                        if (adj.value === "disabled")
                            this._abbrev += `${adj.abbrev}`;
                        break;
                }
            });
        }
    }
}
