import { Utility } from "./common/utility.mjs";
import { fields } from "./sohl-common.mjs";
import { ValueModifier } from "./ValueModifier.mjs";

/**
 * Specialized ValueModifier for Impacts
 */

export class ImpactModifier extends ValueModifier {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(super.metadata, {
            name: "ImpactModifier",
            locId: "IMPACTMODIFIER",
            schemaVersion: "0.5.6",
        }),
    );

    /**
     * Determines whether the current object is disabled.
     * The object is considered disabled if `_disabled` is true,
     * or if both `die` and `effective` properties are equal to 0.
     *
     * @returns {boolean} True if the object is disabled, otherwise false.
     */
    get disabled() {
        let disabled =
            this._disabled || (this.die === 0 && this.effective === 0);
        return disabled;
    }

    /**
     * An enumeration of damage aspects used in the system.
     * These aspects represent different types of damage that can be inflicted.
     * The object is immutable and cannot be modified.
     *
     * @readonly
     * @enum {string}
     * @property {string} BLUNT - Represents blunt damage.
     * @property {string} EDGED - Represents edged damage.
     * @property {string} CLAW - Represents claw damage.
     * @property {string} PIERCING - Represents piercing damage.
     * @property {string} BITE - Represents bite damage.
     * @property {string} FIRE - Represents fire damage.
     * @property {string} FROST - Represents frost damage.
     * @property {string} SQUEEZE - Represents squeeze damage.
     * @property {string} ELECTRIC - Represents electric damage.
     * @property {string} ACID - Represents acid damage.
     * @property {string} PROJECTILE - Represents projectile damage.
     * @property {string} EXPLOSIVE - Represents explosive damage.
     */
    static ASPECT = Object.freeze({
        BLUNT: "blunt",
        EDGED: "edged",
        CLAW: "claw",
        PIERCING: "piercing",
        BITE: "bite",
        FIRE: "fire",
        FROST: "frost",
        SQUEEZE: "squeeze",
        ELECTRIC: "electric",
        ACID: "acid",
        PROJECTILE: "projectile",
        EXPLOSIVE: "explosive",
    });

    /**
     * Defines the schema for the class by merging the parent schema with additional fields.
     *
     * @returns {Object} The merged schema object.
     *
     * Fields:
     * - `aspect` {fields.StringField} - Represents the aspect of the impact modifier.
     *   - `initial` {string} - Default value set to `ImpactModifier.ASPECT.BLUNT`.
     *   - `choices` {Object} - A map of choices generated using `Utility.getChoicesMap`.
     *
     * - `die` {fields.NumberField} - Represents the die type.
     *   - `integer` {boolean} - Ensures the value is an integer.
     *   - `min` {number} - Minimum value set to 0.
     *   - `initial` {number} - Default value set to 6.
     *
     * - `numDice` {fields.NumberField} - Represents the number of dice.
     *   - `integer` {boolean} - Ensures the value is an integer.
     *   - `min` {number} - Minimum value set to 0.
     *   - `initial` {number} - Default value set to 1.
     *
     * - `rollObj` {fields.ObjectField} - Represents an object field for roll data.
     */
    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            aspect: new fields.StringField({
                initial: ImpactModifier.ASPECT.BLUNT,
                choices: Utility.getChoicesMap(
                    ImpactModifier.ASPECT,
                    "SOHL.IMPACTMODIFIER.ASPECT",
                ),
            }),
            die: new fields.NumberField({
                integer: true,
                min: 0,
                initial: 6,
            }),
            numDice: new fields.NumberField({
                integer: true,
                min: 0,
                initial: 1,
            }),
            rollObj: new fields.ObjectField(),
        });
    }

    /**
     * Initializes the object with the given options
     *
     * @param {Object} [options={}] - Configuration options for initialization.
     */
    _initialize(options = {}) {
        super._initialize(options);
        Object.defineProperty(this, "roll", {
            value: () => {
                if (!this.rollObj) return null;
                else {
                    let roll;
                    try {
                        roll = Roll.fromData(this.rollObj);
                    } catch (_e) {
                        roll = null;
                    }
                    return !roll && null;
                }
            },
            writable: false,
            enumerable: false,
        });
    }

    /**
     * Returns the statistical median impact. Result is an integer.
     *
     * @readonly
     * @type {void}
     * @returns {number} an integer representing the median impact
     */
    get median() {
        let diceMedian = 0;
        if (this.numDice > 0 && this.die > 0) {
            diceMedian = this.numDice * ((1 + this.die) / 2);
            if (this.die % 2 === 0) {
                diceMedian = this.numDice * (this.die / 2 + 0.5);
            } else {
                diceMedian = this.numDice * ((this.die + 1) / 2);
            }
        }

        return diceMedian + this.effective;
    }

    get diceFormula() {
        if (!this.numDice && !this.effective) return "0";
        const result =
            (this.numDice ?
                `${this.numDice > 1 ? this.numDice : ""}d${this.die}${this.effective >= 0 ? "+" : ""}`
            :   "") + this.effective;
        return result;
    }

    get label() {
        const aspectChar =
            this.aspect?.length ? this.aspect.charAt(0).toLowerCase() : "";
        return `${this.diceFormula}${aspectChar}`;
    }

    async evaluate() {
        if (this.roll) return false;
        const roll = await Roll.create(this.diceFormula);
        const allowed = await roll.evaluate();
        if (allowed) {
            this.updateSource({ roll: roll.toJSON() });
        }
        return allowed;
    }
}
