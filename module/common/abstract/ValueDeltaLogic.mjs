import { BaseLogic } from "@module/common/abstract/BaseLogic.mjs";

/**
 * Represents a single change (delta) applied to a numeric value.
 * @extends {BaseLogic}
 */
export class ValueDeltaLogic extends BaseLogic {
    /** @type {StrictObject<number>} */
    static OPERATOR = Object.freeze({
        CUSTOM: 0,
        MULTIPLY: 1,
        ADD: 2,
        DOWNGRADE: 3,
        UPGRADE: 4,
        OVERRIDE: 5,
    });

    /** @type {ValueDeltaLogic} */
    static _DISABLED = new ValueDeltaLogic({
        name: "Disabled",
        abbrev: "DSBL",
        op: this.OPERATOR.CUSTOM,
        value: "disabled",
    });

    /** @type {string} */
    _name;

    /** @type {string} */
    _abbrev;

    /** @type {number} */
    _op;

    /** @type {number|string|boolean} */
    _value;

    static metadata = sohl.utils.mergeObject(super.metadata, {
        name: "ValueDeltaLogic",
        schemaVersion: "0.5.0",
    });

    constructor(data = {}, { parent } = {}) {
        const { name, abbrev, op, value } = data;
        super(data, { parent });
        if (!name || !abbrev) {
            throw new Error("ValueDeltaLogic requires a name and abbrev");
        }
        this._name = name;
        this._abbrev = abbrev;
        this._op = op ?? 0; // Default to ADD
        this._value = value ?? 0; // Default to 0
    }

    /** @returns {string} */
    get name() {
        return this._name ?? "";
    }

    /** @returns {string} */
    get abbrev() {
        return this._abbrev ?? "";
    }

    /** @returns {number} */
    get op() {
        return this._op;
    }

    /** @returns {number|string|boolean} */
    get value() {
        return this._value;
    }

    /**
     * Apply this delta to a numeric base value.
     * @param {number} base
     * @returns {number}
     */
    apply(base) {
        switch (this.op) {
            case 0:
                return base + this.value; // ADD
            case 1:
                return base * this.value; // MULTIPLY
            case 2:
                return this.value; // OVERRIDE
            case 3:
                return Math.min(base, this.value); // FLOOR
            case 4:
                return Math.max(base, this.value); // CEIL
            default:
                return base;
        }
    }
}
