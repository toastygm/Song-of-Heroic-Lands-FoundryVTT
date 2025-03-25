import { BaseLogic } from "@module/common/abstract/BaseLogic.mjs";
import { ValueDeltaLogic } from "./ValueDeltaLogic.mjs";

/**
 * Represents a value and its modifying deltas.
 * @extends {BaseLogic}
 */
export class ValueModifierLogic extends BaseLogic {
    static metadata = Object.freeze({
        name: "ValueModifierLogic",
        schemaVersion: "0.5.0",
    });

    /** @type {Nullable<string>} */
    _disabledReason;

    /** @type {Nullable<number>} */
    _baseValue;

    /** @type {FunctionLogic} */
    _customFunction;

    /** @type {number} */
    _effective;

    /** @type {string} */
    _abbrev;

    constructor(data = {}, options = {}) {
        super(data, options);
        this._disabledReason = null;
        this._baseValue = null;
        this._customFunction = null;
        this._effective = 0;
        this._abbrev = "";
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
        return this._disabledReason;
    }

    /** @type {ModDesc|string} */
    set disabled(reason) {
        if (typeof reason === "string") {
            
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

    toJSON() {
        return {
            base: this.base,
            disabled: this.disabled,
            deltas: this.deltas.map((d) => d.toJSON()),
        };
    }

    static fromData(data, options = {}) {
        return new this(data, options);
    }
}
