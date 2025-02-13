/* eslint-disable no-unused-vars */
import * as sohl from "./sohl-common.js";

/* ====================================================================== */
/*          Constants                                                     */
/* ====================================================================== */

const fields = foundry.data.fields;

const LGND = {
    CONST: {
        // Legendary init message with ASCII Artwork (Doom font)
        initVersionMessage: ` _                               _
| |                             | |
| |     ___  __ _  ___ _ __   __| | __ _ _ __ _   _
| |    / _ \\/ _\` |/ _ \\ '_ \\ / _\` |/ _\` | '__| | | |
| |___|  __/ (_| |  __/ | | | (_| | (_| | |  | |_| |
\\_____/\\___|\\__, |\\___|_| |_|\\__,_|\\__,_|_|   \\__, |
             __/ |                             __/ |
            |___/                             |___/
===========================================================`,

        VERSETTINGS: {
            legEncIncr: {
                key: "legEncIncr",
                data: {
                    name: "Encumbrance tracking increment",
                    hint: "Calculate encumbrance by specified steps",
                    scope: "world",
                    config: true,
                    type: new fields.NumberField({
                        required: true,
                        nullable: false,
                        initial: 5,
                        min: 1,
                    }),
                },
            },
            legAttrSecModIncr: {
                key: "legAttrSecModIncr",
                data: {
                    name: "Attribute secondary modifier increment",
                    hint: "Calculate attribute secondary modifier by specified steps",
                    scope: "world",
                    config: true,
                    type: new fields.NumberField({
                        required: true,
                        nullable: false,
                        initial: 5,
                        min: 1,
                    }),
                },
            },
            optionGearDamage: {
                key: "optionGearDamage",
                data: {
                    name: "Gear Damage",
                    hint: "Enable combat rule that allows gear (weapons and armor) to be damaged or destroyed on successful block",
                    scope: "world",
                    config: true,
                    type: new fields.BooleanField({ initial: false }),
                },
            },
            animateActorPacks: {
                key: "animateActorPacks",
                data: {
                    name: "Animate Actor Compendiums",
                    hint: "list of Compendiums containing Animate Actors that will be searched for template actors, comma separated, in order",
                    scope: "world",
                    config: true,
                    type: new fields.StringField({
                        nullable: false,
                        initial: "sohl.leg-characters",
                    }),
                },
            },
            optionBothOnCounterstrike: {
                key: "optionBothOnCounterstrike",
                data: {
                    name: 'Support "Both" Option on Counterstrike',
                    hint: "Enable combat option that allows both attacker and defender to hit on tied counterstrike defense",
                    scope: "world",
                    config: true,
                    type: new fields.BooleanField({ initial: false }),
                },
            },
        },
    },
};

class LgndImpactModifier extends sohl.ImpactModifier {
    // List of possible dice for impact dice.
    static get dice() {
        return {
            0: "None",
            4: "d4",
            6: "d6",
            8: "d8",
            10: "d10",
            12: "d12",
        };
    }

    get impactTA() {
        let result = this.getProperty("impactTAOverride");
        if (!Number.isInteger(result)) {
            switch (this.aspect) {
                case "blunt":
                    result = 3;
                    break;

                case "edged":
                    result = 5;
                    break;

                case "piercing":
                    result = 4;
                    break;

                case "fire":
                    result = 2;
                    break;

                default:
                    result = 0;
                    break;
            }
        }
        return result;
    }

    constructor(parent, initProperties = {}) {
        super(
            parent,
            foundry.utils.mergeObject(
                initProperties,
                {
                    armorReduction: 0,
                    extraBleedRisk: false,
                    zoneDie: 0,
                    startZone: 1,
                    isProjectile: false,
                    bodyLocationId: "",
                    impactTAOverride: null,
                },
                { inplace: false, recursive: false },
            ),
        );
    }
}

/**
 * @typedef LgndSuccessTestResult
 * @property {object} speaker
 * @property {MasteryLevelModifier} mlMod LgndMasteryLevelModifier for this test
 * @property {ImpactModifier} impactMod
 * @property {number} aim
 * @property {SohlItem} item
 * @property {Roll} roll Roll for this test
 * @property {number} lastDigit
 * @property {boolean} isCapped
 * @property {string} type
 * @property {string} title
 * @property {string} typeLabel
 * @property {number} rollMode
 * @property {boolean} askFate
 * @property {boolean} critAllowed
 * @property {boolean} successLevel
 * @property {boolean} isCritical
 * @property {boolean} isSuccess
 * @property {string} description
 * @property {boolean} isSuccessValue
 * @property {number} successValueMod
 * @property {number} successValue
 * @property {number} successValueExpr
 * @property {number} svBonus
 */

class LgndSuccessTestResult extends sohl.SuccessTestResult {
    speaker;
    mlMod;
    aim;
    defaultAim;
    impactMod;
    item;
    _typeLabel;
    _roll;
    rollMode;
    type;
    testType;
    title;
    _successValue;
    _svBonus;
    situationalModifier;
    impactSituationalModifier;
    _successLevel;
    resultText;
    resultDesc;
    svSuccess;
    _description;
    targetMovement;
    cxBothOption;

    static get TEST_TYPE() {
        return foundry.utils.mergeObject(
            super.TEST_TYPE,
            {
                DIRECT: "direct",
                VOLLEY: "volley",
                STILL: "still",
                MOVING: "moving",
                EVADING: "evading",
                FATE: "fate",
            },
            { inplace: false },
        );
    }

    static get testTypes() {
        return foundry.utils.mergeObject(
            super.testTypes,
            {
                [this.TEST_TYPE.DIRECT]: {
                    type: this.TEST_TYPE.DIRECT,
                    label: "Direct Missile Attack",
                    icon: "fas fa-location-arrow-up fa-rotate-90",
                },
                [this.TEST_TYPE.VOLLEY]: {
                    type: this.TEST_TYPE.VOLLEY,
                    label: "Volley Missile Attack",
                    icon: "fas fa-location-arrow",
                },
                [this.TEST_TYPE.STILL]: {
                    type: this.TEST_TYPE.STILL,
                    label: "Still",
                    icon: "fas fa-person",
                },
                [this.TEST_TYPE.MOVING]: {
                    type: this.TEST_TYPE.MOVING,
                    label: "Moving",
                    icon: "fas fa-person-walking",
                },
                [this.TEST_TYPE.EVADING]: {
                    type: this.TEST_TYPE.EVADING,
                    label: "Evading",
                    icon: "fas fa-person-running",
                },
                [this.TEST_TYPE.FATE]: {
                    type: this.TEST_TYPE.FATE,
                    label: "Fate",
                    icon: "fas fa-stars",
                },
            },
            { inplace: false },
        );
    }

    constructor(data = {}) {
        super(data);
        let {
            aim,
            defaultAim,
            impactSituationalModifier,
            isSuccessValue = false,
            svTable,
            targetMovement,
            cxBothOption = false,
        } = data;
        this.aim = aim;
        this.defaultAim = defaultAim;
        this.impactSituationalModifier = impactSituationalModifier;
        this._svBonus = null;
        this._isSuccessValue = isSuccessValue;
        this.targetMovement = targetMovement;
        this.cxBothOption = cxBothOption;

        // If the successValueTable is provided, then use that one,
        // else use the one associated with the item (if available),
        // and if neither of those are available, use the default one.
        this.svTable = svTable || this.item.system.successValueTable;
    }

    get typeLabel() {
        return this._typeLabel;
    }

    get roll() {
        return this._roll;
    }

    get isSuccessValue() {
        return this._isSuccessValue;
    }

    get lastDigit() {
        return this._roll.total % 10;
    }

    get isCapped() {
        return this.mlMod.effective !== this.mlMod.constrainedEffective;
    }

    get successLevel() {
        return this._successLevel;
    }

    get critAllowed() {
        return !!(
            this.mlMod.critSuccessDigits.length ||
            this.mlMod.critFailureDigits.length
        );
    }

    get isCritical() {
        return (
            this.critAllowed &&
            (this.successLevel <=
                LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE ||
                this.successLevel >=
                    LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS)
        );
    }

    get isSuccess() {
        return (
            this.successLevel >=
            LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS
        );
    }

    get description() {
        return this._description;
    }

    get successValue() {
        return this._successValue;
    }

    get svBonus() {
        return this._svBonus;
    }

    get scene() {
        if (this.speaker?.scene && this.speaker.token) {
            return game.scenes.get(this.speaker.scene);
        }

        return null;
    }

    get token() {
        return this.scene?.tokens.get(this.speaker.token);
    }

    get actor() {
        return this.token?.actor || game.actors.get(this.speaker.actor);
    }

    evaluate() {
        super.evaluate();
        if (
            this.mlMod.disabled ||
            this.testType === LgndSuccessTestResult.TEST_TYPE.IGNORE
        ) {
            // Ignore tests always return critical failure (Roll = 100)
            this._roll = new Roll("100").evaluateSync();
        } else {
            this._roll = new Roll("1d100").evaluateSync();
        }
        if (!this._roll) throw new Error(`Roll evaluation failed`);

        if (this.critAllowed) {
            if (this._roll.total <= this.mlMod.constrainedEffective) {
                if (this.mlMod.critSuccessDigits.includes(this.lastDigit)) {
                    this._successLevel =
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS;
                } else {
                    this._successLevel =
                        LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS;
                }
            } else {
                if (this.mlMod.critFailureDigits.includes(this.lastDigit)) {
                    this._successLevel =
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE;
                } else {
                    this._successLevel =
                        LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE;
                }
            }
        } else {
            if (this._roll.total <= this.mlMod.constrainedEffective) {
                this._successLevel =
                    LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS;
            } else {
                this._successLevel =
                    LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE;
            }
        }
        this._successLevel += this.mlMod.successLevelMod;
        if (!this.critAllowed) {
            this._successLevel = Math.min(
                Math.max(
                    this._successLevel,
                    LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE,
                ),
                LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS,
            );
        }

        this._description = `${this.critAllowed ? (this.isCritical ? "Critical " : "Marginal ") : ""}${this.isSuccess ? "Success" : "Failure"}`;

        // If success level is greater than critical success or less than critical failure
        // then add the amount to the end of the description
        let successLevelIncr = 0;
        if (this.isCritical) {
            successLevelIncr =
                this.successLevel -
                (this.isSuccess
                    ? LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS
                    : LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE);
        }
        if (successLevelIncr) {
            this._description += ` (${
                (successLevelIncr > 0 ? "+" : "") + successLevelIncr
            })`;
        }

        if (!this._isSuccessValue) {
            // If there is a table providing detailed description of
            // the results of this test, then process that table to
            // extract the detailed result descriptions.  Many tests
            // will not have these detailed descriptions, in which
            // case only generic descriptions will be given.
            if (this.mlMod.hasProperty("testDescTable")) {
                LgndMasteryLevelModifier._handleDetailedDescription(
                    this,
                    this.successLevel,
                    this.mlMod.testDescTable,
                );
            }
        } else {
            this.successValueMod = this.successLevel - 1;
            this._successValue = this.index + this.successValueMod;
            const slSign = this.successValueMod < 0 ? "-" : "+";
            this.successValueExpr = `${
                this.index
            } ${slSign} ${Math.abs(this.successValueMod)}`;

            // The meaning of the success value bonus ("svBonus") is
            // unique to each type of success value.  Sometimes it
            // represents the number of rolls on another table, or the
            // increase in value or quality of a crafted item, or any
            // other thing.  See the description of the specific test
            // to determine the meaning of the bonus.
            this._svBonus = LgndMasteryLevelModifier._handleDetailedDescription(
                this,
                this._successValue,
                this.svTable,
            );
        }
    }

    async toChat() {
        let speaker = this.speaker || ChatMessage.getSpeaker();
        const testResultObj = this.toJSON();
        const chatData = {
            variant: "legendary",
            testResultJson: JSON.stringify(testResultObj),
            speaker,
            mlMod: this.mlMod,
            aim: this.aim,
            defaultAim: this.defaultAim,
            impactMod: this.impactMod,
            item: this.item,
            typeLabel: this.typeLabel,
            roll: this.roll,
            rollMode: this.rollMode,
            type: this.type,
            title: this.title,
            successValue: this.successValue,
            svBonus: this.svBonus,
            situationalModifier: this.situationalModifier,
            impactSituationalModifier: this.impactSituationalModifier,
            successLevel: this.successLevel,
            resultText: this.resultText,
            resultDesc: this.resultDesc,
            svSuccess: this.svSuccess,
            description: this.description,
        };

        const chatTemplate =
            "systems/sohl/templates/chat/standard-test-card.html";

        const html = await renderTemplate(chatTemplate, chatData);

        const messageData = {
            user: game.user.id,
            speaker,
            content: html.trim(),
            sound: CONFIG.sounds.dice,
        };

        ChatMessage.applyRollMode(messageData, this.rollMode);

        // Create a chat message
        return await ChatMessage.create(messageData);
    }

    toJSON() {
        return {
            speaker: this.speaker,
            mlMod: this.mlMod.toJSON(),
            situationalModifier: this.situationalModifier,
            aim: this.aim,
            defaultAim: this.defaultAim,
            impactMod: this.impactMod ? this.impactMod.toJSON() : null,
            impactSituationalModifier: this.impactSituationalModifier,
            item: this.item.uuid,
            typeLabel: this._typeLabel,
            roll: this._roll ? this._roll.toJSON() : null,
            rollMode: this.rollMode,
            type: this.type,
            title: this.title,
            isSuccessValue: this._isSuccessValue,
            svTable: this.svTable,
        };
    }

    static fromData(data = {}) {
        return new LgndSuccessTestResult({
            speaker: data.speaker,
            mlMod: data.mlMod,
            situationalModifier: data.situationalModifier,
            aim: data.aim,
            defaultAim: data.defaultAim,
            impactMod: data.impactMod,
            impactSituationalModifier: data.impactSituationalModifier,
            item: data.item,
            typeLabel: data.typeLabel,
            roll: data.roll,
            rollMode: data.rollMode,
            type: data.type,
            title: data.title,
            isSuccessValue: data.isSuccessValue,
            svTable: data.svTable,
        });
    }
}

class LgndOpposedTestResult extends sohl.OpposedTestResult {
    _victoryStars;

    static get TACTICAL_ADVANTAGE() {
        return {
            IMPACT: "impact",
            PRECISION: "precision",
            ACTION: "action",
            SETUP: "setup",
        };
    }

    static get tacticalAdvantages() {
        return {
            [this.TACTICAL_ADVANTAGE.IMPACT]: "Impact",
            [this.TACTICAL_ADVANTAGE.PRECISION]: "Precision",
            [this.TACTICAL_ADVANTAGE.ACTION]: "Action",
            [this.TACTICAL_ADVANTAGE.SETUP]: "Setup",
        };
    }

    constructor(context) {
        super(context);
        let { victoryStars = 0 } = context;
        if (!Number.isInteger(victoryStars))
            throw new Error("victoryStars must be an integer");
        this._victoryStars = victoryStars;
    }

    get isTied() {
        return !this.bothFail && this._victoryStars === 0;
    }

    get bothFail() {
        return (
            !this.sourceTestResult.isSuccess && !this.targetTestResult.isSuccess
        );
    }

    get victoryStars() {
        if (this.bothFail) return 0;
        let vs = this._victoryStars;
        if (this.isTied && this.breakTies) vs += this._tieBreak;
        return vs;
    }

    set victoryStarBase(val) {
        if (!Number.isInteger(val)) throw new Error("Value must be an integer");
        this._victoryStars = val;
    }

    get victoryStarsBase() {
        return this._victoryStars;
    }

    set winner(val) {
        if (val === 0) {
            this._victoryStars = 0;
        } else if (
            [
                LgndOpposedTestResult.TIE_BREAK.SOURCE,
                LgndOpposedTestResult.TIE_BREAK.TARGET,
                0,
            ].includes(val)
        ) {
            this._victoryStars = val;
        } else {
            throw new Error("Invalid value: ${val}");
        }
        this._tieBreak = 0;
    }

    get sourceWins() {
        return !this.bothFail && this.victoryStars > 0;
    }

    get targetWins() {
        return !this.bothFail && this.victoryStars < 0;
    }

    get victoryStarsText() {
        const result = {
            vsList: ["None"],
            text: this.bothFail ? "Both Fail" : "Tied",
            isSource: false,
            isTarget: false,
            vsAbs: 0,
        };
        result.vsAbs = Math.abs(this.victoryStars);
        if (result.vsAbs) {
            result.isSource = this.sourceWins;
            result.isTarget = this.targetWins;
            result.vsList = new Array(result.vsAbs).fill(
                result.isSource
                    ? sohl.SOHL.CONST.CHARS.STARF
                    : sohl.SOHL.CONST.CHARS.STAR,
            );
            result.text = result.vsList.join("");
        }
        return result;
    }

    calcMissileCombatResult() {
        const combatResult = {
            attacker: {
                deliversImpact: false,
                isFumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 0,
                isStumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 5,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                tacticalAdvantages: [],
                addlTacAdvs: 0,
                weaponBreak: false,
            },
            defender: {
                deliversImpact: false,
                isFumble: false,
                isStumble: false,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                tacticalAdvantages: [],
                addlTacAdvs: 0,
                weaponBreak: false,
            },
        };

        combatResult.defender.isStumble = false;
        combatResult.defender.isFumble = false;
        if (this.sourceWins) {
            combatResult.attacker.addlTacAdvs = Math.min(
                0,
                this.sourceTestResult.successLevel -
                    LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS,
            );
            if (
                this.targetTestResult.testType ===
                LgndSuccessTestResult.TEST_TYPE.STILL
            ) {
                combatResult.attacker.addlTacAdvs =
                    this.sourceTestResult.successLevel;
            }
        }

        if (this.testType === LgndSuccessTestResult.TEST_TYPE.DIRECT) {
            combatResult.attacker.deliversImpact = this.sourceWins;

            // For Direct, if there are TAs beyond the first, there is a choice between
            // impact and precision TAs for each
            if (combatResult.attacker.addlTacAdvs) {
                combatResult.attacker.tacticalAdvantageChoices = [
                    LgndOpposedTestResult.TACTICAL_ADVANTAGE.IMPACT,
                    LgndOpposedTestResult.TACTICAL_ADVANTAGE.PRECISION,
                ];
            }
        } else {
            // FIXME: Need to implement decision whether attack delivers impact or not
            // Complex rules of area hits apply.

            // For Volley, all TAs are Precision TAs
            for (let i = 0; i < combatResult.attacker.addlTacAdvs; i++) {
                combatResult.attacker.tacticalAdvantages.push(
                    LgndOpposedTestResult.TACTICAL_ADVANTAGE.PRECISION,
                );
            }
            combatResult.attacker.addlTacAdvs = 0;
        }
        this.combatResult = combatResult;
    }

    calcMeleeCombatResult() {
        const combatResult = {
            attacker: {
                deliversImpact: false,
                isFumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 0,
                isStumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 5,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                tacticalAdvantages: [],
                addlTacAdvs: 0,
                weaponBreak: false,
            },
            defender: {
                deliversImpact: false,
                isFumble:
                    this.targetTestResult.isCritical &&
                    !this.targetTestResult.isSuccess &&
                    this.targetTestResult.lastDigit === 0,
                isStumble:
                    this.targetTestResult.isCritical &&
                    !this.targetTestResult.isSuccess &&
                    this.targetTestResult.lastDigit === 5,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                tacticalAdvantages: [],
                addlTacAdvs: 0,
                weaponBreak: false,
            },
        };

        switch (this.targetTestResult.testType) {
            case LgndSuccessTestResult.TEST_TYPE.IGNORE:
                combatResult.defender.isStumble = false;
                combatResult.defender.isFumble = false;
                if (
                    this.sourceTestResult.successLevel >=
                    LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE
                ) {
                    this.winner(LgndOpposedTestResult.TIE_BREAK.SOURCE);
                    combatResult.attacker.deliversImpact = true;
                    combatResult.attacker.addlTacAdvs = Math.min(
                        0,
                        this.sourceTestResult.successLevel -
                            LgndSuccessTestResult.SUCCESS_LEVEL
                                .MARGINAL_SUCCESS,
                    );
                }
                break;

            case LgndSuccessTestResult.TEST_TYPE.BLOCK:
                if (this.sourceWins) {
                    combatResult.attacker.addlTacAdvs = this.victoryStars - 1;
                    combatResult.attacker.deliversImpact = true;
                } else {
                    if (this.isTied)
                        this.winner(LgndOpposedTestResult.TIE_BREAK.TARGET);
                    combatResult.defender.addlTacAdvs = -this.victoryStars - 1;
                }

                if (combatResult.defender.addlTacAdvs) {
                    combatResult.defender.tacticalAdvantageChoices = [
                        LgndOpposedTestResult.TACTICAL_ADVANTAGE.ACTION,
                        LgndOpposedTestResult.TACTICAL_ADVANTAGE.SETUP,
                    ];
                }
                break;

            case LgndSuccessTestResult.TEST_TYPE.COUNTERSTRIKE:
                if (this.targetTestResult.mlMod.has("CXBoth"))
                    if (this.isTied) {
                        if (this.targetTestResult.mlMod.has("CXBoth")) {
                            this.breakTies(true);
                            if (this.targetWins)
                                combatResult.defender.deliversImpact = true;
                        } else {
                            this.winner(LgndOpposedTestResult.TIE_BREAK.SOURCE);
                        }
                        combatResult.attacker.deliversImpact = true;
                    } else if (this.sourceWins) {
                        combatResult.attacker.addlTacAdvs =
                            this.victoryStars - 1;
                        combatResult.attacker.deliversImpact = true;
                    } else {
                        combatResult.defender.addlTacAdvs =
                            -this.victoryStars - 1;
                        combatResult.defender.deliversImpact = true;
                    }

                if (combatResult.defender.addlTacAdvs) {
                    combatResult.defender.tacticalAdvantageChoices = [
                        LgndOpposedTestResult.TACTICAL_ADVANTAGE.IMPACT,
                        LgndOpposedTestResult.TACTICAL_ADVANTAGE.PRECISION,
                    ];
                }
                break;
        }

        if (combatResult.attacker.addlTacAdvs) {
            combatResult.attacker.tacticalAdvantageChoices = Array.from(
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.values(),
            );
        }

        combatResult.attacker.tacticalAdvantageChoicesText =
            sohl.Utility.listToText(
                combatResult.attacker.tacticalAdvantageChoices,
            );
        combatResult.defender.tacticalAdvantageChoicesText =
            sohl.Utility.listToText(
                combatResult.defender.tacticalAdvantageChoices,
            );

        this.combatResult = combatResult;
    }

    calcDodgeCombatResult() {
        const combatResult = {
            attacker: {
                deliversImpact: false,
                isFumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 0,
                isStumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 5,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                addlTacAdvs: 0,
                weaponBreak: false,
            },
            defender: {
                deliversImpact: false,
                isFumble: false,
                isStumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                addlTacAdvs: 0,
                weaponBreak: false,
            },
        };

        if (this.sourceWins) {
            combatResult.attacker.addlTacAdvs = this.victoryStars - 1;
            combatResult.attacker.deliversImpact = true;
        } else {
            combatResult.defender.addlTacAdvs = -this.victoryStars - 1;
        }

        if (combatResult.defender.addlTacAdvs) {
            combatResult.defender.tacticalAdvantageChoices = [
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.IMPACT,
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.PRECISION,
            ];
        }

        if (combatResult.attacker.addlTacAdvs) {
            combatResult.attacker.tacticalAdvantageChoices = Array.from(
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.values(),
            );
        }

        combatResult.attacker.tacticalAdvantageChoicesText =
            sohl.Utility.listToText(
                combatResult.attacker.tacticalAdvantageChoices,
            );
        combatResult.defender.tacticalAdvantageChoicesText =
            sohl.Utility.listToText(
                combatResult.defender.tacticalAdvantageChoices,
            );

        this.combatResult = combatResult;
    }

    toJSON() {
        return foundry.utils.mergeObject(super.toJSON(), {
            victoryStars: this._victoryStars,
        });
    }

    static create(data = {}) {
        return new LgndOpposedTestResult(data);
    }

    evaluate() {
        super.evaluate();
        // Skill tests (including dodge) always break ties
        if (
            this.targetTestResult.testType ===
                LgndSuccessTestResult.TEST_TYPE.SKILL ||
            this.targetTestResult.testType ===
                LgndSuccessTestResult.TEST_TYPE.DODGE
        ) {
            this.breakTies = true;
        }

        if (
            this.sourceTestResult.successLevel <=
                LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE &&
            this.targetTestResult.successLevel <=
                LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE
        ) {
            this.victoryStars = null;
        } else {
            this.victoryStars =
                this.sourceTestResult.successLevel -
                this.targetTestResult.successLevel;
        }

        if (!this._victoryStars) {
            // We have a tie, so first try to break it by giving it to the one with the higher roll
            this._tieBreak = Math.max(
                -1,
                Math.min(
                    1,
                    this.sourceTestResult.roll.total -
                        this.targetTestResult.roll.total,
                ),
            );
            while (!this._tieBreak)
                this._tieBreak =
                    Math.round(sohl.MersenneTwister.random() * 2) - 1;
        }

        if (
            [
                LgndSuccessTestResult.TEST_TYPE.BLOCK,
                LgndSuccessTestResult.TEST_TYPE.COUNTERSTRIKE,
                LgndSuccessTestResult.TEST_TYPE.IGNORE,
            ].includes(this.targetTestResult.testType)
        ) {
            this.calcMeleeCombatResult();
        } else if (
            this.targetTestResult.testType ===
            LgndSuccessTestResult.TEST_TYPE.DODGE
        ) {
            this.calcDodgeCombatResult();
        } else if (
            [
                LgndSuccessTestResult.TEST_TYPE.DIRECT,
                LgndSuccessTestResult.TEST_TYPE.VOLLEY,
            ].includes(this.sourceTestResult.testType)
        ) {
            this.calcMissileCombatResult();
        }
    }

    async toChat({
        chatTemplate = "systems/sohl/templates/chat/opposed-result-card.html",
        chatTemplateData = {},
    } = {}) {
        chatTemplateData = foundry.utils.mergeObject(
            {
                victoryStars: this._victoryStars,
                victoryStarsText: this.victoryStarsText,
            },
            chatTemplateData,
        );

        return super.toChat({
            chatTemplateData,
            chatTemplate,
        });
    }
}

class LgndImpactResult extends sohl.ImpactResult {
    constructor(data = {}) {
        const result = super(data);
        result.impactMod = LgndImpactModifier.create(result.impactMod);
    }

    static fromData(data = {}) {
        const result = super.fromData(data);
        result.impactMod = LgndImpactModifier.create(result.impactMod);
    }
}

class LgndMasteryLevelModifier extends sohl.MasteryLevelModifier {
    constructor(parent, initProperties = {}) {
        super(
            parent,
            foundry.utils.mergeObject(
                initProperties,
                {
                    secMod: (thisVM) => {
                        return (thisVM.index - 5) * 5;
                    },
                },
                { inplace: false, recursive: false },
            ),
        );
    }
}

class LgndCombatModifier extends sohl.CombatModifier {}

class LgndAnimateEntityActorData extends sohl.AnimateEntityActorData {
    $combatReach;
    $hasAuralShock;
    $maxZones;
    $encumbrance;
    $sunsign;

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            sohl.Utility.uniqueActions(actions, []),
        );
    }

    async moraleTest(speaker, actor, token, character, scope = {}) {
        let { type = `${this.name}-morale-test`, title, testResult } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsActor: true,
                self: this,
            }));

        if (!testResult) {
            const initSkill = this.actor.getItem("init", { types: ["skill"] });
            if (!initSkill) return null;
            testResult = LgndSuccessTestResult.fromData({
                speaker,
                item: initSkill,
                rollMode: game.settings.get("core", "rollMode"),
                type,
                title: title || `${this.name} Morale Test`,
                situationalModifier: 0,
                typeLabel: initSkill.system.constructor.typeLabel,
                mlMod: LgndMasteryLevelModifier.create(
                    initSkill.system.$masteryLevel,
                    initSkill.system,
                ),
            });
            testResult.mlMod.testDescTable = [
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE,
                    lastDigit: [0],
                    label: "Catatonic",
                    description:
                        "Suffers 2 PSY and is unaware and unable to move, act, or defend.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE,
                    lastDigit: [5],
                    label: "Routed",
                    description:
                        "Suffers 1 PSY and selects flee action at full move each round.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE,
                    lastDigit: [],
                    label: "Withdrawing",
                    description:
                        "Selects Move action each round to retreat from combat at 1/2 move or more.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS,
                    lastDigit: [],
                    label: "Steady",
                    description: "Character may take any action.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS,
                    lastDigit: [],
                    label: "Brave",
                    description:
                        "Character may take any action and receives a +20 bonus to all Morale and Fear rolls for 5 minutes.",
                },
            ];
        }

        scope.testResult = testResult;
        return super.moraleTest(speaker, actor, token, character, scope);
    }

    async fearTest(speaker, actor, token, character, scope = {}) {
        let { type = `${this.name}-fear-test`, title, testResult } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsActor: true,
                self: this,
            }));

        if (!testResult) {
            const willTrait = this.actor.getItem("will", { types: ["trait"] });
            if (!willTrait) return null;
            testResult = LgndSuccessTestResult.fromData({
                speaker,
                item: willTrait,
                rollMode: game.settings.get("core", "rollMode"),
                type,
                title: title || `${this.name} Contract Fear Test`,
                situationalModifier: 0,
                typeLabel: willTrait.system.constructor.typeLabel,
                mlMod: LgndMasteryLevelModifier.create(
                    willTrait.system.$masteryLevel,
                    willTrait.system,
                ),
            });
            testResult.mlMod.testDescTable = [
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE,
                    lastDigit: [0],
                    label: "Catatonic",
                    description:
                        "Suffers 2 PSY and is unaware and unable to move, act, or defend.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE,
                    lastDigit: [5],
                    label: "Terrified",
                    description:
                        "Suffers 1 PSY and only able to Block or Dodge in defense; on next turn must flee at full move.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE,
                    lastDigit: [],
                    label: "Afraid",
                    description:
                        "Only able to Block or Dodge in defense; on next turn must flee at 1/2 move or more.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS,
                    lastDigit: [],
                    label: "Steady",
                    description:
                        "Character may act unaffected by this source of fear.",
                },
                {
                    maxValue:
                        LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS,
                    lastDigit: [],
                    label: "Brave",
                    description:
                        "Character may act unaffected by this source of fear and receives a +20 bonus to all Fear and Morale rolls for 5 minutes.",
                },
            ];
        }

        scope.testResult = testResult;
        return super.fearTest(speaker, actor, token, character, scope);
    }

    /**
     * Select the appropriate item to use for the opposed test, then delegate processing
     * of the opposed request to that item.
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async ignoreResume(speaker, actor, token, character, scope = {}) {
        let { sourceTestResult } = scope;
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        const targetTestResult = {
            speaker,
            mlMod: new LgndMasteryLevelModifier(this).setBase(0),
            impactMod: null,
            aim: null,
            item: null,
            roll: new Roll("5").execute(),
            lastDigit: 5,
            isCapped: true,
            type: null,
            typeLabel: null,
            rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
            critAllowed: true,
            successLevel: sohl.SOHL.CONST.CriticalFailure,
            isCritical: true,
            isSuccess: false,
            description: "Critical Failure",
            isSuccessValue: false,
        };

        let victoryStars = Math.max(
            sourceTestResult.successLevel -
                LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE,
            0,
        );
        const opposedTestResult = {
            sourceTestResult,
            targetTestResult,
            victoryStars: victoryStars,
            sourceWins: victoryStars > 0,
            targetWins: false,
        };

        if (victoryStars >= 2) {
            sourceTestResult.addlTacAdvs = [];
            sourceTestResult.addlTacticalAdvantages = victoryStars - 1 + 1;
            sourceTestResult.tacticalAdvantageTypes = ["Impact", "Precision"];
        }

        if (sourceTestResult.isCritical && !sourceTestResult.isSuccess) {
            if (sourceTestResult.lastDigit === 0) {
                sourceTestResult.fumbleTest = true;
            } else {
                sourceTestResult.stumbleTest = true;
            }
        }

        return await LgndMasteryLevelModifier.opposedTestToChat(
            speaker,
            actor,
            token,
            character,
            {
                speaker,
                opposedTestResult,
            },
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$maxZones = 0;
        this.$combatReach = -99;
        this.$hasAuralShock = false;
        this.$encumbrance = new sohl.ValueModifier(this, {
            total: (thisVM) => {
                const encDiv = game.settings.get(
                    "sohl",
                    LGND.CONST.VERSETTINGS.legEncIncr.key,
                );
                let result = Math.round(
                    Math.floor((thisVM.effective + Number.EPSILON) * encDiv) /
                        encDiv,
                );
                return result;
            },
        });
        this.$encumbrance.floor("Min Zero", "Min0", 0);
    }
}

class LgndProtectionItemData extends sohl.ProtectionItemData {}

function LgndStrikeModeItemDataMixin(BaseMLID) {
    return class LgndStrikeModeItemData extends BaseMLID {
        $reach;
        $heft;

        get heftBase() {
            return this.item.getFlag("sohl", "legendary.heftBase") || 0;
        }

        get zoneDie() {
            return this.item.getFlag("sohl", "legendary.zoneDie") || 0;
        }

        static get tactialAdvantages() {
            return {
                action: "Action",
                impact: "Impact",
                precision: "Precision",
            };
        }

        static get effectKeys() {
            return sohl.Utility.simpleMerge(super.effectKeys, {
                "mod:system.$impact.armorReduction": {
                    label: "Armor Reduction",
                    abbrev: "AR",
                },
                "system.$defense.block.successLevelMod": {
                    label: "Block Success Level",
                    abbrev: "BlkSL",
                },
                "system.$defense.counterstrike.successLevelMod": {
                    label: "Counterstrike Success Level",
                    abbrev: "CXSL",
                },
                "system.$traits.opponentDef": {
                    label: "Opponent Defense",
                    abbrev: "OppDef",
                },
                "system.$traits.entangle": {
                    label: "Entangle",
                    abbrev: "Entangle",
                },
                "system.$traits.envelop": {
                    label: "Envelop",
                    abbrev: "Envlp",
                },
                "system.$traits.lowAim": {
                    label: "High Strike",
                    abbrev: "HiStrike",
                },
                "system.$traits.impactTA": {
                    label: "Impact Tac Adv",
                    abbrev: "ImpTA",
                },
                "system.$traits.notInClose": {
                    label: "Not In Close",
                    abbrev: "NotInCls",
                },
                "system.$traits.onlyInClose": {
                    label: "Only In Close",
                    abbrev: "OnlyInCls",
                },
                "system.$traits.lowStrike": {
                    label: "Low Strike",
                    abbrev: "LoStrike",
                },
                "system.$traits.deflectTN": {
                    label: "Deflect TN",
                    abbrev: "DeflTN",
                },
                "system.$traits.shieldMod": {
                    label: "Shield Mod",
                    abbrev: "ShldMod",
                },
                "system.$traits.extraBleedRisk": {
                    label: "Extra Bleed Risk",
                    abbrev: "XBldRsk",
                },
                "system.$traits.noStrMod": {
                    label: "No STR Mod",
                    abbrev: "NoStrMod",
                },
                "system.$traits.halfImpact": {
                    label: "Half Impact",
                    abbrev: "HlfImp",
                },
            });
        }

        getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
            return super.getIntrinsicActions(
                _data,
                defaultAction,
                sohl.Utility.uniqueActions(actions, [
                    {
                        functionName: "calcImpact",
                        name: "Calculate Impact",
                        contextIconClass: "fas fa-bullseye-arrow",
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            return item && !item.system.$impact.disabled;
                        },
                        contextGroup: "general",
                    },
                ]),
            );
        }

        /**
         * Perform Success Test for this Item
         *
         * @param {object} options
         * @returns {SuccessTestChatData}
         */
        async successTest(speaker, actor, token, character, scope) {
            ({ speaker, actor, token, character } =
                sohl.SohlMacro.getExecuteDefaults({
                    speaker,
                    actor,
                    token,
                    character,
                    needsActor: true,
                    self: this,
                }));

            let {
                skipDialog = false,
                noChat = false,
                type,
                title,
                testType = LgndSuccessTestResult.TEST_TYPE.ATTACK,
                testResult,
                mlMod,
                targetMovement = null,
            } = scope;

            if (
                !Object.values(LgndSuccessTestResult.TEST_TYPE).includes(
                    testType,
                )
            ) {
                throw new Error(`Invalid testType=${testType}`);
            }

            type ??= `${this.type}-${this.name}-${testType}-test`;
            if (testType === LgndSuccessTestResult.TEST_TYPE.DIRECT) {
                title ??= `${this.item.label} Direct Missile Attack Test`;
                targetMovement = "Direct";
            } else if (testType === LgndSuccessTestResult.TEST_TYPE.VOLLEY) {
                title ??= `${this.item.label} Volley Missile Attack Test`;
                targetMovement = "Volley";
            } else {
                title ??= `${this.item.label} ${LgndSuccessTestResult.testTypes[testType].label} Test`;
            }
            if (!token) {
                ui.notifications.warn(`No attacker token identified.`);
                return null;
            }

            if (!token.isOwner) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${token.name}`,
                );
                return null;
            }

            if (!this.item.nestedIn.system.isHeld) {
                ui.notification.warn(
                    `For ${token.name} ${this.item.nestedIn.name} is not held.`,
                );
                return null;
            }

            if (testResult) {
                testResult = LgndSuccessTestResult.fromData(testResult);
            } else {
                testResult = LgndSuccessTestResult.fromData({
                    speaker,
                    item: this.item,
                    rollMode: game.settings.get("core", "rollMode"),
                    type,
                    title,
                    situationalModifier: 0,
                    typeLabel: this.constructor.typeLabel,
                    testType,
                    mlMod,
                    targetMovement,
                    cxBothOption: false,
                });
            }

            if (!skipDialog) {
                // Render modal dialog
                let dlgTemplate =
                    "systems/sohl/templates/dialog/standard-test-dialog.html";

                let dialogData = {
                    variant: "legendary",
                    type: testResult.type,
                    title: `${testResult.token ? testResult.token.name : testResult.actor.name} ${testResult.title}`,
                    testType: testResult.testType,
                    mlMod: testResult.mlMod,
                    situationalModifier: testResult.situationalModifier,
                    impactMod: testResult.impactMod,
                    impactSituationalModifier:
                        testResult.impactSituationalModifier,
                    defaultAim: testResult.defaultAim,
                    aimChoices: testResult.aimChoices,
                    targetMovement: testResult.targetMovement,
                    movementOptions:
                        LgndMissileWeaponStrikeModeItemData.movementOptions,
                    cxBothOption: testResult.cxBothOption,
                    askCXBothOption: game.settings.get(
                        "sohl",
                        "optionBothOnCounterstrike",
                    ),
                    rollMode: testResult.rollMode,
                    rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                        ([k, v]) => ({
                            group: "CHAT.RollDefault",
                            value: k,
                            label: v,
                        }),
                    ),
                };
                const html = await renderTemplate(dlgTemplate, dialogData);

                // Create the dialog window
                const result = await Dialog.prompt({
                    title: dialogData.title,
                    content: html.trim(),
                    label: "Roll",
                    callback: (html) => {
                        const form = html.querySelector("form");
                        const fd = new FormDataExtended(form);
                        const formData = fd.object;
                        const formSituationalModifier =
                            Number.parseInt(formData.situationalModifier, 10) ||
                            0;
                        const formImpactSituationalModifier =
                            Number.parseInt(
                                formData.impactSituationalModifier,
                                10,
                            ) || 0;
                        const formAim = Number.parseInt(formData.aim, 10) || 0;

                        if (
                            testResult.impactMod &&
                            formImpactSituationalModifier
                        ) {
                            testResult.impactMod.add(
                                "SituationalModifier",
                                "SitMod",
                                formImpactSituationalModifier,
                            );
                            testResult.impactSituationalModifier =
                                formImpactSituationalModifier;
                        }

                        if (formSituationalModifier) {
                            testResult.mlMod.add(
                                "Situational Modifier",
                                "SitMod",
                                formSituationalModifier,
                            );
                            testResult.situationalModifier =
                                formSituationalModifier;
                        }

                        const formSuccessLevelMod = Number.parseInt(
                            formData.successLevelMod,
                            10,
                        );
                        testResult.cxBothOption = !!formData.cxBothOption;
                        testResult.mlMod.successLevelMod = formSuccessLevelMod;
                        testResult.aim = formAim;
                        testResult.rollMode = formData.rollMode;
                        if (dialogData.targetMovement)
                            testResult.targetMovement = formData.targetMovement;
                        return true;
                    },
                    rejectClose: false,
                    options: { jQuery: false },
                });

                if (!result) return;
            }

            if (testResult.aim && testResult.aim !== testResult.defaultAim) {
                testResult.mlMod.add("Non-default Aim Zone", "AimZn", -10);
            }

            if (
                testType === LgndSuccessTestResult.TEST_TYPE.COUNTERSTRIKE &&
                testResult.cxBothOption &&
                !testResult.mlMod.has("CXBoth")
            ) {
                testResult.mlMod.add(
                    '"Both" Counterstrike Option',
                    "CXBoth",
                    -10,
                );
            } else {
                if (testResult.mlMod.has("CXBoth"))
                    testResult.mlMod.delete("CXBoth");
            }
            testResult.evaluate();

            if (!noChat) {
                await this.successTestToChat({
                    speaker,
                    testResult,
                });
            }
            return testResult;
        }

        async _preOpposedSuccessTest(speaker, actor, token, character, scope) {
            let result = super._preOpposedSuccessTest(
                speaker,
                actor,
                token,
                character,
                scope,
            );
            if (!result) return;

            let { targetToken, testType } = scope;

            // Unique to the opposed test, we get the targeted token and determine
            // whether that token is inside our engagement zone
            targetToken ||= sohl.Utility.getUserTargetedToken(token);
            if (!targetToken) return;

            const targetRange = LgndUtility.rangeToTarget(token, targetToken);
            if (
                testType === LgndSuccessTestResult.TEST_TYPE.ATTACK &&
                targetRange >
                    LgndUtility.engagementZoneRange(this.$reach.effective)
            ) {
                const msg = `Target ${targetToken.name} is outside of engagement zone for ${this.name}; distance = ${targetRange} feet, EZ = ${LgndUtility.engagementZoneRange(this.$reach.effective)} feet.`;
                ui.notifications.warn(msg);
                return;
            } else if (
                testType === LgndSuccessTestResult.TEST_TYPE.DIRECT &&
                targetRange > this.$maxDistance.effective
            ) {
                const msg = `Target ${targetToken.name} is outside of ${this.range} range for ${this.name}; distance = ${targetRange} feet, max distance = ${this.$maxDistance} feet.`;
                ui.notifications.warn(msg);
                return;
            }

            return result;
        }

        /**
         * Calculate impact for this Item
         *
         * @param {object} options
         * @returns {SuccessTestChatData}
         */
        async calcImpact(speaker, actor, token, character, scope) {
            ({ speaker, actor, token, character } =
                sohl.SohlMacro.getExecuteDefaults({
                    speaker,
                    actor,
                    token,
                    character,
                    needsActor: true,
                    self: this,
                }));

            let {
                skipDialog = false,
                noChat = false,
                impactResult,
                numImpactTAs = 0,
                targetToken,
            } = scope;
            if (!actor.isOwner) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${token ? token.name : actor.name}`,
                );
                return null;
            }

            if (!impactResult) {
                impactResult = LgndImpactResult.fromData({
                    speaker,
                    item: this.item,
                    impactMod: LgndImpactModifier.create(this.$impact),
                });
            } else if (!(impactResult instanceof LgndImpactResult)) {
                impactResult = LgndImpactResult.fromData(impactResult);
                impactResult.impactMod = LgndImpactModifier.create(
                    impactResult.impactMod,
                );
            }

            let dlgResult;
            let dlgData = {
                impactResult,
                numImpactTAs,
                situationalImpact: 0,
            };
            if (!skipDialog) {
                const compiled = Handlebars.compile(`<form id="select-token">
                <div class="form-group">
                    {{{impactResult.impactMod.chatHtml}}}
                </div>
                <div class="form-group">
                    <label>Impact TAs ({{numberFormat impactResult.impactMod.impactTA sign=true}}):</label>
                    {{numberInput numImpactTAs name="numImpactTAs" step=1 min=0}}
                </div>
                <div class="form-group">
                    <label>Situational Impact:</label>
                    {{numberInput situationalImpact name="situationalImpact" step=1}}
                </div>
                </form>`);
                const dlgHtml = compiled(dlgData, {
                    allowProtoMethodsByDefault: true,
                    allowProtoPropertiesByDefault: true,
                });

                // Create the dialog window
                dlgResult = await Dialog.prompt({
                    title: dlgData.title,
                    content: dlgHtml.trim(),
                    label: "Roll",
                    callback: (html) => {
                        const form = html.querySelector("form");
                        const fd = new FormDataExtended(form);
                        const formData = fd.object;
                        const formSituationalImpact =
                            Number.parseInt(formData.situationalImpact, 10) ||
                            0;
                        const formNumImpactTAs =
                            Number.parseInt(formData.numImpactTAs, 10) || 0;
                        return {
                            situationalImpact: formSituationalImpact,
                            numImpactTAs: formNumImpactTAs,
                        };
                    },
                    rejectClose: false,
                    options: { jQuery: false },
                });

                if (!dlgResult) return;
            } else {
                dlgResult = {
                    situationalImpact: 0,
                    impactTAs: numImpactTAs,
                };
            }

            if (dlgResult.numImpactTAs) {
                impactResult.impactMod.add(
                    `${dlgResult.numImpactTAs} Impact TAs`,
                    "ImpTA",
                    dlgResult.numImpactTAs * impactResult.impactMod.impactTA,
                );
            }

            if (dlgResult.situationalImpact) {
                impactResult.impactMod.add(
                    "Situational Impact",
                    "SitImp",
                    dlgResult.situationalImpact,
                );
            }

            impactResult.roll = await impactResult.impactMod.evaluate();

            if (!noChat) {
                const actor = token ? token.actor : actor;
                const name = token ? token.name : actor?.name;
                let title = `${name} ${dlgData.impactMod.parent.item.label} Impact`;
                if (targetToken) title += ` against ${targetToken.name}`;
                const chatData = {
                    actor,
                    targetToken,
                    impactResult,
                    impactResultJson: JSON.stringify(impactResult.toJSON()),
                    title,
                };
                const chatTemplate =
                    "systems/sohl/templates/chat/damage-card.html";

                const html = await renderTemplate(chatTemplate, chatData);

                const messageData = {
                    user: game.user.id,
                    speaker: speaker || ChatMessage.getSpeaker(),
                    content: html.trim(),
                    sound: CONFIG.sounds.dice,
                };

                // Create a chat message
                await ChatMessage.create(messageData);
            }

            return impactResult;
        }

        prepareBaseData() {
            super.prepareBaseData();
            this.$attack = LgndCombatModifier.create(this.$attack);
            this.$defense = {
                block: LgndCombatModifier.create(this.$defense.block),
                counterstrike: LgndCombatModifier.create(
                    this.$defense.counterstrike,
                ),
            };
            this.$impact = LgndImpactModifier.create(this.$impact);

            this.$reach = new sohl.ValueModifier(this);
            this.$heft = new sohl.ValueModifier(this);
            foundry.utils.mergeObject(this.$traits, {
                armorReduction: 0,
                blockSLMod: 0,
                cxSLMod: 0,
                opponentDef: 0,
                entangle: false,
                envelop: false,
                lowAim: false,
                impactTA: 0,
                notInClose: false,
                onlyInClose: false,
                deflectTN: 0,
                shieldMod: 0,
                extraBleedRisk: false,
                noStrMod: false,
                halfImpact: false,
                noBlock: false,
                noAttack: false,
            });
        }

        processSiblings() {
            super.processSiblings();
            if (this.$traits.noBlock)
                this.$defense.block.setDisabled("No Blocking Allowed", "NoBlk");
            if (this.$traits.noAttack) {
                this.$attack.setDisabled("No Attack Allowed", "NoAtk");
                this.$defense.counterstrike.setDisabled(
                    "No Counterstrike Allowed",
                    "NoCX",
                );
            }
            if (this.$traits.blockSLMod)
                this.$defense.block.successLevelMod.add(
                    "SL Modifier",
                    "SLMod",
                    this.$traits.blockSLMod,
                );

            if (this.$traits.cxSLMod)
                this.$defense.counterstrike.successLevelMod.add(
                    "SL Modifier",
                    "SLMod",
                    this.$traits.cxSLMod,
                );

            const weapon = this.item.nestedIn;
            const strength = this.actor.getTraitByAbbrev("str");

            if (weapon?.system instanceof sohl.WeaponGearItemData) {
                this.$heft.addVM(weapon.system.$heft, {
                    includeBase: true,
                });
                this.$length.addVM(weapon.system.$length, {
                    includeBase: true,
                });

                // If held in a non-favored part, attack/block/CX are at -5
                if (!weapon.system.$heldByFavoredPart) {
                    this.$heft.add("Held by non-favored limb", "NonFavLimb", 5);
                }

                // If held in two hands (for a weapon that only requires one hand)
                // reduce the HFT by 5
                if (weapon.system.$heldBy.length > this.minParts) {
                    this.$heft.add("Multi-Limb Bonus", "MultLimb", -5);

                    if (strength) {
                        // If swung and STR is greater than base unmodified heft, impact
                        // increases by 1
                        if (
                            this.$traits.swung &&
                            strength.system.$score?.base >= this.heftBase
                        ) {
                            this.$impact.add(
                                "Swung Strength Bonus",
                                "SwgStr",
                                1,
                            );
                        }
                    }
                }
            } else {
                this.$length.setBase(this.lengthBase);
                this.$heft.setBase(this.heftBase);
            }

            if (strength) {
                const strValue = strength.system.$score?.effective || 0;

                const heftPenalty =
                    Math.max(0, this.$heft.effective - strValue) * -5;

                if (heftPenalty) {
                    this.$attack.add(
                        "Heft Strength Penalty",
                        "HeftStr",
                        heftPenalty,
                    );
                    this.$defense.block.add(
                        "Heft Strength Penalty",
                        "HeftStr",
                        heftPenalty,
                    );
                    this.$defense.counterstrike.add(
                        "Heft Strength Penalty",
                        "HeftStr",
                        heftPenalty,
                    );
                }
            }

            this.$reach.floor("Min Reach", "Min", 0);
            this.$reach.addVM(this.$length, {
                includeBase: true,
            });

            const size = this.actor.getTraitByAbbrev("siz");
            if (size) {
                const sizeReachMod = size.system.$params?.reachMod || 0;
                this.$reach.add("Size Modifier", "Siz", sizeReachMod);
            }
        }
    };
}

class LgndMeleeWeaponStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.MeleeWeaponStrikeModeItemData,
) {
    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, {
            "mod:system.$heft": { label: "Heft", abbrev: "Hft" },
            "system.$traits.couched": { label: "Couched", abbrev: "Couched" },
            "system.$traits.slow": { label: "Slow", abbrev: "Slow" },
            "system.$traits.thrust": { label: "Thrust", abbrev: "Thst" },
            "system.$traits.swung": { label: "Swung", abbrev: "Swng" },
            "system.$traits.halfSword": {
                label: "Half Sword",
                abbrev: "HlfSwd",
            },
            "system.$traits.twoPartLen": {
                label: "2H Length",
                abbrev: "2HLen",
            },
        });
    }

    static get tactialAdvantages() {
        return {
            action: "Action",
            impact: "Impact",
            precision: "Precision",
            setup: "Setup",
        };
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction || "opposedTestStart",
            sohl.Utility.uniqueActions(actions, [
                {
                    functionName: "attackTest",
                    name: "Attack Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.ATTACK
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$attack.disabled;
                    },
                    contextGroup: "general",
                },
                {
                    functionName: "blockTest",
                    name: "Block Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.BLOCK
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$defense.block.disabled;
                    },
                    contextGroup: "general",
                },
                {
                    functionName: "counterstrikeTest",
                    name: "Counterstrike Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.COUNTERSTRIKE
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return (
                            item && !item.system.$defense.counterstrike.disabled
                        );
                    },
                    contextGroup: "general",
                },
            ]),
        );
    }

    calcReachModifier(opponentDefStrikeMode, atkMod) {
        const opponentToken = opponentDefStrikeMode.nestedIn?.token;
        if (!opponentToken) {
            throw new Error(
                `Strike mode ${opponentDefStrikeMode.name} does not belong to a token`,
            );
        }

        let reachDiff = this.$reach - opponentDefStrikeMode.system.$reach;
        let reachPenalty = -Math.abs(reachDiff) * 5;
        const inClose =
            LgndUtility.rangeToTarget(this.actor.token, opponentToken) < 5;
        if (inClose) {
            if (reachDiff > 0) {
                // Attacker weapon reach is longer, penalty goes to attacker
                atkMod.add("In-Close Reach Penalty", "InClsRch", reachPenalty);
            } else {
                // Attacker weapon reach is shorter, thrust bonus goes to attacker
                if (this.$traits.thrust) {
                    atkMod.add(
                        "In-Close Thrust Bonus",
                        "InClsThr",
                        -reachPenalty,
                    );
                }
            }
        } else {
            if (reachDiff < 0) {
                // Attacker weapon reach is shorter, penalty goes to attacker
                atkMod.add("Reach Penalty", "Rch", reachPenalty);
            } else {
                // Attacker weapon reach is longer, thrust bonus goes to attacker
                if (this.$traits.thrust) {
                    atkMod.add("Thrust Bonus", "Thrust", -reachPenalty);
                }
            }
        }
        return atkMod;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            couched: false,
            noAttack: false,
            noBlock: false,
            slow: false,
            thrust: false,
            swung: false,
            halfSword: false,
            twoPartLen: 0,
        });
        this.$range = new sohl.ValueModifier(this);
    }

    processSiblings() {
        super.processSiblings();

        const strength = this.actor.getTraitByAbbrev("str");
        if (strength) {
            const strValue = strength.system.$score?.effective || 0;
            const strImpactMod = LgndUtility.strImpactMod(strValue);
            if (strImpactMod && !this.$traits.noStrMod) {
                this.$impact.add(
                    "Strength Impact Modifier",
                    "StrImpMod",
                    strImpactMod,
                );
            }
        }

        if (this.actor.system.$engagedOpponents.effective > 1) {
            const outnumberedPenalty =
                this.actor.system.$engagedOpponents.effective * -10;
            this.$defense.block.add("Outnumbered", "Outn", outnumberedPenalty);
            this.$defense.counterstrike.add(
                "Outnumbered",
                "Outn",
                outnumberedPenalty,
            );
        }
    }

    postProcess() {
        super.postProcess();
        if (this.item.nestedIn?.system instanceof sohl.ProjectileGearItemData) {
            this.$range.addVM(this.item.nestedIn.system.$baseRange, {
                includeBase: true,
            });
        }
    }
}

class LgndMissileWeaponStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.MissileWeaponStrikeModeItemData,
) {
    $range;
    $draw;
    $canDraw;
    $pull;

    static get MOVEMENT_OPTIONS() {
        return {
            STILL: "still",
            MOVING: "moving",
            EVADING: "evading",
        };
    }
    static get movementOptions() {
        return {
            [this.MOVEMENT_OPTIONS.STILL]: "Still",
            [this.MOVEMENT_OPTIONS.MOVING]: "Moving",
            [this.MOVEMENT_OPTIONS.EVADING]: "Evading",
        };
    }

    static get tactialAdvantages() {
        return foundry.utils.mergeObject(
            super.addlTacAdvs,
            {
                setup: "Setup",
            },
            { inplace: false },
        );
    }

    static get RANGE() {
        return {
            POINT_BLANK: "pb",
            DIRECT: "direct",
            VOLLEY_2: "v2",
            VOLLEY_3: "v3",
            VOLLEY_4: "v4",
        };
    }

    static get ranges() {
        return {
            [this.RANGE.POINT_BLANK]: {
                label: "PB",
                mult: 0.5,
            },
            [this.RANGE.DIRECT]: {
                label: "Direct",
                mult: 1,
            },
            [this.RANGE.VOLLEY_2]: {
                label: "V2",
                mult: 2,
            },
            [this.RANGE.VOLLEY_3]: {
                label: "V3",
                mult: 3,
            },
            [this.RANGE.VOLLEY_4]: {
                label: "V4",
                mult: 4,
            },
        };
    }

    get range() {
        return (
            this.item.getFlag("sohl", "legendary.range") ||
            LgndMissileWeaponStrikeModeItemData.RANGE.DIRECT
        );
    }

    get drawBase() {
        return this.item.getFlag("sohl", "legendary.drawBase") || 0;
    }

    get zoneDie() {
        return (
            this.item.nestedIn?.getFlag("sohl", "legendary.zoneDie") ||
            this.item.getFlag("sohl", "legendary.zoneDie") ||
            0
        );
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction || "automatedAttack",
            sohl.Utility.uniqueActions(actions, [
                {
                    functionName: "directAttackTest",
                    name: "Direct Missile Attack Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.DIRECT
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$attack.disabled;
                    },
                    contextGroup: "general",
                },
                {
                    functionName: "volleyAttackTest",
                    name: "Volley Missile Attack Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.VOLLEY
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$attack.disabled;
                    },
                    contextGroup: "primary",
                },
            ]),
        );
    }

    async volleyAttackTest(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        scope = {},
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        ui.notifications.warn(`Volley attacks not implemented`);
        return null;
    }

    async directAttackTest(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        scope = {},
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        scope.testType = LgndSuccessTestResult.TEST_TYPE.DIRECT;
        return super.attackTest(speaker, actor, token, character, scope);
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            armorReduction: 0,
            bleed: false,
        });
        this.$maxDistance = new sohl.ValueModifier(this);
        this.$draw = new sohl.ValueModifier(this).setBase(this.drawBase);
        this.$pull = new sohl.ValueModifier(this);
        this.$defense.block.setDisabled(
            "No Defense for Missile Attacks",
            "NoDfseMsl",
        );
        this.$defense.block.critSuccessDigits = [];
        this.$defense.block.critFailureDigits = [];
        this.$defense.counterstrike.setDisabled(
            "No Defense for Missile Attacks",
            "NoDfseMsl",
        );
        this.$defense.counterstrike.critSuccessDigits = [];
        this.$defense.counterstrike.critFailureDigits = [];
    }

    processSiblings() {
        super.processSiblings();
        if (this.item.nestedIn?.system instanceof LgndWeaponGearItemData) {
            const mult = this.constructor.ranges[this.range]?.mult;
            if (mult) {
                this.$maxDistance.addVM(this.item.nestedIn.system.$baseRange, {
                    includeBase: true,
                });
                this.$maxDistance.multiply(
                    `${this.range} Range Multiplier`,
                    "RngMult",
                    mult,
                );
            } else {
                this.$maxDistance.set(
                    `Range ${this.range} invalid, setting max distance to 0`,
                    "InvRng",
                    0,
                );
            }
        }
    }

    postProcess() {
        super.postProcess();
        const strength = this.actor.getTraitByAbbrev("str");
        if (strength) {
            const strML = strength.system.$masteryLevel?.effective || 0;
            this.$pull.add("Strength ML", "StrML", strML);
        }
        if (this.$assocSkill) {
            this.$pull.add(
                `${this.$assocSkill.name}`,
                "AssocSkill",
                this.$assocSkill.system.$masteryLevel.effective,
            );
        }

        this.$canDraw =
            !this.$pull.disabled &&
            this.$pull.effective >= this.$draw.effective;
        this.$attack.disabled ||= !this.$canDraw;
    }
}

class LgndCombatTechniqueStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.CombatTechniqueStrikeModeItemData,
) {
    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, {
            "system.$traits.strRoll": {
                label: "Strength Roll",
                abbrev: "StrRoll",
            },
        });
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction || "opposedTestStart",
            sohl.Utility.uniqueActions(actions, [
                {
                    functionName: "opposedTestStart",
                    name: "Automated Attack",
                    contextIconClass: "fas fa-circle-half-stroke",
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$attack.disabled;
                    },
                    contextGroup: "essential",
                },
                {
                    functionName: "opposedTestResume",
                    name: "Attack Resume",
                    contextIconClass: "",
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$impact.disabled;
                    },
                    contextGroup: "hidden",
                },
                {
                    functionName: "attackTest",
                    name: "Attack Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.ATTACK
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$attack.disabled;
                    },
                    contextGroup: "general",
                },
                {
                    functionName: "blockTest",
                    name: "Block Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.BLOCK
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return item && !item.system.$defense.block.disabled;
                    },
                    contextGroup: "general",
                },
                {
                    functionName: "counterstrikeTest",
                    name: "Counterstrike Test",
                    contextIconClass:
                        LgndSuccessTestResult.testTypes[
                            LgndSuccessTestResult.TEST_TYPE.COUNTERSTRIKE
                        ].icon,
                    contextCondition: (header) => {
                        header =
                            header instanceof HTMLElement ? header : header[0];
                        const li = header.closest(".item");
                        const item = fromUuidSync(li.dataset.uuid);
                        return (
                            item && !item.system.$defense.counterstrike.disabled
                        );
                    },
                    contextGroup: "general",
                },
            ]),
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            strRoll: false,
        });
    }

    processSiblings() {
        super.processSiblings();
        const strength = this.actor.getTraitByAbbrev("str");
        if (strength) {
            const strValue = strength.system.$score?.effective || 0;
            const strImpactMod = LgndUtility.strImpactMod(strValue);
            if (strImpactMod && !this.$traits.noStrMod) {
                this.$impact.add(
                    "Strength Impact Modifier",
                    "StrImpMod",
                    strImpactMod,
                );
            }
        }
    }
}

/*===============================================================*/
/*      Legendary Data Model Classes                                   */
/*===============================================================*/

function LgndMasteryLevelItemDataMixin(BaseMLID) {
    return class LgndMasteryLevelItemData extends BaseMLID {
        get isFateAllowed() {
            return (
                super.isFateAllowed &&
                !this.actor.system.$hasAuralShock &&
                !this.skillBaseFormula?.includes("@aur")
            );
        }

        setImproveFlag() {
            if (!this.improveFlag)
                this.item.update({ "system.improveFlag": true });
        }

        async unsetImproveFlag() {
            if (this.improveFlag)
                await this.item.update({ "system.improveFlag": false });
        }

        toggleImproveFlag() {
            if (this.improveFlag) this.unsetImproveFlag();
            else this.setImproveFlag();
        }

        getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
            return super.getIntrinsicActions(
                _data,
                defaultAction,
                sohl.Utility.uniqueActions(actions, [
                    {
                        functionName: "successValueTest",
                        name: "Success Value Test",
                        contextIconClass: "far fa-list",
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            return item && !item.system.$masteryLevel.disabled;
                        },
                        contextGroup: "essential",
                    },
                    {
                        functionName: "fateTest",
                        name: "Fate Test",
                        contextIconClass:
                            LgndSuccessTestResult.testTypes[
                                LgndSuccessTestResult.TEST_TYPE.FATE
                            ].icon,
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            return (
                                item &&
                                !item.system.$masteryLevel.fate.disabled &&
                                item.system.availableFate.length > 0
                            );
                        },
                        contextGroup: "essential",
                    },
                    {
                        functionName: "improveWithXP",
                        name: "Improve Mastery using XP",
                        contextIconClass: "fas fa-lightbulb-on",
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            if (!item || !item.system.canImprove) return false;
                            if (item.system.$masteryLevel.disabled)
                                return false;
                            const xpItem = item.actor?.getTraitByAbbrev("xp");
                            const xpVal =
                                (xpItem &&
                                    !xpItem?.system.$score?.disabled &&
                                    xpItem?.system.$score.effective) ||
                                -1;
                            return (
                                xpItem &&
                                xpVal >= item.system.$masteryLevel.index
                            );
                        },
                        contextGroup: "general",
                    },
                ]),
            );
        }

        /**
         * Updates the boosts value by adding the given value if the input is a number.
         *
         * @param {*} val
         */
        applyBoosts(val) {
            if (typeof val === "number") {
                this.$boosts += val;
            }
        }

        /**
         * Calculates the mastery boost based on the given mastery level. Returns different boost values based on different ranges of mastery levels.
         *
         * @static
         * @param {*} ml
         * @returns {(3 | 4 | 10 | 9 | 8 | 7 | 6 | 5)}
         */
        static calcMasteryBoost(ml) {
            if (ml <= 39) return 10;
            else if (ml <= 44) return 9;
            else if (ml <= 49) return 8;
            else if (ml <= 59) return 7;
            else if (ml <= 69) return 6;
            else if (ml <= 79) return 5;
            else if (ml <= 99) return 4;
            else return 3;
        }

        static async testAdjust(rollResult) {
            return rollResult;
        }

        /**
         * Perform Success Test for this Item
         *
         * @param {object} options
         * @returns {SuccessTestChatData}
         */
        async successTest(speaker, actor, token, character, scope) {
            ({ speaker, actor, token, character } =
                sohl.SohlMacro.getExecuteDefaults({
                    speaker,
                    actor,
                    token,
                    character,
                    needsActor: true,
                    self: this,
                }));

            let {
                skipDialog = false,
                type = `${this.type}-${this.name}-test`,
                title = `${this.item.label} Test`,
                testResult,
                noChat = false,
                mlMod,
            } = scope;

            if (testResult) {
                testResult = LgndSuccessTestResult.fromData(testResult);
            } else {
                testResult = LgndSuccessTestResult.fromData({
                    speaker,
                    item: this.item,
                    rollMode: game.settings.get("core", "rollMode"),
                    type,
                    title,
                    situationalModifier: 0,
                    typeLabel: this.constructor.typeLabel,
                    mlMod:
                        mlMod ||
                        LgndMasteryLevelModifier.create(
                            this.$masteryLevel,
                            this,
                        ),
                });
            }

            if (!skipDialog) {
                // Render modal dialog
                let dlgTemplate =
                    "systems/sohl/templates/dialog/standard-test-dialog.html";

                let dialogData = {
                    variant: "legendary",
                    type: testResult.type,
                    title: `${testResult.token ? testResult.token.name : testResult.actor.name} ${testResult.title}`,
                    mlMod: testResult.mlMod,
                    situationalModifier: testResult.situationalModifier,
                    rollMode: testResult.rollMode,
                    rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                        ([k, v]) => ({
                            group: "CHAT.RollDefault",
                            value: k,
                            label: v,
                        }),
                    ),
                };
                const html = await renderTemplate(dlgTemplate, dialogData);

                // Create the dialog window
                const result = await Dialog.prompt({
                    title: dialogData.title,
                    content: html.trim(),
                    label: "Roll",
                    callback: (html) => {
                        const form = html.querySelector("form");
                        const fd = new FormDataExtended(form);
                        const formData = fd.object;
                        const formSituationalModifier =
                            Number.parseInt(formData.situationalModifier, 10) ||
                            0;

                        if (formSituationalModifier) {
                            testResult.mlMod.add(
                                "Situational Modifier",
                                "SitMod",
                                formSituationalModifier,
                            );
                            testResult.situationalModifier =
                                formSituationalModifier;
                        }

                        const formSuccessLevelMod = Number.parseInt(
                            formData.successLevelMod,
                            10,
                        );
                        testResult.mlMod.successLevelMod = formSuccessLevelMod;
                        testResult.rollMode = formData.rollMode;
                        return true;
                    },
                    rejectClose: false,
                    options: { jQuery: false },
                });

                if (!result) return;
            }

            testResult.evaluate();

            if (!noChat) {
                await testResult.toChat({
                    speaker,
                    testResult,
                });
            }
            return testResult;
        }

        /**
         * Perform Success Value Test for this Item.
         *
         * @param {object} options
         * @returns {SuccessTestChatData}
         */
        successValueTest(speaker, actor, token, character, scope) {
            ({ speaker, actor, token, character } =
                sohl.SohlMacro.getExecuteDefaults({
                    speaker,
                    actor,
                    token,
                    character,
                    needsActor: true,
                    self: this,
                }));

            let {
                skipDialog = false,
                noChat = false,
                type = `${this.type}-${this.name}-svtest`,
                title = `${this.item.label} Success Value Test`,
                svTable = this.successValueTable,
            } = scope;

            return this.successTest(speaker, actor, token, character, {
                skipDialog,
                noChat,
                testResult: {
                    speaker,
                    item: this.item,
                    rollMode: game.settings.get("core", "rollMode"),
                    type,
                    title,
                    situationalModifier: 0,
                    typeLabel: this.constructor.typeLabel,
                    isSuccessValue: true,
                    svTable,
                    mlMod: LgndMasteryLevelModifier.create(
                        this.$masteryLevel,
                        this,
                    ),
                },
            });
        }

        async fateTest(speaker, actor, token, character, scope = {}) {
            let { skipDialog = false, noChat = false } = scope;

            ({ speaker, actor, token, character } =
                sohl.SohlMacro.getExecuteDefaults({
                    speaker,
                    actor,
                    token,
                    character,
                    needsActor: true,
                    self: this,
                }));

            // Ensure that there is fate available to be used
            const fateList = this.availableFate;
            let fateUuid;
            if (fateList?.length) {
                const dlgData = {
                    fateChoices: Object.fromEntries(
                        fateList.map((it) => [it.uuid, it.name]),
                    ),
                };
                const compiled = Handlebars.compile(`<form id="select-token"><div class="form-group">
                <label>Select which fate to use:</label>
                <select name="fateChoice">
                {{selectOptions fateChoices}}
            </select></div></form>`);
                const dlgHtml = compiled(dlgData, {
                    allowProtoMethodsByDefault: true,
                    allowProtoPropertiesByDefault: true,
                });
                fateUuid = await Dialog.prompt({
                    title: "Choose Fate",
                    content: dlgHtml,
                    label: "OK",
                    callback: async (html) => {
                        const form = html.querySelector("form");
                        const fd = new FormDataExtended(form);
                        const formdata = foundry.utils.expandObject(fd.object);
                        return formdata.fateChoice;
                    },
                    options: { jQuery: false },
                    rejectClose: false,
                });
                if (!fateUuid) return null;
            }
            const fateItem = await fromUuid(fateUuid);
            ui.notifications.warn(`Can't find fate with UUID ${fateUuid}`);
            if (!fateItem) return null;

            const mlMod = LgndMasteryLevelModifier.create(this.$masteryLevel, {
                parent: this,
            });
            this.fateBonusItems.forEach((it) => {
                mlMod.add(it.name, "FateBns", it.system.$level.effective);
            });

            const successTestResult = this.successTest(
                speaker,
                actor,
                token,
                character,
                {
                    noChat,
                    skipDialog,
                    type: `${this.type}-${this.name}-fate-test`,
                    title: `${this.item.label} Fate Test`,
                    testResult: {
                        speaker,
                        item: this.item,
                        rollMode: game.settings.get("core", "rollMode"),
                        situationalModifier: 0,
                        typeLabel: this.constructor.typeLabel,
                        mlMod: LgndMasteryLevelModifier.create(
                            this.$masteryLevel.fate,
                            this,
                        ),
                        svTable: [
                            {
                                maxValue:
                                    sohl.SOHL.CONST.SUCCESS_LEVEL
                                        .MarginalFailure,
                                lastDigit: [],
                                label: "No Fate",
                                description: "Fate test failed, no fate",
                            },
                            {
                                maxValue: Number.MAX_SAFE_INTEGER,
                                lastDigit: [],
                                label: "Fate Succeeded",
                                description:
                                    "Fate test succeeded, increase test by 1 Success Level",
                            },
                        ],
                    },
                },
            );

            // If user cancelled the roll, then return immediately
            if (!successTestResult) return null;

            LgndMasteryLevelModifier._handleDetailedDescription(
                successTestResult,
            );
            let fateCost = 0;
            if (successTestResult.isSuccess) {
                // If we got a critical success, then ask the player how to proceed
                if (successTestResult.isCritical) {
                    const fateResult = await Dialog.wait({
                        title: "Fate Critical Success",
                        content: `<p>Choose how to proceed:
                    <ol>
                    <li><strong>Free Fate:</strong> Get +1 success level bonus, but the character doesn't have to expend any fate points.</li>
                    <li><strong>Double Fate:</strong> Get +2 success level bonus, but the character must expend one fate point.</li>
                    </ol></p>`,
                        buttons: {
                            freeFate: {
                                icon: '<i class="far fa-circle-check"></i>',
                                label: "Free",
                                callback: () => "+1 Bonus, no cost",
                            },
                            doubleFate: {
                                icon: '<i class="fas fa-check-double"></i>',
                                label: "Double",
                                callback: () => "+2 Bonus, 1 Fate",
                            },
                        },
                        close: () => "freeFate",
                        default: "freeFate",
                        options: { jQuery: false },
                    });
                    if (fateResult === "doubleFate") {
                        successTestResult.label = "Fate Critical Success";
                        successTestResult.description =
                            "Increase test Success Level by 2, cost 1 FP";
                        fateCost = 1;
                    } else {
                        successTestResult.label = "Fate Critical Success";
                        successTestResult.description =
                            "Increase test Success Level by 1, no fate cost";
                    }
                } else {
                    fateCost = 1;
                }
            } else {
                fateCost = successTestResult.isCritical ? 1 : 0;
            }

            await this.successTestToChat({
                speaker,
                testResult: successTestResult,
            });

            // Reduce the fate level by the fate cost if any
            if (fateCost) {
                const newFate = Math.max(
                    0,
                    fateItem.system.levelBase - fateCost,
                );
                if (newFate !== fateItem.system.levelBase) {
                    fateItem.update({ "system.levelBase": newFate });
                }
            }

            // Reduce the number of charges for each fate bonus (if any)
            this.fateBonusItems.forEach((it) => {
                if (!it.system.$charges.disabled) {
                    const newCharges = Math.max(0, it.system.charges.value - 1);
                    if (newCharges !== it.system.charges.value) {
                        it.update({ "system.charges.value": newCharges });
                    }
                }
            });

            return successTestResult;
        }

        async improveWithSDR(speaker) {
            const updateData = { "system.improveFlag": false };
            let roll = await Roll.create("1d100 + @sb", {
                sb: this.skillBase.value,
            });
            const isSuccess = roll.total > this.$masteryLevel.base;

            if (isSuccess) {
                updateData["system.masteryLevelBase"] =
                    this.masteryLevelBase + this.sdrIncr;
            }
            let prefix = `${this.constructor.subTypes[this.subType]} ${
                this.constructor.typeLabel.singular
            }`;
            const chatTemplate =
                "systems/sohl/templates/chat/standard-test-card.html";
            const chatTemplateData = {
                variant: "legendary",
                type: `${this.type}-${this.name}-improve-sdr`,
                title: `${this.item.label} Development Roll`,
                effTarget: this.$masteryLevel.base,
                isSuccess: isSuccess,
                rollValue: roll.total,
                rollResult: roll.result,
                showResult: true,
                resultText: `${isSuccess ? "" : "No "}${prefix} Increase`,
                resultDesc: isSuccess
                    ? `${this.item.label} increased by ${this.sdrIncr} to ${
                          this.$masteryLevel.base + this.sdrIncr
                      }`
                    : "",
                description: isSuccess ? "Success" : "Failure",
                notes: "",
                sdrIncr: this.sdrIncr,
            };

            const html = await renderTemplate(chatTemplate, chatTemplateData);

            const messageData = {
                user: game.user.id,
                speaker,
                content: html.trim(),
                sound: CONFIG.sounds.dice,
            };

            ChatMessage.applyRollMode(messageData, "roll");

            // Create a chat message
            await ChatMessage.create(messageData);
        }

        async improveWithXP(speaker) {
            const xpItem = this.actor.getTraitByAbbrev("xp");
            if (xpItem?.system.$score.disabled) {
                ui.notifications.warn(
                    "Exprience Points disabled or don't exist, cannot improve with XP",
                );
                return null;
            }
            const xpVal = xpItem.system.$score.effective || 0;
            const newXPVal = xpVal - Math.max(this.$masteryLevel.index, 1);
            if (newXPVal >= 0) {
                await this.item.update({
                    "system.masteryLevelBase": this.masteryLevelBase + 1,
                });
                await xpItem.update({
                    "system.textValue": String(newXPVal),
                });
                const chatTemplate = "systems/sohl/templates/chat/xp-card.html";
                const chatTemplateData = {
                    variant: "legendary",
                    type: `${this.type}-${this.name}-improve-xp`,
                    title: `${this.item.label} Experience Point Increase`,
                    xpCost: xpVal - newXPVal,
                    skillIncrease: 1,
                };

                const html = await renderTemplate(
                    chatTemplate,
                    chatTemplateData,
                );

                const messageData = {
                    user: game.user.id,
                    speaker,
                    content: html.trim(),
                    sound: CONFIG.sounds.dice,
                };

                ChatMessage.applyRollMode(messageData, "roll");

                // Create a chat message
                await ChatMessage.create(messageData);
            }
        }

        /** @override */
        applyPenalties() {
            // Apply Encumbrance Penalty to Mastery Level
            const sbAttrs = this.skillBase.attributes;
            if (sbAttrs.at(0) === "Agility") {
                const enc = this.actor.system.$encumbrance.total;
                if (enc) this.$masteryLevel.add("Encumbrance", "Enc", -enc);
            }
        }

        prepareBaseData() {
            super.prepareBaseData();
            this.$masteryLevel &&= LgndMasteryLevelModifier.create(
                this.$masteryLevel,
                { parent: this },
            );
        }

        postProcess() {
            super.postProcess();
            this.applyPenalties();
        }
    };
}

class LgndInjuryItemData extends sohl.InjuryItemData {
    static get aspectTypes() {
        return {
            blunt: "Blunt",
            edged: "Edged",
            piercing: "Piercing",
            fire: "Fire",
            frost: "Frost",
            projectile: "Projectile",
        };
    }

    get treatments() {
        return {
            blunt: {
                M: {
                    treatment: "Compress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 30,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Set & Splint",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean, Dress & Surgery",
                    mod: null,
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            piercing: {
                M: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Clean & Dress",
                    mod: null,
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean, Dress & Surgery",
                    mod: {
                        name: "Treatment Penalty",
                        abbrev: "TrtBns",
                        value: -10,
                    },
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            edged: {
                M: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 20,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean, Dress & Surgery",
                    mod: null,
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            projectile: {
                M: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    newInj: -1,
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Extract Projectile",
                    mod: null,
                    useDexMod: true,
                    cf: { hr: 3, infect: true, impair: true, bleed: false },
                    newInj: -1,
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Extract Projectile",
                    mod: {
                        name: "Treatment Penalty",
                        abbrev: "TrtBns",
                        value: -10,
                    },
                    useDexMod: true,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            fire: {
                M: {
                    treatment: "Compress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 20,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                S: {
                    treatment: "Clean & Dress",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 10,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: true,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Clean & Dress",
                    mod: null,
                    useDexMod: false,
                    cf: {
                        hr: 2,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 3,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 4,
                        infect: true,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
            },
            frost: {
                M: {
                    treatment: "Warm",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 40,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    mf: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    ms: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                    },
                },
                S: {
                    treatment: "Warm",
                    mod: {
                        name: "Treatment Bonus",
                        abbrev: "TrtBns",
                        value: 20,
                    },
                    useDexMod: false,
                    cf: {
                        hr: 3,
                        infect: false,
                        impair: true,
                        bleed: false,
                        newInj: -1,
                    },
                    mf: {
                        hr: 4,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    ms: {
                        hr: 5,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                    cs: {
                        hr: 6,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: -1,
                    },
                },
                G: {
                    treatment: "Surgery & Amputate",
                    mod: null,
                    useDexMod: true,
                    cf: {
                        hr: -1,
                        infect: true,
                        impair: false,
                        bleed: true,
                        newInj: 5,
                    },
                    mf: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: true,
                        newInj: 4,
                    },
                    ms: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: true,
                        newInj: 3,
                    },
                    cs: {
                        hr: -1,
                        infect: false,
                        impair: false,
                        bleed: false,
                        newInj: 2,
                    },
                },
            },
        };
    }

    static calcZoneDieFormula(die, offset) {
        const result =
            (die ? "d" + die + (offset < 0 ? "" : "+") : "") + offset;
        return result;
    }

    get isBarbed() {
        return this.item.getFlag("sohl", "legendary.isBarbed");
    }

    set isBarbed(val) {
        this.item.setFlag("sohl", "legendary.isBarbed", !!val);
    }

    get isGlancing() {
        return this.item.getFlag("sohl", "legendary.isGlancing");
    }

    set isGlancing(val) {
        this.item.setFlag("sohl", "legendary.isGlancing", !!val);
    }

    get extraBleedRisk() {
        return this.item.getFlag("sohl", "legendary.extraBleedRisk");
    }

    set extraBleedRisk(val) {
        this.item.setFlag("sohl", "legendary.extraBleedRisk", !!val);
    }

    get permanentImpairment() {
        return this.item.getFlag("sohl", "legendary.permanentImpairment");
    }

    set permanentImpairment(val) {
        if (typeof val === "number") {
            val = Math.max(0, val);
            this.item.setFlag("sohl", "legendary.permanentImpairment", val);
        }
    }

    get untreatedHealing() {
        let treatmt = {
            hr: 5,
            infect: true,
            impair: false,
            bleed: false,
            newInj: -1,
        };

        const treatSev = this.$injuryLevel?.severity;
        if (treatSev) {
            if (treatSev !== "0") {
                const cf =
                    this.constructor.treatments[this.aspect]?.[treatSev]?.[
                        "cf"
                    ];
                if (typeof cf === "object") treatmt = cf;
            } else {
                treatmt = {
                    hr: 6,
                    infect: false,
                    impair: false,
                    bleed: false,
                    newInj: -1,
                };
            }
        }
        return treatmt;
    }

    prepareBaseData() {
        super.prepareBaseData();
        const newIL = new sohl.ValueModifier(this, {
            severity: (thisVM) => {
                let severity;
                if (thisVM.effective <= 0) {
                    severity = "0";
                } else if (thisVM.effective == 1) {
                    severity = "M1";
                } else if (thisVM.effective <= 3) {
                    severity = `S${thisVM.effective}`;
                } else {
                    severity = `G${thisVM.effective}`;
                }
                return severity;
            },
        });
        this.$injuryLevel = newIL.addVM(this.$injuryLevel, {
            includeBase: true,
        });
    }
    /** @override */
    postProcess() {
        super.postProcess();
        if (!this.isInEffect) return;

        // Apply this injury as impairment to bodylocations
        const blItem = this.actor.items.find(
            (it) =>
                it.system instanceof sohl.BodyLocationItemData &&
                it.name === this.bodyLocation,
        );
        if (blItem) {
            const blData = blItem.system;
            if (this.injuryLevel.effective > 3) {
                blData.impairment.setProperty("unusable", true);
                blData.impairment.set(
                    `${this.item.name} Grevious Injury: Unusable`,
                    "GInjUnusable",
                    0,
                );
            } else if (this.injuryLevel.effective > 1) {
                blData.impairment.add(
                    `${this.item.name} Serious Injury`,
                    "SInj",
                    -10,
                );
            } else if (
                this.injuryLevel.effective > 0 &&
                this.healingRate.effective < 6 &&
                this.isInEffect
            ) {
                blData.impairment.add(
                    `${this.item.name} Minor Injury`,
                    "MInj",
                    -5,
                );
            }
        }

        //        const injuryDurationDays = Math.trunc((game.time.worldTime - this.item.system.createdTime) / 86400);
        if (this.alData.mayBePermanent) {
            //const permanentImpairment = Math.min(25, Math.trunc(injuryDurationDays / 20) * 5);
            // TODO - Permanent Injury
        }
    }
}

class LgndMysticalAbilityItemData extends LgndMasteryLevelItemDataMixin(
    sohl.MysticalAbilityItemData,
) {}

class LgndTraitItemData extends LgndMasteryLevelItemDataMixin(
    sohl.TraitItemData,
) {
    get actionBodyParts() {
        return this.item.getFlag("sohl", "legendary.actionBodyParts") || [];
    }

    get diceFormula() {
        return this.item.getFlag("sohl", "legendary.diceFormula");
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$masteryLevel &&= LgndMasteryLevelModifier.create(
            this.$masteryLevel,
            {
                parent: this,
            },
        );
        if (this.abbrev === "fate") {
            this.$masteryLevel.setBase(this.$score.base);
        }
    }

    processSiblings() {
        super.processSiblings();
        if (this.isNumeric) {
            this.actionBodyParts.forEach((bp) => {
                for (const it in this.actor.allItems()) {
                    if (
                        it.system instanceof sohl.BodyPartItemData &&
                        it.name === bp
                    ) {
                        if (it.system.$impairment.unusable) {
                            this.$masteryLevel.set(
                                `${this.item.name} Unusable`,
                                `BPUnusable`,
                                0,
                            );
                        } else if (it.system.$impairment.value) {
                            this.$masteryLevel.add(
                                `${this.item.name} Impairment`,
                                `BPImp`,
                                it.system.$impairment.value,
                            );
                        }
                        break;
                    }
                }
            });
        }

        if (this.intensity === "attribute" && this.subType === "physique") {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof sohl.AfflictionItemData &&
                    it.system.subType === "fatigue"
                ) {
                    this.$masteryLevel.add(
                        it.name,
                        it.system.constructor.subTypeAbbreviation[
                            it.system.subType
                        ],
                        -it.system.$level.effective,
                    );
                }
            }
        }

        if (this.abbrev === "fate") {
            const aura = this.actor.getTraitByAbbrev("aur");
            if (aura) {
                this.$masteryLevel.add(
                    "Aura Secondary Modifier",
                    "AuraSM",
                    aura.system.$masteryLevel.secMod,
                );
            }
        }
    }
}

class LgndSkillItemData extends LgndMasteryLevelItemDataMixin(
    sohl.SkillItemData,
) {
    get actionBodyParts() {
        return this.item.getFlag("sohl", "legendary.actionBodyParts") || [];
    }

    get initSM() {
        return this.item.getFlag("sohl", "legendary.initSM") || 0;
    }

    static get sunsignTypes() {
        return {
            social: "water",
            nature: "earth",
            craft: "metal",
            lore: "aura",
            language: "aura",
            script: "aura",
            ritual: "aura",
            physical: "air",
            combat: "fire",
            esoteric: null,
        };
    }

    /**
     * Continue the opposed test. Only valid testTypes are "block" and "counterstrike".
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async opposedTestResume(speaker, actor, token, character, scope = {}) {
        let { noChat = false, opposedTestResult } = scope;

        if (!opposedTestResult) {
            throw new Error("Must supply opposedTestResult");
        }

        if (
            this.abbrev !== "dge" ||
            opposedTestResult.sourceTestResult.testType !==
                LgndSuccessTestResult.TEST_TYPE.ATTACK
        ) {
            return super.opposedTestResume(
                speaker,
                actor,
                token,
                character,
                scope,
            );
        }

        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
                needsToken: true,
                self: this,
            }));

        if (!opposedTestResult.targetTestResult) {
            opposedTestResult.targetTestResult = this.successTest({
                noChat: true,
                testType: LgndSuccessTestResult.TEST_TYPE.DODGE,
            });
            if (!opposedTestResult.targetTestResult) return null;
        } else {
            // In this situation, where the targetTestResult is provided,
            // the GM is modifying the result of a prior opposedTest.
            // Therefore, we re-display the dialog for each of the prior
            // successTests.
            opposedTestResult.sourceTestResult =
                opposedTestResult.sourceTestResult.item.successTest({
                    noChat: true,
                    successTestResult: opposedTestResult.sourceTestResult,
                });
            opposedTestResult.targetTestResult =
                opposedTestResult.targetTestResult.item.successTest({
                    noChat: true,
                    successTestResult: opposedTestResult.targetTestResult,
                });
        }

        opposedTestResult.evaluate();

        const combatResult = {
            attacker: {
                wins: false,
                isFumble: false,
                isStumble: false,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                addlTacAdvs: 0,
            },
            defender: {
                wins: false,
                isFumble: false,
                isStumble: false,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                addlTacAdvs: 0,
            },
        };

        combatResult.attacker.isFumble =
            opposedTestResult.sourceTestResult.isCritical &&
            !opposedTestResult.sourceTestResult.isSuccess &&
            opposedTestResult.sourceTestResult.lastDigit === 0;
        combatResult.attacker.isStumble =
            opposedTestResult.sourceTestResult.isCritical &&
            !opposedTestResult.sourceTestResult.isSuccess &&
            opposedTestResult.sourceTestResult.lastDigit === 5;

        combatResult.defender.isStumble =
            opposedTestResult.targetTestResult.isCritical &&
            !opposedTestResult.targetTestResult.isSuccess;

        const victoryStars = opposedTestResult.victoryStarsBreakTies;
        if (victoryStars > 0) {
            combatResult.attacker.wins = true;
            combatResult.attacker.addlTacAdvs = victoryStars - 1;
        } else {
            combatResult.defender.wins = true;
            combatResult.defender.addlTacAdvs = -victoryStars - 1;
        }

        if (combatResult.defender.addlTacAdvs) {
            combatResult.defender.tacticalAdvantageChoices = [
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.ACTION,
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.SETUP,
            ];
        }

        if (combatResult.attacker.addlTacAdvs) {
            combatResult.attacker.tacticalAdvantageChoices = Array.from(
                LgndOpposedTestResult.TACTICAL_ADVANTAGE.values(),
            );
        }

        combatResult.attacker.tacticalAdvantageChoicesText =
            sohl.Utility.listToText(
                combatResult.attacker.tacticalAdvantageChoices,
            );
        combatResult.defender.tacticalAdvantageChoicesText =
            sohl.Utility.listToText(
                combatResult.defender.tacticalAdvantageChoices,
            );

        opposedTestResult.combatResult = combatResult;

        if (!noChat) {
            opposedTestResult.toChat();
        }

        return opposedTestResult;
    }

    prepareBaseData() {
        super.prepareBaseData();
    }

    processSiblings() {
        super.processSiblings();
        this.actionBodyParts.forEach((bp) => {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof sohl.BodyPartItemData &&
                    it.name === bp
                ) {
                    if (it.system.$impairment.unusable) {
                        this.$masteryLevel.set(
                            `${this.item.name} Unusable`,
                            `BPUnusable`,
                            0,
                        );
                    } else if (it.system.$impairment.value) {
                        this.$masteryLevel.add(
                            `${this.item.name} Impairment`,
                            `BPImp`,
                            it.system.$impairment.value,
                        );
                    }
                    break;
                }
            }
        });

        if (["craft", "combat", "physical"].includes(this.subType)) {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof sohl.AfflictionItemData &&
                    it.system.subType === "fatigue"
                ) {
                    this.$masteryLevel.add(
                        it.name,
                        it.system.constructor.subTypeAbbreviation[
                            it.system.subType
                        ],
                        -it.system.$level.effective,
                    );
                }
            }
        }
    }
}

class LgndAfflictionItemData extends sohl.AfflictionItemData {
    /** @override */
    setupVirtualItems() {
        super.setupVirtualItems();
        if (["privation", "infection"].includes(this.subType)) {
            let weakness = 0;
            if (this.$healingRate.effective <= 2) {
                weakness = 10;
            } else if (this.$healingRate.effective <= 4) {
                weakness = 5;
            }
            if (weakness) {
                this.item.constructor.create(
                    {
                        name: `${this.item.name} Fatigue`,
                        type: sohl.AfflictionItemData.typeName,
                        "system.subType": "weakness",
                        "system.fatigueBase": weakness,
                    },
                    { cause: this.item, parent: this.actor },
                );
            }
        }
    }
}

class LgndAnatomyItemData extends sohl.AnatomyItemData {
    $maxZones;

    prepareBaseData() {
        super.prepareBaseData();
        this.$maxZones = 0;
    }
}

class LgndBodyZoneItemData extends sohl.BodyZoneItemData {
    $bodyZoneProbSum;

    // List of possible dice for Zone Dice.
    static get dice() {
        return {
            0: "None",
            1: "d1",
            2: "d2",
            3: "d3",
            4: "d4",
            5: "d5",
            6: "d6",
            8: "d8",
            10: "d10",
            12: "d12",
            16: "d16",
            20: "d20",
            24: "d24",
            32: "d32",
            40: "d40",
            48: "d48",
        };
    }

    get zoneNumbers() {
        return this.item.getFlag("sohl", "legendary.zones") || [];
    }

    set zoneNumbers(zones) {
        let result = [];
        if (Array.isArray(zones)) {
            result = zones;
        } else if (typeof zones === "string") {
            result = zones.split(/.*,.*/).reduce((ary, zone) => {
                const num = Number.parseInt(zone, 10);
                if (!Number.isNaN(num) && !ary.includes(num)) ary.push(num);
            }, result);
        } else {
            throw new Error(`Invalid zones '${zones}'`);
        }
        result.sort((a, b) => a - b);
        this.item.setFlag("sohl", "legendary.zones", result);
    }

    get zoneNumbersLabel() {
        return this.zoneNumbers.join(",");
    }

    get affectsMobility() {
        return !!this.item.getFlag("sohl", "legendary.affectsMobility");
    }

    get affectedSkills() {
        return this.item.getFlag("sohl", "legendary.affectedSkills") || [];
    }

    get affectedAttributes() {
        return this.item.getFlag("sohl", "legendary.affectedAttributes") || [];
    }

    static get maxZoneDie() {
        return Object.values(this.dice).at(-1);
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyZoneProbSum = new sohl.ValueModifier(this);
    }

    /** @override */
    processSiblings() {
        super.processSiblings();
        const anatomy = this.item.nestedIn;
        if (anatomy) {
            anatomy.system.$maxZones = Math.max(
                anatomy.system.$maxZones,
                ...this.zoneNumbers,
            );
        }
    }
}

class LgndBodyPartItemData extends sohl.BodyPartItemData {
    /**
     * Represents body part impairment based on injuries.
     * If body part is injured, impairment will be less than
     * zero.  Values greater than zero are treated as zero
     * impairment.
     *
     * @type {ValueModifier}
     */
    $impairment;

    $bodyPartProbSum;

    get probWeight() {
        return this.item.getFlag("sohl", "legendary.probWeight") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyPartProbSum = new sohl.ValueModifier(this);
        this.$impairment = new sohl.ValueModifier(this, {
            unusable: false,
            value: (thisVM) => {
                Math.min(thisVM.effective, 0);
            },
        });
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        const bodyZone = this.item.nestedIn;
        bodyZone.system.$bodyZoneProbSum.add(
            this.name,
            this.abbrev,
            this.probWeight,
        );

        //        this.actor.system.$health.max += this.$health.effective;

        // Add this body part's health to overall actor health.
        // If this body part is unusable, or impairment is < -10,
        // then none of the body part health is added to the
        // actor health.
        if (!this.$impairment.unusable) {
            // if (!this.$impairment.value) {
            //     // If no impairment, then add full body part health
            //     this.actor.system.$health.add(
            //         `${this.item.name} Impairment`,
            //         "Impair",
            //         this.$health.effective,
            //     );
            // } else if (this.$impairment.effective >= -5) {
            //     // If minor impairment, then add half body part health
            //     this.actor.system.$health.add(
            //         `${this.item.name} Impairment`,
            //         "Impair",
            //         Math.floor(this.$health.effective / 2),
            //     );
            // } else if (this.$impairment.value >= -10) {
            //     // If major impairment, then add 1/4 body part health
            //     this.actor.system.$health.add(
            //         `${this.item.name} Impairment`,
            //         "Impair",
            //         Math.floor(this.$health.effective / 4),
            //     );
            // }
        } else {
            // Body parts marked "unusable" can never hold anything.
            if (this.heldItem?.system instanceof sohl.GearItemData) {
                if (this.heldItem.system.isHeldBy.includes(this.item.id)) {
                    ui.notifications.warn(
                        `${this.item.name} is unusable, so dropping everything being held in the body part`,
                    );
                    this.update({ "system.heldItem": "" });
                }
            }
        }
    }
}

class LgndBodyLocationItemData extends sohl.BodyLocationItemData {
    $impairment;

    get isFumble() {
        return !!this.item.getFlag("sohl", "legendary.isFumble");
    }

    get isStumble() {
        return !!this.item.getFlag("sohl", "legendary.isStumble");
    }

    get bleedingSevThreshold() {
        return (
            this.item.getFlag("sohl", "legendary.bleedingSevThreshold") ?? null
        );
    }

    get amputateModifier() {
        return this.item.getFlag("sohl", "legendary.amputateModifier") ?? null;
    }

    get shockValue() {
        return this.item.getFlag("sohl", "legendary.shockValue") || 0;
    }

    get probWeight() {
        return this.item.getFlag("sohl", "legendary.probWeight") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$protection = foundry.utils.mergeObject(
            this.$protection,
            {
                blunt: new sohl.ValueModifier(this),
                edged: new sohl.ValueModifier(this),
                piercing: new sohl.ValueModifier(this),
                fire: new sohl.ValueModifier(this),
            },
            { inplace: true },
        );
        this.$impairment = new sohl.ValueModifier(this, { unusable: false });
    }

    processSiblings() {
        super.processSiblings();
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        let thisIsUnusable = this.$impairment.unusable;

        const bpItem = this.item.nestedIn;
        if (bpItem) {
            const bpImp = bpItem.system.$impairment;
            if (this.$impairment.effective) {
                bpImp.addVM(this.$impairment);
            }

            if (this.$impairment.unusable) {
                bpImp.$impairment.unusable = true;
            }

            bpItem.system.$bodyPartProbSum.add(
                this.name,
                this.abbrev,
                this.probWeight,
            );
        }
    }
}

class LgndArmorGearItemData extends sohl.ArmorGearItemData {
    $encumbrance;

    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, super.effectKeys, {
            "system.$encumbrance": {
                label: "Encumbrance",
                abbrev: "Enc",
            },
        });
    }

    get encumbrance() {
        return this.item.getFlag("sohl", "legendary.encumbrance") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.$encumbrance = new sohl.ValueModifier(this);
        this.$encumbrance.setBase(this.encumbrance);

        // Armor, when equipped, is weightless
        if (this.isEquipped) {
            this.$weight.setBase(0);
        }
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        if (this.$encumbrance && this.isEquipped) {
            // Armor, when worn, may have an encumbrance effect.  If present, use it.
            this.actor.system.$encumbrance.add(
                `this.item.name Encumbrance`,
                "Enc",
                this.$encumbrance,
            );
        }
    }
}
class LgndWeaponGearItemData extends sohl.WeaponGearItemData {
    $length;
    $heft;
    $baseRange;

    get baseRangeBase() {
        return this.item.getFlag("sohl", "legendary.baseRangeBase") || 0;
    }

    get heftBase() {
        return this.item.getFlag("sohl", "legendary.heftBase") || 0;
    }

    prepareBaseData() {
        super.prepareBaseData();

        this.$length = new sohl.ValueModifier(this);
        this.$length.setBase(this.lengthBase);

        this.$heft = new sohl.ValueModifier(this);
        this.$heft.setBase(this.heftBase);

        this.$baseRange = new sohl.ValueModifier(this);
        this.$baseRange.setBase(this.baseRangeBase);
    }

    setupVirtualItems() {
        super.setupVirtualItems();
        this.items.forEach((it) => {
            if (
                !it.system.transfer &&
                it.system instanceof sohl.MissileWeaponStrikeModeItemData
            ) {
                const missileSM = it;
                if (
                    missileSM.system.projectileType &&
                    missileSM.system.projectileType !== "none"
                ) {
                    this.actor.itemTypes.projectilegear.forEach((proj, idx) => {
                        if (
                            proj.system.quantity > 0 &&
                            proj.system.subType ===
                                missileSM.system.projectileType
                        ) {
                            const itemData = missileSM.toObject();
                            itemData._id = foundry.utils.randomID();
                            itemData.sort += idx;
                            if (proj.system.impactBase.die >= 0) {
                                itemData.system.impactBase.die =
                                    proj.system.impactBase.die;
                            }
                            if (proj.system.impactBase.aspect) {
                                itemData.system.impactBase.aspect =
                                    proj.system.impactBase.aspect;
                            }
                            if (proj.system.impactBase.modifier >= 0) {
                                itemData.system.impactBase.modifier =
                                    proj.system.impactBase.modifier;
                            }
                            itemData.name = proj.name;

                            itemData.effects.push(
                                ...proj.effects.contents.map((e) =>
                                    e.toObject(),
                                ),
                            );
                            const item = new sohl.SohlItem(itemData, {
                                parent: this.item.actor,
                            });
                            item.cause = this.item;
                        }
                    });
                }
            }
        });
    }
}

class LgndProjectileWeaponGearItemData extends sohl.ProjectileGearItemData {
    static get effectKeys() {
        return sohl.Utility.simpleMerge(super.effectKeys, {
            "system.$traits.armorReduction": {
                label: "Armor Reduction",
                abbrev: "ProjAR",
            },
        });
    }

    prepareBaseData() {
        super.prepareBaseData();

        this.$attack = new LgndCombatModifier(this);
        this.$impact = new LgndImpactModifier(this);
    }
}

export class LgndUtility extends sohl.Utility {
    static strImpactMod(str) {
        if (typeof str !== "number") return -10;
        return str > 5
            ? Math.trunc(str / 2) - 5
            : [-10, -10, -8, -6, -4, -3].at(Math.max(str, 0));
    }

    static engagementZoneRange(reach) {
        if (reach <= 7) return 5;
        const result = (Math.floor((reach - 7) / 5) + 1) * 5;
        return result;
    }

    /**
     * Calculates the distance from sourceToken to targetToken in "scene" units (e.g., feet).
     *
     * @param {Token} sourceToken
     * @param {Token} targetToken
     * @param {Boolean} gridUnits If true, return in grid units, not "scene" units
     */
    static rangeToTarget(sourceToken, targetToken, gridUnits = false) {
        if (!sourceToken || !targetToken || !canvas.scene || !canvas.scene.grid)
            return 9999;

        // If the current scene is marked "Theatre of the Mind", then range is always 0
        if (canvas.scene.getFlag("sohl", "isTotm")) return 0;

        const sToken = canvas.tokens.get(sourceToken.id);
        const tToken = canvas.tokens.get(targetToken.id);

        const segments = [];
        const source = sToken.center;
        const dest = tToken.center;
        const ray = new Ray(source, dest);
        segments.push({ ray });
        const distances = canvas.grid.measureDistances(segments, {
            gridSpaces: true,
        });
        const distance = distances[0];
        if (gridUnits) return Math.round(distance / canvas.dimensions.distance);
        return distance;
    }

    /**
     * Determine if the token is valid (must be either a 'creature' or 'character')
     *
     * @param {Token} token
     */
    static isValidToken(token) {
        if (!token) {
            ui.notifications.warn("No token selected.");
            return false;
        }

        if (!token.actor) {
            ui.notifications.warn(`Token ${token.name} is not a valid actor.`);
            return false;
        }

        if (token.actor.type === "entity") {
            return true;
        } else {
            ui.notifications.warn(
                `Token ${token.name} is not a character or creature.`,
            );
            return false;
        }
    }
}

export class LgndTour extends Tour {
    actor;
    item;

    async _preStep() {
        await super._preStep();
        const currentStep = this.currentStep;

        if (currentStep.actor) {
            this.actor = await CONFIG.Actor.documentClass.create(
                currentStep.actor,
            );
            await this.actor.sheet?._render(true);
        }

        if (currentStep.itemName) {
            if (!this.actor) {
                console.warn("No actor found for step " + currentStep.title);
            }
            this.item = this.actor?.items.getName(currentStep.itemName);
            const app = this.item.sheet;
            if (!app.rendered) {
                await app._render(true);
            }
            currentStep.selector = currentStep.selector?.replace(
                "itemSheetID",
                app.id,
            );
        }

        if (currentStep.tab) {
            switch (currentStep.tab.parent) {
                case LGND.CONST.TOUR_TAB_PARENTS.ACTOR: {
                    if (!this.actor) {
                        console.warn("No Actor Found");
                        break;
                    }
                    const app = this.actor.sheet;
                    app?.activateTab(currentStep.tab.id);
                    break;
                }

                case LGND.CONST.TOUR_TAB_PARENTS.ITEM: {
                    if (!this.item) {
                        console.warn("No Item Found");
                        break;
                    }
                    const app = this.item.sheet;
                    app?.activateTab(currentStep.tab.id);
                    break;
                }
            }
        }
        currentStep.selector = currentStep.selector?.replace(
            "actorSheetID",
            this.actor?.sheet?.id,
        );
    }
}

export class LgndCommands extends sohl.Commands {
    static async importActors(jsonFilename, folderName) {
        const response = await fetch(jsonFilename);
        const content = await response.json();

        let actorFolder = game.folders.find(
            (f) => f.name === folderName && f.type === "Actor",
        );
        if (actorFolder) {
            const msg = `Folder ${folderName} exists, delete it before proceeding`;
            console.error(msg);
            return;
        }

        actorFolder = await Folder.create({ type: "Actor", name: folderName });

        await sohl.Utility.asyncForEach(content.Actor, async (f) => {
            console.log("Processing Animate Entity ${f.name}");
            const actor = await sohl.SohlActor.create({ name: f.name });
            const updateData = [];
            const itemData = [];
            // Fill in attribute values
            Object.keys(f.system.attributes).forEach((attr) => {
                const attrItem = actor.items.find(
                    (it) =>
                        it.system instanceof sohl.TraitItemData &&
                        it.name.toLowerCase() === attr,
                );
                if (attrItem)
                    itemData.push({
                        _id: attrItem.id,
                        "system.textValue": f.system.attributes[attr].base,
                    });
            });

            updateData.push({
                "system.description": f.system.description,
                "system.bioImage": f.system.bioImage,
                "system.biography": f.system.biography,
                "prototypeToken.actorLink": f.prototypeToken.actorLink,
                "prototypeToken.name": f.prototypeToken.name,
                "prototypeToken.texture.src": f.prototypeToken.texture.src,
                folder: actorFolder.id,
                items: itemData,
            });

            await actor.update(updateData);
        });
    }
}
sohl.SOHL.cmds = LgndCommands;

const LgndActorDataModels = foundry.utils.mergeObject(
    sohl.SohlActorDataModels,
    {
        [sohl.AnimateEntityActorData.typeName]: LgndAnimateEntityActorData,
    },
    { inplace: false },
);

const LgndItemDataModels = foundry.utils.mergeObject(
    sohl.SohlItemDataModels,
    {
        [sohl.ProtectionItemData.typeName]: LgndProtectionItemData,
        [sohl.MysticalAbilityItemData.typeName]: LgndMysticalAbilityItemData,
        [sohl.TraitItemData.typeName]: LgndTraitItemData,
        [sohl.SkillItemData.typeName]: LgndSkillItemData,
        [sohl.InjuryItemData.typeName]: LgndInjuryItemData,
        [sohl.AfflictionItemData.typeName]: LgndAfflictionItemData,
        [sohl.AnatomyItemData.typeName]: LgndAnatomyItemData,
        [sohl.BodyZoneItemData.typeName]: LgndBodyZoneItemData,
        [sohl.BodyPartItemData.typeName]: LgndBodyPartItemData,
        [sohl.BodyLocationItemData.typeName]: LgndBodyLocationItemData,
        [sohl.MeleeWeaponStrikeModeItemData.typeName]:
            LgndMeleeWeaponStrikeModeItemData,
        [sohl.MissileWeaponStrikeModeItemData.typeName]:
            LgndMissileWeaponStrikeModeItemData,
        [sohl.CombatTechniqueStrikeModeItemData.typeName]:
            LgndCombatTechniqueStrikeModeItemData,
        [sohl.ArmorGearItemData.typeName]: LgndArmorGearItemData,
        [sohl.WeaponGearItemData.typeName]: LgndWeaponGearItemData,
        [sohl.ProjectileGearItemData.typeName]:
            LgndProjectileWeaponGearItemData,
    },
    { inplace: false },
);

const LgndModifiers = foundry.utils.mergeObject(
    sohl.SohlModifiers,
    {
        ImpactModifier: LgndImpactModifier,
        MasteryLevelModifier: LgndMasteryLevelModifier,
        CombatModifier: LgndCombatModifier,
    },
    { inplace: false },
);

export const verData = {
    id: "legendary",
    label: "Song of Heroic Lands: Legendary",
    cmds: LgndCommands,
    CONFIG: {
        displayChatActions: sohl.Utility.displayChatActions,
        onChatCardEditAction: sohl.Utility.onChatCardEditAction,
        onChatCardButton: sohl.Utility.onChatCardButton,
        Helper: {
            modifiers: LgndModifiers,
            contextMenu: sohl.SohlContextMenu,
        },
        Actor: {
            documentClass: sohl.SohlActor,
            documentSheets: [
                {
                    cls: sohl.SohlActorSheet,
                    types: Object.keys(LgndActorDataModels),
                },
            ],
            dataModels: LgndActorDataModels,
            typeLabels: sohl.SohlActorTypeLabels,
            typeIcons: sohl.SohlActorTypeIcons,
            types: Object.keys(LgndActorDataModels),
            defaultType: sohl.AnimateEntityActorData.typeName,
            compendiums: ["sohl.leg-characters", "sohl.leg-creatures"],
        },
        Item: {
            documentClass: sohl.SohlItem,
            documentSheets: [
                {
                    cls: sohl.SohlItemSheet,
                    types: Object.keys(LgndItemDataModels).filter(
                        (t) => t !== sohl.ContainerGearItemData.typeName,
                    ),
                },
                {
                    cls: sohl.SohlContainerGearItemSheet,
                    types: [sohl.ContainerGearItemData.typeName],
                },
            ],
            dataModels: LgndItemDataModels,
            typeLabels: sohl.SohlItemTypeLabels,
            typeIcons: sohl.SohlItemTypeIcons,
            types: Object.keys(LgndItemDataModels),
            compendiums: [
                "sohl.leg-characteristics",
                "sohl.leg-possessions",
                "sohl.leg-mysteries",
            ],
        },
        ActiveEffect: {
            documentClass: sohl.SohlActiveEffect,
            dataModels: {
                [sohl.SohlActiveEffectData.typeName]: sohl.SohlActiveEffectData,
            },
            typeLabels: {
                [sohl.SohlActiveEffectData.typeName]:
                    sohl.SohlActiveEffectData.typeLabel.singular,
            },
            typeIcons: { [sohl.SohlActiveEffectData.typeName]: "fas fa-gears" },
            types: [sohl.SohlActiveEffectData.typeName],
            legacyTransferral: false,
        },
        Combatant: {
            documentClass: sohl.SohlCombatant,
        },
        Macro: {
            documentClass: sohl.SohlMacro,
            documentSheet: sohl.SohlMacroConfig,
        },
    },
    CONST: foundry.utils.mergeObject(sohl.SOHL.CONST, LGND.CONST, {
        inplace: false,
    }),
};
