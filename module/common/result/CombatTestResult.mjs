import { Utility } from "../helper/utility.mjs";
import { ImpactModifier } from "../modifier/ImpactModifier.mjs";
import { OpposedTestResult } from "../OpposedTestResult.mjs";
import { fields } from "../../sohl-common.mjs";
import { SuccessTestResult } from "./SuccessTestResult.mjs";

export class CombatTestResult extends SuccessTestResult {
    static TEST = Object.freeze({
        AUTOCOMBATMELEE: "autoCombatMelee",
        AUTOCOMBATMISSILE: "autoCombatMissile",
        MISSILEATTACK: "missileAttackTest",
        MELEEATTACK: "meleeAttackTest",
        CALCIMPACT: "calcImpact",
    });

    static DEFENSE = Object.freeze({
        BLOCK: { id: "block", cssClass: "fas fa-shield" },
        DODGE: {
            id: "dodge",
            cssClass: "fas fa-person-walking-arrow-loop-left",
        },
        COUNTERSTRIKE: {
            id: "counterstrike",
            cssClass: "fas fa-circle-half-stroke",
        },
        IGNORE: { id: "ignore", cssClass: "fas fa-ban" },
    });

    static MOVEMENT = Object.freeze({
        STILL: "still",
        MOVING: "moving",
        EVADING: "evading",
    });

    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "CombatTestResult",
        locId: "COMBATTESTRESULT",
        schemaVersion: "0.5.6",
        tests: {},
    });

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            impactMod: new fields.EmbeddedDataField(ImpactModifier),
            situationalModifier: new fields.NumberField({
                integer: true,
                initial: 0,
            }),
            deliversImpact: new fields.BooleanField({ initial: false }),
            testFumble: new fields.BooleanField({ initial: false }),
            testStumble: new fields.BooleanField({ initial: false }),
            weaponBreak: new fields.BooleanField({ initial: false }),
            targetMovement: new fields.StringField({
                initial: CombatTestResult.MOVEMENT.STILL,
                choices: Utility.getChoicesMap(
                    CombatTestResult.MOVEMENT,
                    "SOHL.COMBATTESTRESULT.MOVEMENT",
                ),
            }),
        });
    }

    constructor(data = {}, context = {}) {
        super(data, context);
        if (!data.impactMod) {
            throw new Error("impactMod must be specified");
        }
    }

    calcMeleeCombatResult(opposedTestResult) {
        const attacker = opposedTestResult.sourceTestResult;
        const defender = opposedTestResult.targetTestResult;

        this.testFumble =
            this.isCritical && !this.isSuccess && this.lastDigit === 0;
        this.testStumble =
            this.isCritical && !this.isSuccess && this.lastDigit === 5;
        this.deliversImpact = false;

        if (this.testType.type === CombatTestResult.TEST.IGNOREDEFENSE) {
            this.testStumble = false;
        }

        switch (this.testType.type) {
            case CombatTestResult.TEST.IGNOREDEFENSE:
                defender.testStumble = false;
                defender.testFumble = false;
                if (
                    attacker.successLevel >=
                    SuccessTestResult.SUCCESS_LEVEL.MARGINAL_FAILURE
                ) {
                    opposedTestResult.winner(
                        OpposedTestResult.TIE_BREAK.SOURCE,
                    );
                    attacker.deliversImpact = true;
                }
                break;

            case CombatTestResult.TEST.BLOCKDEFENSE:
                if (opposedTestResult.sourceWins) {
                    attacker.deliversImpact = true;
                } else {
                    if (opposedTestResult.isTied)
                        opposedTestResult.winner(
                            OpposedTestResult.TIE_BREAK.TARGET,
                        );
                }
                break;

            case CombatTestResult.TEST.CXDEFENSE:
                if (defender.mlMod.has("CXBoth"))
                    if (opposedTestResult.isTied) {
                        if (defender.mlMod.has("CXBoth")) {
                            opposedTestResult.breakTies(true);
                            if (opposedTestResult.targetWins)
                                defender.deliversImpact = true;
                        } else {
                            opposedTestResult.winner(
                                OpposedTestResult.TIE_BREAK.SOURCE,
                            );
                        }
                        attacker.deliversImpact = true;
                    } else if (opposedTestResult.sourceWins) {
                        attacker.deliversImpact = true;
                    } else {
                        defender.deliversImpact = true;
                    }
                break;
        }
    }

    calcDodgeCombatResult(opposedTestResult) {
        const attacker = opposedTestResult.sourceTestResult;
        const defender = opposedTestResult.targetTestResult;

        attacker.deliversImpact = false;
        attacker.testFumble =
            attacker.isCritical &&
            !attacker.isSuccess &&
            attacker.lastDigit === 0;
        attacker.testStumble =
            attacker.isCritical &&
            !attacker.isSuccess &&
            attacker.lastDigit === 5;
        defender.deliversImpact = false;
        defender.testFumble = false;
        defender.testStumble = defender.isCritical && !defender.isSuccess;

        if (opposedTestResult.sourceWins) {
            attacker.deliversImpact = true;
        }
    }

    opposedTestEvaluate(opposedTestResult) {
        super.opposedTestEvaluate(opposedTestResult);
        if (opposedTestResult.targetTestResult === this) {
            if (
                [
                    CombatTestResult.TEST.BLOCKDEFENSE,
                    CombatTestResult.TEST.CXDEFENSE,
                    CombatTestResult.TEST.IGNOREDEFENSE,
                ].includes(opposedTestResult.testType.type)
            ) {
                this.calcMeleeCombatResult(opposedTestResult);
            } else if (
                this.testType.type === CombatTestResult.TEST.DODGEDEFENSE
            ) {
                this.calcDodgeCombatResult(opposedTestResult);
            }
        }
        return;
    }

    async testDialog(data = {}, callback) {
        sohl.utils.mergeObject(
            data,
            {
                impactMod: this.impactMod,
                impactSituationalModifier: this.situationalModifier,
                deliversImpact: this.deliversImpact,
                testFumble: this.testFumble,
                testStumble: this.testStumble,
                weaponBreak: this.weaponBreak,
            },
            { overwrite: false },
        );

        return await super.testDialog(data, (thisArg, formData) => {
            const formImpactSituationalModifier =
                Number.parseInt(formData.impactSituationalModifier, 10) || 0;

            if (thisArg.impactMod && formImpactSituationalModifier) {
                thisArg.impactMod.add(
                    game.sohl?.MOD.Player,
                    formImpactSituationalModifier,
                );
                thisArg.impactSituationalModifier =
                    formImpactSituationalModifier;
            }

            if (callback) callback(this, formData);
        });
    }

    async toChat(data = {}) {
        return super.toChat(
            sohl.utils.mergeObject(
                data,
                {
                    impactSituationalModifier: this.situationalModifier,
                    impactMod: this.impactMod,
                    deliversImpact: this.deliversImpact,
                    testFumble: this.testFumble,
                    testStumble: this.testStumble,
                    weaponBreak: this.weaponBreak,
                },
                { overwrite: false },
            ),
        );
    }
}
