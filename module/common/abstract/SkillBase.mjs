import { TraitItemData } from "./item/datamodel/TraitItemData.mjs";

export class SkillBase {
    _attrs;
    _formula;
    _sunsigns;
    _parsedFormula;
    _value;

    constructor(formula, { items = null, sunsign = null } = {}) {
        if (!formula) {
            this._formula = null;
            this._attrs = {};
            this._sunsigns = [];
        }

        if (items && !(Symbol.iterator in Object(items))) {
            throw new Error("items must be iterable");
        }

        this._formula = formula || null;
        this._attrs = {};
        this._sunsigns = sunsign?.system.textValue.split("-") || [];
        this._parsedFormula = formula ? this._parseFormula : [];
        this._value = 0;
        if (items) {
            this.setAttributes(items);
        }
    }

    setAttributes(items) {
        const attributes = [];
        for (const it of items) {
            if (
                it.type === TraitItemData.DATA_TYPE &&
                it.system.intensity === TraitItemData.INTENSITY.ATTRIBUTE &&
                it.system.isNumeric
            )
                attributes.push(it);
        }
        this._parsedFormula.forEach((param) => {
            const type = typeof param;

            if (type === "string") {
                const [subType, name, mult = 1] = param.split(":");
                if (subType === "attr") {
                    const attr = attributes.find(
                        (obj) => obj.system.abbrev === name,
                    );

                    if (attr) {
                        const score = Number.parseInt(
                            attr.system.textValue,
                            10,
                        );
                        if (Number.isInteger(score)) {
                            this._attrs[attr.system.abbrev] = {
                                name: attr.name,
                                value: score * mult,
                            };
                        } else {
                            throw new Error(
                                "invalid attribute value not number",
                            );
                        }
                    }
                }
            }
        });
        this._value = this.formula ? this._calcValue() : 0;
    }

    get valid() {
        return !!this.parsedFormula.length;
    }

    get formula() {
        return this._formula;
    }

    get parsedFormula() {
        return this._parsedFormula;
    }

    get sunsigns() {
        return this._sunsigns;
    }

    get attributes() {
        return Object.values(this._attrs).map((a) => a.name);
    }

    get value() {
        return this._value;
    }

    /**
     * Parses a skill base formula.
     *
     * A valid SB formula looks like this:
     *
     *   "@str, @int, @sta, hirin:2, ahnu, 5"
     *
     * meaning
     *   average STR, INT, and STA
     *   add 2 if sunsign hirin (modifier after colon ":")
     *   add 1 if sunsign ahnu (1 since no modifier specified)
     *   add 5 to result
     *
     * A valid formula must have exactly 2 or more attributes, everything else is optional.
     *
     * @returns {object[]} A parsed skill base formula
     */
    get _parseFormula() {
        const parseResult = [];
        let modifier = 0;

        let isFormulaValid = true;
        // All parts of the formula are separated by commas,
        // and we lowercase here since the string is processed
        // case-insensitive.
        const sbParts = this._formula.toLowerCase().split(",");

        for (let param of sbParts) {
            if (!isFormulaValid) break;

            param = param.trim();
            if (param != "") {
                if (param.startsWith("@")) {
                    // This is a reference to an attribute
                    // Must have more than just the "@" sign
                    if (param.length === 1) {
                        isFormulaValid = false;
                        break;
                    }

                    const paramName = param.slice(1);
                    parseResult.push(`attr:${paramName}`);
                    continue;
                }

                if (param.match(/^\W/)) {
                    // This is a sunsign
                    let ssParts = param.split(":");

                    // if more than 2 parts, it's invalid
                    if (ssParts.length > 2) {
                        isFormulaValid = false;
                        break;
                    }

                    const ssName = ssParts[0].trim;
                    let ssCount = 1;
                    // if second part provided, must be a number
                    if (ssParts.length === 2) {
                        const ssNumber = ssParts[1].trim().match(/^[-+]?\d+/);
                        if (ssNumber) {
                            ssCount = Number.parseInt(ssNumber[0], 10);
                        } else {
                            isFormulaValid = false;
                        }
                        break;
                    }

                    parseResult.push(`ss:${ssName}:${ssCount}`);

                    continue;
                }

                // The only valid possibility left is a number.
                // If it"s not a number, it's invalid.
                if (param.match(/^[-+]?\d+$/)) {
                    modifier += Number.parseInt(param, 10);
                    parseResult.push(modifier);
                } else {
                    isFormulaValid = false;
                    break;
                }
            }
        }

        return isFormulaValid ? parseResult : null;
    }

    /**
     * Calculates a skill base value.
     *
     * @returns A number representing the calculated skill base
     */
    _calcValue() {
        if (!this.valid) return 0;
        let attrScores = [];
        let ssBonus = Number.MIN_SAFE_INTEGER;
        let modifier = 0;
        this.parsedFormula.forEach((param) => {
            const type = typeof param;

            if (type === "number") {
                modifier += param;
            } else if (type === "string") {
                const [subType, name, mult = 1] = param.split(":");
                if (subType === "attr") {
                    attrScores.push(this._attrs[name]?.value || 0);
                } else if (subType === "ss") {
                    if (this.sunsigns.includes(name)) {
                        // We matched a character's sunsign, apply modifier
                        // Character only gets the largest sunsign bonus
                        ssBonus = Math.max(Number.parseInt(mult, 10), ssBonus);
                    }
                }
            }
        });

        ssBonus = ssBonus > Number.MIN_SAFE_INTEGER ? ssBonus : 0;
        let result = attrScores.reduce((acc, cur) => acc + cur, 0);
        result = result / attrScores.length;

        if (attrScores.length === 2) {
            // Special rounding rule: if only two attributes, and
            // primary attr > secondary attr, round up, otherwise round down
            result =
                attrScores[0] > attrScores[1] ?
                    Math.ceil(result)
                :   Math.floor(result);
        } else {
            // Otherwise use normal rounding rules
            result = Math.round(result);
        }

        result += ssBonus + modifier;

        result = Math.max(0, result); // Make sure result is >= 0

        return result;
    }
}
