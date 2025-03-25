/* eslint-disable no-unused-vars */
import * as sohl from "./sohl-common.mjs";

/* ====================================================================== */
/*          Constants                                                     */
/* ====================================================================== */

const fields = foundry.data.fields;

function _l(stringId, data = {}) {
    return sohl.SohlLocalize.format(stringId, data);
}

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
        if (!result || !Number.isInteger(result)) {
            switch (this.aspect) {
                case "blunt":
                    return 3;
                case "edged":
                    return 5;
                case "piercing":
                    return 4;
                case "fire":
                    return 2;
                default:
                    return 0;
            }
        }
        return result;
    }

    constructor(data = {}, context = {}) {
        foundry.utils.mergeObject(
            data,
            {
                properties: {
                    armorReduction: 0,
                    extraBleedRisk: false,
                    zoneDie: 0,
                    startZone: 1,
                    isProjectile: false,
                    bodyLocationId: "",
                    impactTAOverride: null,
                },
            },
            { overwrite: false },
        );
        super(data, context);
    }
}

class LgndMasteryLevelModifier extends sohl.MasteryLevelModifier {
    constructor(data = {}, context = {}) {
        foundry.utils.mergeObject(
            data,
            {
                properties: {
                    secMod: (thisVM) => {
                        return (thisVM.index - 5) * 5;
                    },
                },
            },
            { overwrite: false },
        );
        super(data, context);
    }
}

class LgndCombatModifier extends sohl.CombatModifier {}

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
    aim;
    defaultAim;
    svSuccess;
    cxBothOption;
    _successValue;
    _isSuccessValue;
    _svBonus;

    static get TEST_TYPE() {
        if (!this._TEST_TYPE) {
            this._TEST_TYPE = foundry.utils.mergeObject(
                super.TEST_TYPE,
                {
                    SUCCESSVALUE: "successvalue",
                    IMPROVEXP: "improvexp",
                    FATE: "fate",
                },
                { inplace: false },
            );
        }

        return this._TEST_TYPE;
    }

    static get SUCCESS_VALUE_TABLE() {
        return [
            {
                maxValue: 0,
                result: 0,
                limited: [],
                success: false,
                label: "No Value",
                description: "Test fails to produce a usable result",
            },
            {
                maxValue: 2,
                result: 0,
                limited: [],
                success: false,
                label: "Little Value",
                description: "Test produces a limited or flawed result",
            },
            {
                maxValue: 4,
                result: 0,
                limited: [],
                success: true,
                label: "Base Value",
                description: "Test produces an average result",
            },
            {
                maxValue: 8,
                result: (chatData) => chatData.successValue - 4,
                limited: [],
                success: true,
                label: (chatData) =>
                    "\u2605".repeat(chatData.successValue - 4) + " Bonus Value",
                description: "Test produces a superior result",
            },
            {
                maxValue: 999,
                result: 5,
                limited: [],
                success: true,
                label: "\u2605".repeat(5) + " Bonus Value",
                description: "Test produces a superior result",
            },
        ];
    }

    static get testTypes() {
        if (!this._testTypes) {
            this._testTypes = foundry.utils.mergeObject(
                super.testTypes,
                {
                    [this.TEST_TYPE.SUCCESSVALUE]: {
                        type: this.TEST_TYPE.SUCCESSVALUE,
                        name: "Success Value Test",
                        contextIconClass: "far fa-list",
                        functionName: "successValueTest",
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            return item && !item.system.$masteryLevel.disabled;
                        },
                        contextGroup:
                            sohl.SohlContextMenu.SORT_GROUPS.ESSENTIAL,
                    },
                    [this.TEST_TYPE.IMPROVEXP]: {
                        type: this.TEST_TYPE.IMPROVEXP,
                        name: "Improve Mastery using XP",
                        contextIconClass: "fas fa-lightbulb-on",
                        functionName: "improveWithXP",
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
                        contextGroup: sohl.SohlContextMenu.SORT_GROUPS.GENERAL,
                    },
                    [this.TEST_TYPE.FATE]: {
                        type: this.TEST_TYPE.FATE,
                        name: "Fate Test",
                        contextIconClass: "fas fa-stars",
                        functionName: "fateTest",
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
                        contextGroup:
                            sohl.SohlContextMenu.SORT_GROUPS.ESSENTIAL,
                    },
                },
                { inplace: false },
            );
        }

        return this._testTypes;
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        let {
            aim,
            defaultAim,
            targetMovement,
            cxBothOption = false,
            isSuccessValue = false,
            svTable,
        } = data;
        this.aim = aim;
        this.defaultAim = defaultAim;
        this._targetMovement = targetMovement;
        this.cxBothOption = cxBothOption;
        this._svBonus = null;
        this._isSuccessValue = isSuccessValue;
        this._successValue = 0;
        this.svTable = svTable || this.mlMod.successValueTable;
    }

    get isSuccessValue() {
        return this._isSuccessValue;
    }

    get successValue() {
        return this._successValue;
    }

    get svBonus() {
        return this._svBonus;
    }

    get successValueTable() {
        return (
            this.item.getFlag("sohl", "legendary.successValueTable") ||
            this.constructor.SUCCESS_VALUE_TABLE
        );
    }

    async evaluate() {
        let allowed = await super.evaluate();
        if (allowed) {
            let successLevelIncr = 0;
            if (this.isCritical) {
                successLevelIncr =
                    this.successLevel -
                    (this.isSuccess
                        ? LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_SUCCESS
                        : LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE);
            }
            if (successLevelIncr) {
                this._description += ` (${successLevelIncr >= 0 ? "+" : ""}${successLevelIncr})`;
            }

            if (this._isSuccessValue) {
                this.successValueMod = this.successLevel - 1;
                this._successValue = this.index + this.successValueMod;
                const slSign = this.successValueMod < 0 ? "-" : "+";
                this.successValueExpr = `${this.index} ${slSign} ${Math.abs(this.successValueMod)}`;

                // The meaning of the success value bonus ("svBonus") is
                // unique to each type of success value.  Sometimes it
                // represents the number of rolls on another table, or the
                // increase in value or quality of a crafted item, or any
                // other thing.  See the description of the specific test
                // to determine the meaning of the bonus.
                this._svBonus =
                    LgndMasteryLevelModifier._handleDetailedDescription(
                        this,
                        this._successValue,
                        this.svTable,
                    );
            } else if (this.mlMod.hasProperty("testDescTable")) {
                // If there is a table providing detailed description of
                // the results of this test, then process that table to
                // extract the detailed result descriptions.  Many tests
                // will not have these detailed descriptions, in which
                // case only generic descriptions will be given.
                LgndMasteryLevelModifier._handleDetailedDescription(
                    this,
                    this.successLevel,
                    this.mlMod.testDescTable,
                );
            }
        }
        return allowed;
    }

    get chatData() {
        return foundry.utils.mergeObject(super.chatData, {
            aim: this.aim,
            defaultAim: this.defaultAim,
            successValue: this.successValue,
            svBonus: this.svBonus,
            svSuccess: this.svSuccess,
        });
    }

    toJSON() {
        return foundry.utils.mergeObject(super.toJSON(), {
            aim: this.aim,
            defaultAim: this.defaultAim,
            isSuccessValue: this._isSuccessValue,
            svSuccess: this.svSuccess,
            svTable: this.svTable,
            movementOptions:
                LgndMissileWeaponStrikeModeItemData.movementOptions,
            targetMovement: this._targetMovement,
            cxBothOption: this.cxBothOption,
        });
    }
}

class LgndOpposedTestResult extends sohl.OpposedTestResult {
    _victoryStars;

    constructor(data = {}, context = {}) {
        super(data, context);
        let { victoryStars = 0 } = data;
        if (!Number.isInteger(victoryStars))
            throw new Error("victoryStars must be an integer");
        this._victoryStars = victoryStars;
    }

    get isTied() {
        return !this.bothFail && this._victoryStars === 0;
    }

    get bothFail() {
        return !(
            this.sourceTestResult.isSuccess || this.targetTestResult?.isSuccess
        );
    }

    get victoryStars() {
        if (this.bothFail) return 0;
        let vs = this._victoryStars;
        if (this.isTied && this.breakTies) vs += this.tieBreak;
        return vs;
    }

    set victoryStarsBase(val) {
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
            throw new Error(`Invalid value: ${val}`);
        }
        this.tieBreak = 0;
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
                    ? CONFIG.SOHL.CONST.CHARS.STARF
                    : CONFIG.SOHL.CONST.CHARS.STAR,
            );
            result.text = result.vsList.join("");
        }
        return result;
    }

    toJSON() {
        return foundry.utils.mergeObject(super.toJSON(), {
            victoryStars: this._victoryStars,
        });
    }

    async evaluate() {
        let allowed = await super.evaluate();
        if (allowed && this.targetTestResult) {
            // Skill tests (including dodge) always break ties
            this.breakTies ||=
                this.targetTestResult.testType.type ===
                LgndSuccessTestResult.TEST_TYPE.SKILL;

            if (!this.bothFail) {
                this.victoryStarsBase =
                    this.sourceTestResult.successLevel -
                    this.targetTestResult.successLevel;
            }

            if (!this.victoryStarsBase) {
                // We have a tie, so first try to break it by giving it to the one with the higher roll
                this.tieBreak = Math.max(
                    -1,
                    Math.min(
                        1,
                        this.sourceTestResult.roll.total -
                            this.targetTestResult.roll.total,
                    ),
                );
                while (!this.tieBreak)
                    this.tieBreak =
                        Math.round(sohl.MersenneTwister.random() * 2) - 1;
            }
        }

        return allowed;
    }
}

export class LgndCombatTestResult extends sohl.CombatTestResult {
    tacticalAdvantageChoices;
    tacticalAdvantageChoicesText;
    tacticalAdvantages;
    addlTacAdvs;

    static get TACTICAL_ADVANTAGE() {
        return {
            IMPACT: "impact",
            PRECISION: "precision",
            ACTION: "action",
            SETUP: "setup",
        };
    }

    static get tacticalAdvantageList() {
        return {
            [this.TACTICAL_ADVANTAGE.IMPACT]: "Impact",
            [this.TACTICAL_ADVANTAGE.PRECISION]: "Precision",
            [this.TACTICAL_ADVANTAGE.ACTION]: "Action",
            [this.TACTICAL_ADVANTAGE.SETUP]: "Setup",
        };
    }

    static get TEST_TYPE() {
        // Since we need the test types in LgndSuccessTestResult, and it is not in our
        // inheritance chain, we must specifically pull in the values.
        if (!this._TEST_TYPE) {
            const other = foundry.utils.mergeObject(
                LgndSuccessTestResult.TEST_TYPE,
                {
                    DIRECT: "direct",
                    VOLLEY: "volley",
                    EVADING: "evading",
                },
                { inplace: false },
            );

            this._TEST_TYPE = foundry.utils.mergeObject(
                super.TEST_TYPE,
                other,
                {
                    inplace: false,
                },
            );
        }

        return this._TEST_TYPE;
    }

    static get testTypes() {
        // Since we need the test types in LgndSuccessTestResult, and it is not in our
        // inheritance chain, we must specifically pull in the values.
        if (!this._testTypes) {
            const other = foundry.utils.mergeObject(
                LgndSuccessTestResult.testTypes,
                {
                    [this.TEST_TYPE.DIRECT]: {
                        type: this.TEST_TYPE.DIRECT,
                        name: "Direct Missile Attack",
                        contextIconClass: "fas fa-bow-arrow",
                        functionName: "directMissileAttack",
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            if (!item) return false;
                            return (
                                item.type ===
                                    LgndMissileWeaponStrikeModeItemData.TYPE_NAME &&
                                item.system.group ===
                                    LgndCombatTestResult.TEST_TYPE.DIRECT &&
                                !item.system.$masteryLevel.disabled
                            );
                        },
                        contextGroup:
                            sohl.SohlContextMenu.SORT_GROUPS.ESSENTIAL,
                    },
                    [this.TEST_TYPE.VOLLEY]: {
                        type: this.TEST_TYPE.VOLLEY,
                        name: "Volley Missile Attack",
                        contextIconClass: "fas fa-bow-arrow",
                        functionName: "volleyMissileAttack",
                        contextCondition: (header) => {
                            header =
                                header instanceof HTMLElement
                                    ? header
                                    : header[0];
                            const li = header.closest(".item");
                            const item = fromUuidSync(li.dataset.uuid);
                            if (!item) return false;
                            return (
                                item.type ===
                                    LgndMissileWeaponStrikeModeItemData.TYPE_NAME &&
                                item.system.group ===
                                    LgndCombatTestResult.TEST_TYPE.VOLLEY &&
                                !item.system.$masteryLevel.disabled
                            );
                        },
                        contextGroup:
                            sohl.SohlContextMenu.SORT_GROUPS.ESSENTIAL,
                    },
                    [this.TEST_TYPE.STILL]: {
                        type: this.TEST_TYPE.STILL,
                        name: "Still",
                        contextIconClass: "fas fa-person",
                        functionName: "missileStillResume",
                        contextCondition: false,
                        contextGroup: sohl.SohlContextMenu.SORT_GROUPS.HIDDEN,
                    },
                    [this.TEST_TYPE.MOVING]: {
                        type: this.TEST_TYPE.MOVING,
                        name: "Moving",
                        contextIconClass: "fas fa-person-walking",
                        functionName: "missileMovingResume",
                        contextCondition: false,
                        contextGroup: sohl.SohlContextMenu.SORT_GROUPS.HIDDEN,
                    },
                    [this.TEST_TYPE.EVADING]: {
                        type: this.TEST_TYPE.EVADING,
                        name: "Evading",
                        contextIconClass: "fas fa-person-running",
                        functionName: "missileEvadingResume",
                        contextCondition: false,
                        contextGroup: sohl.SohlContextMenu.SORT_GROUPS.HIDDEN,
                    },
                },
                { inplace: false },
            );

            this._testTypes = foundry.utils.mergeObject(
                super.testTypes,
                other,
                {
                    inplace: false,
                },
            );
        }

        return this._testTypes;
    }

    get availResponses() {
        let result;
        if (
            this.sourceTestResult.testType.type ===
            LgndCombatTestResult.TEST_TYPE.AUTOCOMBATMISSILE
        ) {
            result = [
                LgndCombatTestResult.TEST_TYPE.STILL,
                LgndCombatTestResult.TEST_TYPE.MOVING,
                LgndCombatTestResult.TEST_TYPE.EVADING,
            ].map((t) => LgndCombatTestResult.testTypes[t]);
        } else {
            result = super.availResponses;
        }

        return result;
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        let {
            tacticalAdvantageChoices = [],
            tacticalAdvantageChoicesText = "",
            tacticalAdvantages = [],
            addlTacAdvs = 0,
        } = data;

        this.tacticalAdvantageChoices = tacticalAdvantageChoices;
        this.tacticalAdvantageChoicesText = tacticalAdvantageChoicesText;
        this.tacticalAdvantages = tacticalAdvantages;
        this.addlTacAdvs = addlTacAdvs;
    }

    calcMeleeCombatResult(opposedTestResult) {
        super.calcMeleeCombatResult(opposedTestResult);
        const attacker = opposedTestResult.sourceTestResult;
        const defender = opposedTestResult.targetTestResult;
        switch (this.testType.type) {
            case LgndCombatTestResult.TEST_TYPE.IGNOREDEFENSE:
                defender.testStumble = false;
                defender.testFumble = false;
                if (
                    attacker.successLevel >=
                    LgndCombatTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE
                ) {
                    attacker.addlTacAdvs = Math.min(
                        0,
                        opposedTestResult.sourceTestResult.successLevel -
                            LgndSuccessTestResult.SUCCESS_LEVEL
                                .MARGINAL_SUCCESS,
                    );
                }
                break;

            case LgndCombatTestResult.TEST_TYPE.BLOCKDEFENSE:
                if (opposedTestResult.sourceWins) {
                    attacker.addlTacAdvs = opposedTestResult.victoryStars - 1;
                } else {
                    defender.addlTacAdvs = -opposedTestResult.victoryStars - 1;
                }

                if (defender.addlTacAdvs) {
                    defender.tacticalAdvantageChoices = [
                        LgndCombatTestResult.TACTICAL_ADVANTAGE.ACTION,
                        LgndCombatTestResult.TACTICAL_ADVANTAGE.SETUP,
                    ];
                }
                break;

            case LgndCombatTestResult.TEST_TYPE.CXDEFENSE:
                if (defender.mlMod.has("CXBoth"))
                    if (opposedTestResult.sourceWins) {
                        attacker.addlTacAdvs =
                            opposedTestResult.victoryStars - 1;
                    } else {
                        defender.addlTacAdvs =
                            -opposedTestResult.victoryStars - 1;
                    }

                if (defender.addlTacAdvs) {
                    defender.tacticalAdvantageChoices = [
                        LgndCombatTestResult.TACTICAL_ADVANTAGE.IMPACT,
                        LgndCombatTestResult.TACTICAL_ADVANTAGE.PRECISION,
                    ];
                }
                break;
        }

        if (attacker.addlTacAdvs) {
            attacker.tacticalAdvantageChoices = Array.from(
                LgndCombatTestResult.TACTICAL_ADVANTAGE.values(),
            );
        }

        const formatter = game.i18n.getListFormatter();
        attacker.tacticalAdvantageChoicesText = formatter.format(
            attacker.tacticalAdvantageChoices,
        );
        defender.tacticalAdvantageChoicesText = formatter.format(
            defender.tacticalAdvantageChoices,
        );
    }

    calcDodgeCombatResult(opposedTestResult) {
        const attacker = opposedTestResult.sourceTestResult;
        const defender = opposedTestResult.targetTestResult;

        if (opposedTestResult.sourceWins) {
            attacker.addlTacAdvs = opposedTestResult.victoryStars - 1;
        } else {
            defender.addlTacAdvs = -opposedTestResult.victoryStars - 1;
        }

        if (defender.addlTacAdvs) {
            defender.tacticalAdvantageChoices = [
                LgndCombatTestResult.TACTICAL_ADVANTAGE.IMPACT,
                LgndCombatTestResult.TACTICAL_ADVANTAGE.PRECISION,
            ];
        }

        if (attacker.addlTacAdvs) {
            attacker.tacticalAdvantageChoices = Array.from(
                LgndCombatTestResult.TACTICAL_ADVANTAGE.values(),
            );
        }

        const formatter = game.i18n.getListFormatter();
        attacker.tacticalAdvantageChoicesText = formatter.format(
            attacker.tacticalAdvantageChoices,
        );
        defender.tacticalAdvantageChoicesText = formatter.format(
            defender.tacticalAdvantageChoices,
        );
    }

    async testDialog(data = {}, callback) {
        return await super.testDialog(
            foundry.utils.mergeObject(
                data,
                {
                    tacticalAdvantageChoices: this.tacticalAdvantageChoices,
                    tacticalAdvantageChoicesText:
                        this.tacticalAdvantageChoicesText,
                    tacticalAdvantages: this.tacticalAdvantages,
                    addlTacAdvs: this.addlTacAdvs,
                    tacticalAdvantageList: this.tacticalAdvantageList,
                },
                { overwrite: false },
            ),
            callback,
        );
    }

    async toChat(data = {}) {
        return super.toChat(
            foundry.utils.mergeObject(
                data,
                {
                    tacticalAdvantageChoices: this.tacticalAdvantageChoices,
                    tacticalAdvantageChoicesText:
                        this.tacticalAdvantageChoicesText,
                    tacticalAdvantages: this.tacticalAdvantages,
                    addlTacAdvs: this.addlTacAdvs,
                },
                { overwrite: false },
            ),
        );
    }

    toJSON() {
        return foundry.utils.mergeObject(super.toJSON(), {
            impactMod: this.impactMod ? this.impactMod.toJSON() : null,
            impactSituationalModifier: this.situationalModifier,
            deliversImpact: this.deliversImpact,
            testFumble: this.testFumble,
            testStumble: this.testStumble,
            tacticalAdvantageChoices: this.tacticalAdvantageChoices,
            tacticalAdvantageChoicesText: this.tacticalAdvantageChoicesText,
            tacticalAdvantages: this.tacticalAdvantages,
            addlTacAdvs: this.addlTacAdvs,
            weaponBreak: this.weaponBreak,
        });
    }
}
export class LgndCombatTestResult2 extends LgndOpposedTestResult {
    combatResult;
    calcMissileCombatResult() {
        const combatResult = {
            attacker: {
                deliversImpact: false,
                testFumble:
                    this.sourceTestResult.isCritical &&
                    !this.sourceTestResult.isSuccess &&
                    this.sourceTestResult.lastDigit === 0,
                testStmble:
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
                testFumble: false,
                testStmble: false,
                tacticalAdvantageChoices: [],
                tacticalAdvantageChoicesText: "",
                tacticalAdvantages: [],
                addlTacAdvs: 0,
                weaponBreak: false,
            },
        };

        combatResult.defender.testStmble = false;
        combatResult.defender.testFumble = false;
        if (this.sourceWins) {
            combatResult.attacker.addlTacAdvs = Math.min(
                0,
                this.sourceTestResult.successLevel -
                    LgndSuccessTestResult.SUCCESS_LEVEL.MARGINAL_SUCCESS,
            );
            if (
                this.targetTestResult.testType.type ===
                LgndCombatTestResult.TEST_TYPE.STILL
            ) {
                combatResult.attacker.addlTacAdvs =
                    this.sourceTestResult.successLevel;
            }
        }

        if (this.testType.type === LgndCombatTestResult.TEST_TYPE.DIRECT) {
            combatResult.attacker.deliversImpact = this.sourceWins;

            // For Direct, if there are TAs beyond the first, there is a choice between
            // impact and precision TAs for each
            if (combatResult.attacker.addlTacAdvs) {
                combatResult.attacker.tacticalAdvantageChoices = [
                    LgndCombatTestResult.TACTICAL_ADVANTAGE.IMPACT,
                    LgndCombatTestResult.TACTICAL_ADVANTAGE.PRECISION,
                ];
            }
        } else {
            // FIXME: Need to implement decision whether attack delivers impact or not
            // Complex rules of area hits apply.

            // For Volley, all TAs are Precision TAs
            for (let i = 0; i < combatResult.attacker.addlTacAdvs; i++) {
                combatResult.attacker.tacticalAdvantages.push(
                    LgndCombatTestResult.TACTICAL_ADVANTAGE.PRECISION,
                );
            }
            combatResult.attacker.addlTacAdvs = 0;
        }
        this.combatResult = combatResult;
    }

    async evaluate() {
        // Skill tests (including dodge) always break ties
        if (
            this.targetTestResult.testType.type ===
            LgndSuccessTestResult.TEST_TYPE.DODGEDEFENSE
        ) {
            this.breakTies = true;
        }

        let allowed = await super.evaluate();

        if (allowed) {
            if (
                [
                    LgndCombatTestResult.TEST_TYPE.DIRECT,
                    LgndCombatTestResult.TEST_TYPE.VOLLEY,
                ].includes(this.sourceTestResult.testType.type)
            ) {
                this.calcMissileCombatResult();
            }
        }

        return allowed;
    }
}

class LgndImpactResult extends sohl.ImpactResult {}

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
            LgndUtility.uniqueActions(
                actions,
                [
                    LgndCombatTestResult.TEST_TYPE.STILL,
                    LgndCombatTestResult.TEST_TYPE.MOVING,
                    LgndCombatTestResult.TEST_TYPE.EVADING,
                    LgndCombatTestResult.TEST_TYPE.BLOCKDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.DODGEDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.CXDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.IGNOREDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.CALCIMPACT,
                    LgndCombatTestResult.TEST_TYPE.OPPOSEDSKILLRESUME,
                    LgndCombatTestResult.TEST_TYPE.SUCCESSVALUE,
                    LgndCombatTestResult.TEST_TYPE.RESOLVEIMPACT,
                    LgndCombatTestResult.TEST_TYPE.IMPROVEXP,
                    LgndCombatTestResult.TEST_TYPE.FATE,
                ].map((a) => LgndCombatTestResult.testTypes[a]),
            ),
        );
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async missileStillResume(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async missileMovingResume(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async missileEvadingResume(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async blockResume(speaker, actor, token, character, scope = {}) {
        const strikeMode = await LgndUtility.getOpposedItem({
            actor,
            skipDialog: false,
            label: "Select which Strike Mode to use:",
            title: `Choose Block Strike Mode for ${token.name}`,
            func: (it) => {
                let result = false;
                if (
                    [
                        LgndMeleeWeaponStrikeModeItemData.TYPE_NAME,
                        LgndCombatTechniqueStrikeModeItemData.TYPE_NAME,
                    ].includes(it.type) &&
                    !it.system.$defense.block.disabled
                )
                    result = {
                        key: it.name,
                        value: it,
                    };
                return result;
            },
            compareFn: (a, b) =>
                b.system.$defense.block.median - a.system.$defense.block.median,
        });

        if (strikeMode === null) {
            return null;
        } else if (strikeMode === false) {
            ui.notifications.warn(
                `${token.name} has no usable block strike modes, cannot block`,
            );
            return null;
        } else {
            strikeMode.system.execute("blockResume", scope);
        }
    }

    async dodgeResume(speaker, actor, token, character, scope = {}) {
        const dodgeSkill = this.actor.getItem("dge", { types: ["skill"] });
        if (!dodgeSkill) {
            ui.notification.warn(
                `${token?.name || actor?.name} has no dodge skill, cannot dodge`,
            );
            return null;
        }
        return dodgeSkill.opposedTestResume(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async counterstrikeResume(speaker, actor, token, character, scope = {}) {
        const strikeMode = await LgndUtility.getOpposedItem({
            actor,
            skipDialog: false,
            label: "Select which Strike Mode to use:",
            title: `Choose Counterstrike Strike Mode for ${token.name}`,
            func: (it) => {
                let result = false;
                if (
                    !it.system.$defense.counterstrike.disabled &&
                    [
                        LgndMeleeWeaponStrikeModeItemData.TYPE_NAME,
                        LgndCombatTechniqueStrikeModeItemData.TYPE_NAME,
                    ].includes(it.type)
                )
                    result = {
                        key: it.name,
                        value: it,
                    };
                return result;
            },
            compareFn: (a, b) =>
                b.system.$defense.counterstrike.median -
                a.system.$defense.counterstrike.median,
        });

        if (strikeMode === null) {
            return null;
        } else if (strikeMode === false) {
            ui.notifications.warn(
                `${token.name} has no usable counterstrike strike modes, cannot counterstrike`,
            );
            return null;
        } else {
            strikeMode.system.execute("counterstrikeResume", scope);
        }
    }

    /**
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
            mlMod: new CONFIG.SOHL.class.MasteryLevelModifier(
                {},
                { parent: this },
            ).setBase(0),
            impactMod: null,
            aim: null,
            item: null,
            roll: LgndUtility.JSON_parse(
                LgndSuccessTestResult.ROLL.CRITICAL_FAILURE,
                { thisArg: this },
            ),
            lastDigit: 5,
            isCapped: true,
            type: null,
            typeLabel: null,
            rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
            critAllowed: true,
            successLevel: LgndSuccessTestResult.SUCCESS_LEVEL.CRITICAL_FAILURE,
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

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async opposedTestResume(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async successValueTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async resolveImpact(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async improveWithXP(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async fateTest(speaker, actor, token, character, scope = {}) {
        return;
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
            testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    item: initSkill,
                    rollMode: game.settings.get("core", "rollMode"),
                    type,
                    title: title || `${this.name} Morale Test`,
                    situationalModifier: 0,
                    typeLabel: initSkill.system.TYPE_LABEL,
                    mlMod: LgndUtility.deepClone(
                        initSkill.system.$masteryLevel,
                    ),
                },
                { parent: initSkill.system },
            );
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
            testResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    item: willTrait,
                    rollMode: game.settings.get("core", "rollMode"),
                    type,
                    title: title || `${this.name} Contract Fear Test`,
                    situationalModifier: 0,
                    typeLabel: willTrait.system.TYPE_LABEL,
                    mlMod: LgndUtility.deepClone(
                        willTrait.system.$masteryLevel,
                    ),
                },
                { parent: willTrait.system },
            );
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

    prepareBaseData() {
        super.prepareBaseData();
        this.$maxZones = 0;
        this.$combatReach = -99;
        this.$hasAuralShock = false;
        this.$encumbrance = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    total: (thisVM) => {
                        const encDiv = game.settings.get(
                            "sohl",
                            CONFIG.SOHL.CONST.VERSETTINGS.legEncIncr.key,
                        );
                        let result = Math.round(
                            Math.floor(
                                (thisVM.effective + Number.EPSILON) * encDiv,
                            ) / encDiv,
                        );
                        return result;
                    },
                },
            },
            { parent: this },
        );
        this.$encumbrance.floor("Min Zero", "Min0", 0);
    }
}

class LgndProtectionItemData extends sohl.ProtectionItemData {}

function LgndStrikeModeItemDataMixin(BaseMLID) {
    if (!(BaseMLID.prototype instanceof sohl.StrikeModeItemData)) {
        throw new Error(
            `${BaseMLID.name} must be a subclass of StrikeModeItemData`,
        );
    }

    return class LgndStrikeModeItemData extends BaseMLID {
        $reach;
        $heft;

        get heftBase() {
            return this.item.getFlag("sohl", "legendary.heftBase") || 0;
        }

        get zoneDie() {
            return this.item.getFlag("sohl", "legendary.zoneDie") || 0;
        }

        static _TACADV;

        static get TACADV() {
            if (!this._TACADV) {
                this._TACADV = {
                    ACTION: "action",
                    IMPACT: "impact",
                    PRECISION: "precision",
                };
            }
            return this._TACADV;
        }

        static _tacticalAdvangtages;

        static get tactialAdvantages() {
            if (!this._tacticalAdvantages) {
                this._tacticalAdvantages = {
                    [this.TACADV.ACTION]: "Action",
                    [this.TACADV.IMPACT]: "Impact",
                    [this.TACADV.PRECISION]: "Precision",
                };
            }
            return this._tacticalAdvantages;
        }

        static get effectKeys() {
            if (!this._effectKeys) {
                this._effectKeys = LgndUtility.simpleMerge(super.effectKeys, {
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
            return this._effectKeys;
        }

        getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
            return super.getIntrinsicActions(
                _data,
                defaultAction,
                LgndUtility.uniqueActions(
                    actions,
                    [LgndCombatTestResult.TEST_TYPE.CALCIMPACT].map(
                        (a) => LgndCombatTestResult.testTypes[a],
                    ),
                ),
            );
        }

        _preSuccessTestDialog(scope) {
            let {
                type,
                title,
                testType = LgndCombatTestResult.TEST_TYPE.MELEE,
                testResult,
                mlMod,
                impactMod = LgndUtility.deepClone(this.$impact),
                targetMovement = null,
            } = scope;

            type ??= `${this.item.type}-${this.item.name}-${testType}-test`;
            if (testType === LgndCombatTestResult.TEST_TYPE.DIRECT) {
                title ??= `${this.item.label} Direct Missile Attack Test`;
                targetMovement = "Direct";
            } else if (testType === LgndCombatTestResult.TEST_TYPE.VOLLEY) {
                title ??= `${this.item.label} Volley Missile Attack Test`;
                targetMovement = "Volley";
            } else {
                title ??= `${this.strikeModeLabel} ${CONFIG.SOHL.class.SuccessTestResult.testTypes[testType].label}`;
            }
            if (!this.actor.token) {
                ui.notifications.warn(`No attacker token identified.`);
                return null;
            }

            if (!this.actor.token.isOwner) {
                ui.notifications.warn(
                    `You do not have permissions to perform this operation on ${this.actor.token.name}`,
                );
                return null;
            }

            if (!this.item.nestedIn.system.isHeld) {
                ui.notifications.warn(
                    `For ${this.actor.token.name} ${this.item.nestedIn.name} is not held.`,
                );
                return null;
            }

            if (testResult) {
                testResult = LgndUtility.JSON_reviver({
                    thisArg: this,
                })("", testResult);
            } else {
                testResult = new CONFIG.SOHL.class.SuccessTestResult(
                    {
                        speaker: scope.speaker,
                        item: this.item,
                        rollMode: game.settings.get("core", "rollMode"),
                        type,
                        title,
                        situationalModifier: 0,
                        typeLabel: this.TYPE_LABEL,
                        testType,
                        mlMod,
                        impactMod,
                        targetMovement,
                        cxBothOption: false,
                        askCXBothOption: game.settings.get(
                            "sohl",
                            "optionBothOnCounterstrike",
                        ),
                        movementOptions:
                            LgndMissileWeaponStrikeModeItemData.movementOptions,
                        rollModes: Object.entries(CONFIG.Dice.rollModes).map(
                            ([k, v]) => ({
                                group: "CHAT.RollDefault",
                                value: k,
                                label: v,
                            }),
                        ),
                    },
                    { parent: this },
                );
            }
            return testResult;
        }

        _postSuccessTestDialog(testResult, formData) {
            if (formData) {
                const formSituationalModifier =
                    Number.parseInt(formData.situationalModifier, 10) || 0;
                const formImpactSituationalModifier =
                    Number.parseInt(formData.impactSituationalModifier, 10) ||
                    0;
                const formAim = Number.parseInt(formData.aim, 10) || 0;

                if (testResult.impactMod && formImpactSituationalModifier) {
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
                    testResult.situationalModifier = formSituationalModifier;
                }

                const formSuccessLevelMod = Number.parseInt(
                    formData.successLevelMod,
                    10,
                );
                testResult.cxBothOption = !!formData.cxBothOption;
                testResult.mlMod.successLevelMod = formSuccessLevelMod;
                testResult.aim = formAim;
                testResult.rollMode = formData.rollMode;
                if (formData.targetMovement)
                    testResult.targetMovement = formData.targetMovement;
            }

            if (testResult.aim && testResult.aim !== testResult.defaultAim) {
                testResult.mlMod.add("Non-default Aim Zone", "AimZn", -10);
            }

            if (
                testResult.testType.type ===
                    LgndSuccessTestResult.TEST_TYPE.CXDEFENSE &&
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
            return testResult;
        }

        async _preCombatSuccessTest(
            speaker,
            actor,
            token,
            character,
            scope = {},
        ) {
            let result = await super._preOpposedSuccessTest(
                speaker,
                actor,
                token,
                character,
                scope,
            );
            if (!result) return;

            let { targetToken } = scope;

            // Unique to the opposed test, we get the targeted token and determine
            // whether that token is inside our engagement zone
            result.targetToken =
                targetToken || sohl.Utility.getUserTargetedToken(token);
            if (!result.targetToken) return;

            const targetRange = LgndUtility.rangeToTarget(
                token,
                result.targetToken,
            );
            if (
                result.sourceTestResult.testType.type ===
                    LgndCombatTestResult.TEST_TYPE.MELEE &&
                targetRange >
                    LgndUtility.engagementZoneRange(this.$reach.effective)
            ) {
                const msg = `Target ${result.targetToken.name} is outside of engagement zone for ${this.name}; distance = ${targetRange} feet, EZ = ${LgndUtility.engagementZoneRange(this.$reach.effective)} feet.`;
                ui.notifications.warn(msg);
                return;
            } else if (
                result.sourceTestResult.testType.type ===
                    LgndCombatTestResult.TEST_TYPE.DIRECT &&
                targetRange > this.$maxDistance.effective
            ) {
                const msg = `Target ${result.targetToken.name} is outside of ${this.range} range for ${this.name}; distance = ${targetRange} feet, max distance = ${this.$maxDistance.effective} feet.`;
                ui.notifications.warn(msg);
                return;
            }

            return result;
        }

        async automatedCombatStart(speaker, actor, token, character, scope) {
            scope.impactMod ||= LgndUtility.deepClone(this.$impact);
            let {
                skipDialog = false,
                noChat = false,
                testType = LgndSuccessTestResult.TEST_TYPE.AUTOCOMBATMELEE,
                mlMod = LgndUtility.deepClone(this.$attack),
            } = scope;

            ({ speaker, actor, token, character } =
                sohl.SohlMacro.getExecuteDefaults({
                    speaker,
                    actor,
                    token,
                    character,
                }));

            scope.sourceTestResult = await this.successTest(
                speaker,
                actor,
                token,
                character,
                {
                    skipDialog,
                    noChat: true,
                    testType,
                    mlMod,
                },
            );
            if (!scope.sourceTestResult) return;

            const combatTestResultData = await this._preCombatSuccessTest(
                speaker,
                actor,
                token,
                character,
                scope,
            );
            if (!combatTestResultData) return null;

            let combatTestResult = new CONFIG.SOHL.class.LgndCombatTestResult(
                combatTestResultData,
                { parent: this },
            );

            // Note that in the opposed test start, we specifically do not
            // call the evaluate() method of opposedTestResult, since
            // we have not finished creating it yet (no targetTestResult)

            if (!noChat) {
                combatTestResult.toChat();
            }

            return combatTestResult;
        }

        /**
         * Continue the opposed test. Only valid testTypes are "block" and "counterstrike".
         *
         * @param {object} scope
         * @param {string} [scope.sourceTestResult]
         * @param {number} [scope.testType]
         * @returns {OpposedTestResult} result of the test
         */
        async automatedCombatResume(
            speaker,
            actor,
            token,
            character,
            scope = {},
        ) {
            let { noChat = false, opposedTestResult, testType, mlMod } = scope;
            if (!opposedTestResult)
                throw new Error("Must supply an opposedTestResult");

            if (!(opposedTestResult instanceof LgndCombatTestResult)) {
                opposedTestResult = LgndUtility.JSON_reviver({
                    thisArg: this,
                })("", opposedTestResult);
                if (!(opposedTestResult instanceof LgndCombatTestResult)) {
                    throw new Error("Invalid combatTestResult");
                }
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
                opposedTestResult.targetTestResult = await this.successTest(
                    speaker,
                    actor,
                    token,
                    character,
                    {
                        noChat: true,
                        testType,
                        mlMod,
                        impactMod: LgndUtility.deepClone(this.$impact),
                    },
                );
                if (!opposedTestResult.targetTestResult) return null;
            } else {
                // In this situation, where the targetTestResult is provided,
                // the GM is modifying the result of a prior opposedTest.
                // Therefore, we re-display the dialog for each of the prior
                // successTests.
                opposedTestResult.sourceTestResult =
                    await opposedTestResult.sourceTestResult.item.system.successTest(
                        speaker,
                        actor,
                        token,
                        character,
                        {
                            noChat: true,
                            testResult: opposedTestResult.sourceTestResult,
                        },
                    );
                opposedTestResult.targetTestResult =
                    await opposedTestResult.targetTestResult.item.system.successTest(
                        speaker,
                        actor,
                        token,
                        character,
                        {
                            noChat: true,
                            testResult: opposedTestResult.targetTestResult,
                        },
                    );
            }

            let allowed = await opposedTestResult.evaluate();

            if (allowed && !noChat) {
                opposedTestResult.toChat({
                    template:
                        "systems/sohl/templates/chat/opposed-result-card.html",
                    title: "Combat Resume",
                });
            }

            return allowed ? opposedTestResult : false;
        }

        /**
         * Calculate impact for this Item
         *
         * @param {object} options
         * @returns {SuccessTestChatData}
         */
        async calcImpact(speaker, actor, token, character, scope = {}) {
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
                impactResult = new CONFIG.SOHL.class.ImpactResult(
                    {
                        speaker,
                        itemUuid: this.item.uuid,
                        impactMod: LgndUtility.deepClone(this.$impact),
                    },
                    { parent: this },
                );
            } else {
                impactResult = LgndUtility.JSON_reviver({
                    thisArg: this,
                })("", impactResult);
                if (!(impactResult instanceof LgndImpactResult)) {
                    throw new Error("Invalid impactResult");
                }
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
                    callback: (element) => {
                        const form = element.querySelector("form");
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

            let allowed = await impactResult.evaluate();

            if (allowed && !noChat) {
                const item = impactResult.impactMod.parent.item;
                const actor = token ? token.actor : actor;
                let title = `${item.nestedIn.name} ${item.name} Impact`;
                if (targetToken) title += ` against ${targetToken.name}`;
                const chatData = {
                    actor,
                    targetToken,
                    impactResult,
                    impactResultJson: LgndUtility.JSON_stringify(impactResult),
                    title,
                };
                const chatTemplate =
                    "systems/sohl/templates/chat/damage-card.html";

                const chatHtml = await renderTemplate(chatTemplate, chatData);

                const messageData = {
                    user: game.user.id,
                    speaker: speaker || ChatMessage.getSpeaker(),
                    content: chatHtml.trim(),
                    sound: CONFIG.sounds.dice,
                };

                // Create a chat message
                await ChatMessage.create(messageData);
            }

            return allowed ? impactResult : false;
        }

        prepareBaseData() {
            super.prepareBaseData();
            this.$attack = LgndUtility.deepClone(this.$attack);
            this.$defense = {
                block: LgndUtility.deepClone(this.$defense.block),
                counterstrike: LgndUtility.deepClone(
                    this.$defense.counterstrike,
                ),
            };
            this.$impact.zoneDie = this.zoneDie;

            this.$reach = new CONFIG.SOHL.class.ValueModifier(
                {},
                { parent: this },
            );
            this.$heft = new CONFIG.SOHL.class.ValueModifier(
                {},
                { parent: this },
            );
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
        if (!this._effectKeys) {
            this._effectKeys = LgndUtility.simpleMerge(super.effectKeys, {
                "mod:system.$heft": { label: "Heft", abbrev: "Hft" },
                "system.$traits.couched": {
                    label: "Couched",
                    abbrev: "Couched",
                },
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
        return this._effectKeys;
    }

    get defaultAction() {
        return LgndCombatTestResult.TEST_TYPE.AUTOCOMBATMELEE;
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            LgndUtility.uniqueActions(
                actions,
                [
                    LgndCombatTestResult.TEST_TYPE.AUTOCOMBATMELEE,
                    LgndCombatTestResult.TEST_TYPE.BLOCKDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.CXDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.IGNOREDEFENSE,
                ].map((a) => LgndCombatTestResult.testTypes[a]),
            ),
        );
    }

    static get TACADV() {
        if (!this._TACADV) {
            this._TACADV = foundry.utils.mergeObject(super.TACADV, {
                SETUP: "setup",
            });
        }
        return this._TACADV;
    }

    static get tactialAdvantages() {
        if (!this._tacticalAdvangtages) {
            this._tacticalAdvangtages = foundry.utils.mergeObject(
                super.TACADV,
                {
                    [this.TACADV.SETUP]: "Setup",
                },
            );
        }
        return this._tacticalAdvangtages;
    }

    async blockResume(speaker, actor, token, character, scope = {}) {
        scope.testType = LgndCombatTestResult.TEST_TYPE.BLOCKDEFENSE;
        scope.mlMod = this.$defense.block;
        return await this.automatedCombatResume(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async counterstrikeResume(speaker, actor, token, character, scope = {}) {
        scope.testType = LgndCombatTestResult.TEST_TYPE.CXDEFENSE;
        scope.mlMod = this.$defense.counterstrike;
        //scope.title
        return await this.automatedCombatResume(
            speaker,
            actor,
            token,
            character,
            scope,
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
        this.$range = new CONFIG.SOHL.class.ValueModifier({}, { parent: this });
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
    $pull;

    static get MOVEMENT_OPTION() {
        return {
            STILL: "still",
            MOVING: "moving",
            EVADING: "evading",
        };
    }
    static get movementOptions() {
        return {
            [this.MOVEMENT_OPTION.STILL]: "Still",
            [this.MOVEMENT_OPTION.MOVING]: "Moving",
            [this.MOVEMENT_OPTION.EVADING]: "Evading",
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
                group: LgndCombatTestResult.TEST_TYPE.DIRECT,
                mult: 0.5,
            },
            [this.RANGE.DIRECT]: {
                label: "Direct",
                group: LgndCombatTestResult.TEST_TYPE.DIRECT,
                mult: 1,
            },
            [this.RANGE.VOLLEY_2]: {
                label: "V2",
                group: LgndCombatTestResult.TEST_TYPE.VOLLEY,
                mult: 2,
            },
            [this.RANGE.VOLLEY_3]: {
                label: "V3",
                group: LgndCombatTestResult.TEST_TYPE.VOLLEY,
                mult: 3,
            },
            [this.RANGE.VOLLEY_4]: {
                label: "V4",
                group: LgndCombatTestResult.TEST_TYPE.VOLLEY,
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

    get group() {
        return (
            LgndMissileWeaponStrikeModeItemData.ranges[this.range]?.group ||
            LgndCombatTestResult.TEST_TYPE.DIRECT
        );
    }

    get defaultAction() {
        return LgndSuccessTestResult.TEST_TYPE.AUTOCOMBATMISSILE;
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            LgndUtility.uniqueActions(
                actions,
                [
                    LgndCombatTestResult.TEST_TYPE.AUTOCOMBATMISSILE,
                    LgndCombatTestResult.TEST_TYPE.DIRECT,
                    LgndCombatTestResult.TEST_TYPE.VOLLEY,
                    LgndCombatTestResult.TEST_TYPE.STILL,
                    LgndCombatTestResult.TEST_TYPE.MOVING,
                    LgndCombatTestResult.TEST_TYPE.EVADING,
                ].map((a) => LgndCombatTestResult.testTypes[a]),
            ),
        );
    }

    async automatedCombatStart(speaker, actor, token, character, scope) {
        scope.testType = LgndCombatTestResult.TEST_TYPE.AUTOCOMBATMISSILE;
        return await super.automatedCombatStart(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = LgndUtility.deepClone(this.$attack);
        scope.testType ||= this.group;
        scope.title = `${this.item.nestedIn.name} ${this.name} ${CONFIG.SOHL.class.SuccessTestResult.testTypes[this.group]?.label} Test`;
        return await CONFIG.SOHL.class.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        foundry.utils.mergeObject(this.$traits, {
            armorReduction: 0,
            bleed: false,
        });
        this.$maxDistance = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$draw = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        ).setBase(this.drawBase);
        this.$pull = new CONFIG.SOHL.class.ValueModifier({}, { parent: this });
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

        if (this.$pull.effective < this.$draw.effective) {
            this.$attack.setDisabled(
                `Too weak to draw missile weapon`,
                "TooWeak",
            );
        }
    }
}

class LgndCombatTechniqueStrikeModeItemData extends LgndStrikeModeItemDataMixin(
    sohl.CombatTechniqueStrikeModeItemData,
) {
    static get effectKeys() {
        if (!this._effectKeys) {
            this._effectKeys = LgndUtility.simpleMerge(super.effectKeys, {
                "system.$traits.strRoll": {
                    label: "Strength Roll",
                    abbrev: "StrRoll",
                },
            });
        }
        return this._effectKeys;
    }

    static get TACADV() {
        if (!this._TACADV) {
            this._TACADV = foundry.utils.mergeObject(super.TACADV, {
                SETUP: "setup",
            });
        }
        return this._TACADV;
    }

    static get tactialAdvantages() {
        if (!this._tacticalAdvangtages) {
            this._tacticalAdvangtages = foundry.utils.mergeObject(
                super.TACADV,
                {
                    [this.TACADV.SETUP]: "Setup",
                },
            );
        }
        return this._tacticalAdvangtages;
    }

    get defaultAction() {
        return LgndSuccessTestResult.TEST_TYPE.AUTOCOMBATMELEE;
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            LgndUtility.uniqueActions(
                actions,
                [
                    LgndCombatTestResult.TEST_TYPE.AUTOCOMBATMELEE,
                    LgndCombatTestResult.TEST_TYPE.BLOCKDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.CXDEFENSE,
                    LgndCombatTestResult.TEST_TYPE.IGNOREDEFENSE,
                ].map((a) => LgndCombatTestResult.testTypes[a]),
            ),
        );
    }

    async blockResume(speaker, actor, token, character, scope = {}) {
        scope.testType = LgndCombatTestResult.TEST_TYPE.BLOCKDEFENSE;
        return await this.automatedCombatResume(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async counterstrikeResume(speaker, actor, token, character, scope = {}) {
        scope.testType = LgndCombatTestResult.TEST_TYPE.CXDEFENSE;
        return await this.automatedCombatResume(
            speaker,
            actor,
            token,
            character,
            scope,
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
    if (!(BaseMLID.prototype instanceof sohl.MasteryLevelItemData)) {
        throw new Error(
            `${BaseMLID.name} must be a subclass of MasteryLevelItemData`,
        );
    }

    return class LgndMasteryLevelItemData extends BaseMLID {
        getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
            const uniqueActions = LgndUtility.uniqueActions(
                actions,
                [
                    LgndSuccessTestResult.TEST_TYPE.IMPROVEXP,
                    LgndSuccessTestResult.TEST_TYPE.FATE,
                    LgndSuccessTestResult.TEST_TYPE.SUCCESSVALUE,
                ].map((a) => LgndSuccessTestResult.testTypes[a]),
            );
            return super.getIntrinsicActions(
                _data,
                defaultAction,
                uniqueActions,
            );
        }

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
         * Perform Success Value Test for this Item.
         *
         * @param {object} options
         * @returns {SuccessTestChatData}
         */
        async successValueTest(speaker, actor, token, character, scope = {}) {
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
                    typeLabel: this.TYPE_LABEL,
                    isSuccessValue: true,
                    svTable,
                    mlMod: LgndUtility.deepClone(this.$masteryLevel),
                },
            });
        }

        async fateTest(speaker, actor, token, character, scope = {}) {
            let {
                skipDialog = false,
                noChat = false,
                type = `${this.type}-${this.name}-fate-test`,
                title = `${this.item.label} Fate Test`,
            } = scope;

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
            let fateItem;
            if (fateList?.length) {
                fateItem = fateList[0];
                if (fateList.length > 1 && !skipDialog) {
                    const dlgData = {
                        fateChoices: fateList,
                    };
                    const compiled =
                        Handlebars.compile(`<form id="select-token"><div class="form-group">
                    <label>Select which fate to use:</label>
                    <select name="fateChoice">
                    {{selectOptions fateChoices}}
                </select></div></form>`);
                    const dlgHtml = compiled(dlgData, {
                        allowProtoMethodsByDefault: true,
                        allowProtoPropertiesByDefault: true,
                    });
                    fateItem = await Dialog.prompt({
                        title: "Choose Fate",
                        content: dlgHtml,
                        label: "OK",
                        callback: async (element) => {
                            const form = element.querySelector("form");
                            const fd = new FormDataExtended(form);
                            const formdata = foundry.utils.expandObject(
                                fd.object,
                            );
                            return fateList[formdata.fateChoice];
                        },
                        options: { jQuery: false },
                        rejectClose: false,
                    });
                }
                if (!fateItem) {
                    ui.notifications.warn("No usable fate available");
                    return null;
                }
            }

            const successTestResult = new CONFIG.SOHL.class.SuccessTestResult(
                {
                    speaker,
                    title,
                    type,
                    situationalModifier: 0,
                    mlMod: LgndUtility.deepClone(this.$masteryLevel.fate),
                    svTable: [
                        {
                            maxValue:
                                LgndSuccessTestResult.SUCCESS_LEVEL
                                    .MARGINAL_FAILURE,
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
                { parent: this },
            );

            if (!skipDialog) {
                if (!(await successTestResult.testDialog())) return null;
            }

            let allowed = successTestResult.evaluate();

            let fateCost = 0;
            if (allowed) {
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
                                    icon: "far fa-circle-check",
                                    label: "Free",
                                    callback: () => "+1 Bonus, no cost",
                                },
                                doubleFate: {
                                    icon: "fas fa-check-double",
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
                            successTestResult.mlMod.successLevelMod += 2;
                        } else {
                            successTestResult.label = "Fate Critical Success";
                            successTestResult.description =
                                "Increase test Success Level by 1, no fate cost";
                            successTestResult.mlMod.successLevelMod += 1;
                        }
                    } else {
                        fateCost = 1;
                    }
                    allowed = successTestResult.evaluate();
                } else {
                    fateCost = successTestResult.isCritical ? 1 : 0;
                }
            }

            if (allowed) {
                if (!noChat) {
                    await successTestResult.toChat();
                }

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
                        const newCharges = Math.max(
                            0,
                            it.system.charges.value - 1,
                        );
                        if (newCharges !== it.system.charges.value) {
                            it.update({ "system.charges.value": newCharges });
                        }
                    }
                });
            }

            return allowed ? successTestResult : false;
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

                const chatHtml = await renderTemplate(
                    chatTemplate,
                    chatTemplateData,
                );

                const messageData = {
                    user: game.user.id,
                    speaker,
                    content: chatHtml.trim(),
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
            this.$masteryLevel &&= LgndUtility.deepClone(this.$masteryLevel);
        }

        postProcess() {
            super.postProcess();
            this.applyPenalties();
        }
    };
}

class LgndInjuryItemData extends sohl.InjuryItemData {
    static get ASPECTTYPE() {
        return {
            BLUNT: "blunt",
            EDGED: "edged",
            PIERCING: "piercing",
            FIRE: "fire",
            FROST: "frost",
            PROJECTILE: "projectile",
        };
    }

    static get aspectTypes() {
        return {
            [this.ASPECTTYPE.BLUNT]: "Blunt",
            [this.ASPECTTYPE.EDGED]: "Edged",
            [this.ASPECTTYPE.PIERCING]: "Piercing",
            [this.ASPECTTYPE.FIRE]: "Fire",
            [this.ASPECTTYPE.FROST]: "Frost",
            [this.ASPECTTYPE.PROJECTILE]: "Projectile",
        };
    }

    get treatments() {
        return {
            [this.ASPECTTYPE.BLUNT]: {
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
            [this.ASPECTTYPE.PIERCING]: {
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
            [this.ASPECTTYPE.EDGED]: {
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
            [this.ASPECTTYPE.PROJECTILE]: {
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
            [this.ASPECTTYPE.FIRE]: {
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
            [this.ASPECTTYPE.FROST]: {
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

    async bleedingStoppageTest(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-bleed-stop-test`,
            title = `${this.item.label} Bleeding Stoppage Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        },
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        // TODO - Injury Bleeding Stoppage Test
        ui.notifications.warn("Injury Bleeding Stoppage Test Not Implemented");
    }

    async bloodlossAdvanceTest(
        speaker = null,
        actor = null,
        token = null,
        character = null,
        {
            skipDialog = false,
            noChat = false,
            type = `${this.type}-${this.name}-bloodloss-advance-test`,
            title = `${this.item.label} Bloodloss Advance Test`,
            // biome-ignore lint/correctness/noUnusedVariables: <explanation>
            ...scope
        },
    ) {
        ({ speaker, actor, token, character } =
            sohl.SohlMacro.getExecuteDefaults({
                speaker,
                actor,
                token,
                character,
            }));

        // TODO - Injury Bloodloss Advance Test
        ui.notifications.warn("Injury Bloodloss Advance Test Not Implemented");
    }

    prepareBaseData() {
        super.prepareBaseData();
        const newIL = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
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
                },
            },
            { parent: this },
        );
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
        this.$masteryLevel &&= LgndUtility.deepClone(this.$masteryLevel);
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

    /**
     * Continue the opposed test.
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

        // If this is not a melee defense (Dodge), then use the normal
        // opposed test processing
        if (
            this.abbrev !== "dge" ||
            opposedTestResult.sourceTestResult.testType.type !==
                LgndSuccessTestResult.TEST_TYPE.MELEE
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
                testType: LgndSuccessTestResult.TEST_TYPE.DODGEDEFENSE,
                mlMod: LgndUtility.deepClone(this.$masteryLevel),
            });
            if (!opposedTestResult.targetTestResult) return null;
        } else {
            // In this situation, where the targetTestResult is provided,
            // the GM is modifying the result of a prior opposedTest.
            // Therefore, we re-display the dialog for each of the prior
            // successTests.
            opposedTestResult.sourceTestResult =
                opposedTestResult.sourceTestResult.item.system.successTest({
                    noChat: true,
                    testResult: opposedTestResult.sourceTestResult,
                });
            opposedTestResult.targetTestResult =
                opposedTestResult.targetTestResult.item.system.successTest({
                    noChat: true,
                    testResult: opposedTestResult.targetTestResult,
                });
        }

        let allowed = await opposedTestResult.evaluate();

        if (allowed) {
            const combatResult = {
                attacker: {
                    wins: false,
                    testFumble: false,
                    testStmble: false,
                    tacticalAdvantageChoices: [],
                    tacticalAdvantageChoicesText: "",
                    addlTacAdvs: 0,
                },
                defender: {
                    wins: false,
                    testFumble: false,
                    testStmble: false,
                    tacticalAdvantageChoices: [],
                    tacticalAdvantageChoicesText: "",
                    addlTacAdvs: 0,
                },
            };

            combatResult.attacker.testFumble =
                opposedTestResult.sourceTestResult.isCritical &&
                !opposedTestResult.sourceTestResult.isSuccess &&
                opposedTestResult.sourceTestResult.lastDigit === 0;
            combatResult.attacker.testStmble =
                opposedTestResult.sourceTestResult.isCritical &&
                !opposedTestResult.sourceTestResult.isSuccess &&
                opposedTestResult.sourceTestResult.lastDigit === 5;

            combatResult.defender.testStmble =
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

            const formatter = game.i18n.getListFormatter();
            combatResult.attacker.tacticalAdvantageChoicesText =
                formatter.format(
                    combatResult.attacker.tacticalAdvantageChoices,
                );
            combatResult.defender.tacticalAdvantageChoicesText =
                formatter.format(
                    combatResult.defender.tacticalAdvantageChoices,
                );

            opposedTestResult.combatResult = combatResult;

            if (!noChat) {
                opposedTestResult.toChat({
                    template:
                        "systems/sohl/templates/chat/opposed-result-card.html",
                    title: "Opposed Test Result",
                });
            }
        }

        return allowed ? opposedTestResult : false;
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
                        type: sohl.AfflictionItemData.TYPE_NAME,
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
        this.$bodyZoneProbSum = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
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
        this.$bodyPartProbSum = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$impairment = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    unusable: false,
                    value: (thisVM) => {
                        Math.min(thisVM.effective, 0);
                    },
                },
            },
            { parent: this },
        );
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

    get testFumble() {
        return !!this.item.getFlag("sohl", "legendary.testFumble");
    }

    get testStmble() {
        return !!this.item.getFlag("sohl", "legendary.testStmble");
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
                blunt: new CONFIG.SOHL.class.ValueModifier(
                    {},
                    { parent: this },
                ),
                edged: new CONFIG.SOHL.class.ValueModifier(
                    {},
                    { parent: this },
                ),
                piercing: new CONFIG.SOHL.class.ValueModifier(
                    {},
                    { parent: this },
                ),
                fire: new CONFIG.SOHL.class.ValueModifier({}, { parent: this }),
            },
            { inplace: true },
        );
        this.$impairment = new CONFIG.SOHL.class.ValueModifier(
            {
                properties: {
                    unusable: false,
                },
            },
            { parent: this },
        );
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
        if (!this._effectKeys) {
            this._effectKeys = LgndUtility.simpleMerge(
                super.effectKeys,
                super.effectKeys,
                {
                    "system.$encumbrance": {
                        label: "Encumbrance",
                        abbrev: "Enc",
                    },
                },
            );
        }
        return this._effectKeys;
    }

    get encumbrance() {
        return this.item.getFlag("sohl", "legendary.encumbrance") || 0;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();

        this.$encumbrance = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
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

        this.$length = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
        this.$length.setBase(this.lengthBase);

        this.$heft = new CONFIG.SOHL.class.ValueModifier({}, { parent: this });
        this.$heft.setBase(this.heftBase);

        this.$baseRange = new CONFIG.SOHL.class.ValueModifier(
            {},
            { parent: this },
        );
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
        if (!this._effectKeys) {
            this._effectKeys = LgndUtility.simpleMerge(super.effectKeys, {
                "system.$traits.armorReduction": {
                    label: "Armor Reduction",
                    abbrev: "ProjAR",
                },
            });
        }
        return this._effectKeys;
    }

    prepareBaseData() {
        super.prepareBaseData();

        this.$attack = new LgndCombatModifier({}, { parent: this });
        this.$impact = new LgndImpactModifier({}, { parent: this });
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

    /**
     * If the current combatant is controllable by the player, then perform an automated attack.
     * If only one strike mode is possible, it is selected, otherwise a dialog is provided with all
     * available strike modes ordered by median impact.
     *
     * @param {*} speaker
     * @param {*} actor
     * @param {*} token
     * @param {*} character
     * @param {*} scope
     * @returns
     */
    static async currentCombatantAttack(
        _speaker,
        _actor,
        _token,
        _character,
        scope = {},
    ) {
        let { skipDialog = false, groups = [], aspect = null } = scope;

        const combatant = CONFIG.SOHL.class.Utility.getTokenInCombat();
        if (!combatant) return;

        const targetToken = sohl.Utility.getUserTargetedToken(combatant.token);
        if (!targetToken) {
            ui.notification.warn("No Targeted Token");
            return null;
        }

        const targetRange = LgndUtility.rangeToTarget(
            combatant.token,
            targetToken,
        );

        const strikeMode = await LgndUtility.getOpposedItem({
            actor: combatant.token.actor,
            skipDialog,
            label: "Select which Strike Mode to use:",
            title: `Choose Attack Strike Mode for ${combatant.token.name}`,
            func: (it) => {
                let result = false;
                if (
                    // Must be a strikemode
                    it.type.endsWith("strikemode") &&
                    // if groups are specified, must be in group
                    (!groups.length || groups.includes(it.system.group)) &&
                    // Attacks must be enabled
                    !it.system.$attack.disabled &&
                    // if aspect specified, must have specified aspect
                    (!aspect || it.system.$impact.aspect === aspect)
                ) {
                    if (
                        it.type ===
                        LgndCombatTechniqueStrikeModeItemData.TYPE_NAME
                    ) {
                        if (
                            // Combat Techniques must be nested in Combat Maneuvers, otherwise ignore
                            it.nestedIn?.type !==
                                sohl.CombatManeuverItemData.TYPE_NAME &&
                            // Exclude any combat maneuvers that are outside of engagement zone
                            targetRange <=
                                LgndUtility.engagementZoneRange(
                                    it.system.$reach.effective,
                                )
                        )
                            result = {
                                key: it.name,
                                value: it,
                            };
                    } else {
                        // All other Strike Modes must be nested in Weapon Gear, otherwise ignore
                        if (it.nestedIn.system.$heldBy?.length) {
                            if (
                                // Melee weapon target range must be inside engagement zone
                                (it.type ===
                                    LgndMeleeWeaponStrikeModeItemData.TYPE_NAME &&
                                    targetRange <=
                                        LgndUtility.engagementZoneRange(
                                            it.system.$reach.effective,
                                        )) ||
                                // Missile weapon target range must be inside max missile range
                                (it.type ===
                                    LgndMissileWeaponStrikeModeItemData.TYPE_NAME &&
                                    targetRange <=
                                        it.system.$maxDistance.effective)
                            ) {
                                result = {
                                    key: it.name,
                                    value: it,
                                };
                            }
                        }
                    }
                }
                return result;
            },
            compareFn: (a, b) =>
                b.system.$impact.median - a.system.$impact.median,
        });

        if (strikeMode === null) {
            return null;
        } else if (strikeMode === false) {
            ui.notifications.warn(
                `${combatant.token.name} has no usable strike modes in range to ${targetToken.name}, cannot attack`,
            );
            return null;
        } else {
            strikeMode.system.execute("automatedCombatStart", scope);
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
                case CONFIG.SOHL.CONST.TOUR_TAB_PARENTS.ACTOR: {
                    if (!this.actor) {
                        console.warn("No Actor Found");
                        break;
                    }
                    const app = this.actor.sheet;
                    app?.activateTab(currentStep.tab.id);
                    break;
                }

                case CONFIG.SOHL.CONST.TOUR_TAB_PARENTS.ITEM: {
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

const LgndActorDataModels = foundry.utils.mergeObject(
    sohl.SohlActorDataModels,
    {
        [sohl.AnimateEntityActorData.TYPE_NAME]: LgndAnimateEntityActorData,
    },
    { inplace: false },
);

const LgndItemDataModels = foundry.utils.mergeObject(
    sohl.SohlItemDataModels,
    {
        [sohl.ProtectionItemData.TYPE_NAME]: LgndProtectionItemData,
        [sohl.MysticalAbilityItemData.TYPE_NAME]: LgndMysticalAbilityItemData,
        [sohl.TraitItemData.TYPE_NAME]: LgndTraitItemData,
        [sohl.SkillItemData.TYPE_NAME]: LgndSkillItemData,
        [sohl.InjuryItemData.TYPE_NAME]: LgndInjuryItemData,
        [sohl.AfflictionItemData.TYPE_NAME]: LgndAfflictionItemData,
        [sohl.AnatomyItemData.TYPE_NAME]: LgndAnatomyItemData,
        [sohl.BodyZoneItemData.TYPE_NAME]: LgndBodyZoneItemData,
        [sohl.BodyPartItemData.TYPE_NAME]: LgndBodyPartItemData,
        [sohl.BodyLocationItemData.TYPE_NAME]: LgndBodyLocationItemData,
        [sohl.MeleeWeaponStrikeModeItemData.TYPE_NAME]:
            LgndMeleeWeaponStrikeModeItemData,
        [sohl.MissileWeaponStrikeModeItemData.TYPE_NAME]:
            LgndMissileWeaponStrikeModeItemData,
        [sohl.CombatTechniqueStrikeModeItemData.TYPE_NAME]:
            LgndCombatTechniqueStrikeModeItemData,
        [sohl.ArmorGearItemData.TYPE_NAME]: LgndArmorGearItemData,
        [sohl.WeaponGearItemData.TYPE_NAME]: LgndWeaponGearItemData,
        [sohl.ProjectileGearItemData.TYPE_NAME]:
            LgndProjectileWeaponGearItemData,
    },
    { inplace: false },
);

const lgndClasses = foundry.utils.mergeObject(
    sohl.SOHL.classes,
    {
        ImpactModifier: LgndImpactModifier,
        MasteryLevelModifier: LgndMasteryLevelModifier,
        CombatModifier: LgndCombatModifier,
        ImpactResult: LgndImpactResult,
        SuccessTestResult: LgndSuccessTestResult,
        OpposedTestResult: LgndOpposedTestResult,
        CombatTestResult: LgndCombatTestResult,
        Utility: LgndUtility,
    },
    { inplace: false },
);

export const verData = {
    SOHL: {
        id: "legendary",
        title: "Song of Heroic Lands: Legendary",
        class: lgndClasses,
        CONST: foundry.utils.mergeObject(
            sohl.SOHL.CONST,
            {
                // Legendary init message with ASCII Artwork (Doom font)
                initVariantMessage: ` _                               _
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
            { inplace: false },
        ),
    },
    CONFIG: foundry.utils.mergeObject(
        sohl.SOHL.CONFIG,
        {
            Actor: {
                documentClass: sohl.SohlActor,
                documentSheets: [
                    {
                        cls: sohl.SohlActorSheet,
                        types: Object.keys(LgndActorDataModels),
                    },
                ],
                dataModels: LgndActorDataModels,
                typeLabels: Object.fromEntries(
                    Object.keys(LgndActorDataModels).map((i) => [
                        i,
                        `TYPES.Item.${i}`,
                    ]),
                ),
                typeIcons: Object.fromEntries(
                    Object.values(LgndActorDataModels).map((i) => [
                        i.metadata.name,
                        i.metadata.iconCssClass,
                    ]),
                ),
                types: Object.keys(LgndActorDataModels),
                defaultType: sohl.AnimateEntityActorData.TYPE_NAME,
                compendiums: ["sohl.leg-characters", "sohl.leg-creatures"],
                macros: {},
            },
            Item: {
                documentClass: sohl.SohlItem,
                documentSheets: [
                    {
                        cls: sohl.SohlItemSheet,
                        types: Object.keys(LgndItemDataModels).filter(
                            (t) => t !== sohl.ContainerGearItemData.TYPE_NAME,
                        ),
                    },
                    {
                        cls: sohl.SohlContainerGearItemSheet,
                        types: [sohl.ContainerGearItemData.TYPE_NAME],
                    },
                ],
                dataModels: LgndItemDataModels,
                typeLabels: Object.fromEntries(
                    Object.keys(LgndItemDataModels).map((i) => [
                        i,
                        `TYPES.Item.${i}`,
                    ]),
                ),
                typeIcons: Object.fromEntries(
                    Object.values(LgndItemDataModels).map((i) => [
                        i.metadata.name,
                        i.metadata.iconCssClass,
                    ]),
                ),
                types: Object.keys(LgndItemDataModels),
                compendiums: [
                    "sohl.leg-characteristics",
                    "sohl.leg-possessions",
                    "sohl.leg-mysteries",
                ],
                macros: {},
            },
            ActiveEffect: {
                documentClass: sohl.SohlActiveEffect,
                dataModels: {
                    [sohl.SohlActiveEffectData.dataModelName]:
                        sohl.SohlActiveEffectData,
                },
                typeLabels: {
                    [sohl.SohlActiveEffectData.dataModelName]:
                        sohl.SohlActiveEffectData.TYPE_LABEL.SINGULAR,
                },
                typeIcons: {
                    [sohl.SohlActiveEffectData.dataModelName]: "fas fa-gears",
                },
                types: [sohl.SohlActiveEffectData.dataModelName],
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
        { inplace: false },
    ),
};
