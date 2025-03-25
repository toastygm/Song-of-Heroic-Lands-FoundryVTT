import { CombatTestResult } from "../../result/CombatTestResult.mjs";
import { SOHL_VARIANTS } from "../../helper/constants.mjs";
import { _l } from "../../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { Utility } from "../../helper/utility.mjs";
import { ImpactModifier } from "../../modifier/ImpactModifier.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlMacro } from "../../macro/SohlMacro.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { SkillItemData } from "./SkillItemData.mjs";
import { SohlItem } from "../SohlItem.mjs";
import { SohlItemData } from "./SohlItemData.mjs";
import { SubtypeMixin } from "../../SubtypeMixin.mjs";
import { SuccessTestResult } from "../../result/SuccessTestResult.mjs";

export class StrikeModeItemData extends SubtypeMixin(SohlItemData) {
    $traits;
    $assocSkill;
    $impact;
    $attack;
    $defense;
    $durability;

    static EFFECT_KEYS = Object.freeze({
        IMPACT: { id: "impact", path: "system.$impact", abbrev: "Imp" },
        ATTACK: { id: "attack", path: "system.$attack", abbrev: "Atk" },
        NOATTACK: {
            id: "noAttack",
            path: "system.$traits.noAttack",
            abbrev: "NoAtk",
        },
        NOBLOCK: {
            id: "noBlock",
            path: "system.$traits.noBlock",
            abbrev: "noBlk",
        },
    });

    static ACTION = Object.freeze({
        ATTACK: {
            id: "attackTest",
            contextIconClass: "fas fa-sword",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$attack.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
        },
        AUTOCOMBAT: {
            id: "automatedCombatStart",
            contextIconClass: "fas fa-swords",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$attack.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
        },
        AUTOCOMBATRESUME: {
            id: "automatedCombatResume",
            contextIconClass: "fas fa-shield",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
            useAsync: true,
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                locId: "STRIKEMODE",
                nestOnly: true,
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "STRIKEMODE"),
                subTypes: SOHL_VARIANTS,
                defaultAction: this.ACTION.AUTOCOMBAT.id,
                actions: this.genActions(this.ACTION, "STRIKEMODE"),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get transferToActor() {
        return this.subType === game.sohl?.id && super.transferToActor;
    }

    get group() {
        throw new Error("Subclass must define group");
    }

    get strikeModeLabel() {
        return `${this.item.nestedIn?.name} ${this.name}`;
    }

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            mode: new fields.StringField(),
            minParts: new fields.NumberField({
                integer: true,
                initial: 1,
                min: 0,
            }),
            assocSkillName: new fields.StringField(),
            impactBase: new fields.SchemaField({
                numDice: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                die: new fields.NumberField({
                    integer: true,
                    initial: 6,
                    min: 0,
                }),
                modifier: new fields.NumberField({
                    integer: true,
                    initial: 0,
                }),
                aspect: new fields.StringField({
                    initial: ImpactModifier.ASPECT.BLUNT,
                    required: true,
                    choices: Utility.getChoicesMap(
                        ImpactModifier.ASPECT,
                        "SOHL.IMPACTMODIFIER.ASPECT",
                    ),
                }),
            }),
        });
    }

    async _preOpposedSuccessTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));

        let { targetToken, sourceTestResult } = scope;

        return {
            speaker,
            sourceTestResult,
            targetToken,
        };
    }

    async automatedCombatStart(speaker, actor, token, character, scope) {
        scope.impactMod ||= Utility.deepClone(this.$impact);
        let {
            skipDialog = false,
            noChat = false,
            testType = SuccessTestResult.TEST.AUTOCOMBATMELEE,
            mlMod = Utility.deepClone(this.$attack),
        } = scope;

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
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

        let combatTestResult = new game.sohl()?.CombatTestResult(
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
     * Continue the opposed test. Only valid tests are "block" and "counterstrike".
     *
     * @param {object} scope
     * @param {string} [scope.sourceTestResult]
     * @param {number} [scope.testType]
     * @returns {OpposedTestResult} result of the test
     */
    async automatedCombatResume(speaker, actor, token, character, scope = {}) {
        let { noChat = false, opposedTestResult, testType, mlMod } = scope;
        if (!opposedTestResult)
            throw new Error("Must supply an opposedTestResult");

        if (!(opposedTestResult instanceof CombatTestResult)) {
            opposedTestResult = Utility.JSON_reviver({
                thisArg: this,
            })("", opposedTestResult);
            if (!(opposedTestResult instanceof CombatTestResult)) {
                throw new Error("Invalid combatTestResult");
            }
        }

        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
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
                    impactMod: Utility.deepClone(this.$impact),
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
                template: "systems/sohl/templates/chat/opposed-result-card.hbs",
                title: "Combat Resume",
            });
        }

        return allowed ? opposedTestResult : false;
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$durability = new CONFIG.ValueModifier({}, { parent: this });
        this.$length = new CONFIG.ValueModifier({}, { parent: this });
        this.$attack = new CONFIG.CombatModifier({}, { parent: this });
        this.$defense = {
            block: new CONFIG.CombatModifier({}, { parent: this }),
            counterstrike: new CONFIG.CombatModifier({}, { parent: this }),
        };
        this.$impact = new CONFIG.ImpactModifier(
            {
                properties: {
                    numDice: this.impactBase.numDice,
                    aspect: this.impactBase.aspect,
                    die: this.impactBase.die,
                },
            },
            { parent: this },
        );
        if (!this.impactBase.modifier && !this.impactBase.die) {
            this.$impact.disabled = game.sohl?.MOD.NoModifierNoDie;
        } else {
            this.$impact.setBase(this.impactBase.modifier);
        }
        this.$traits = {
            noAttack: false,
            noBlock: false,
        };
    }

    setupVirtualItems() {
        super.setupVirtualItems();
        this.$assocSkill = this.actor.getItem(this.assocSkillName, {
            types: [SkillItemData.TYPE_NAME],
            isName: true,
        });
        if (!this.$assocSkill) {
            ui.notifications?.warn(
                _l("SOHL.StrikeModeItemData.NoAssocSkillWarning", {
                    label: _l(this.constructor.metadata.label),
                    skillName: this.assocSkillName,
                }),
            );
            this.$assocSkill = new SohlItem(
                {
                    name: this.assocSkillName,
                    type: SkillItemData.TYPE_NAME,
                    _id: sohl.utils.randomID(),
                    system: {
                        masteryLevelBase: 0,
                    },
                },
                { parent: this.actor },
            );
            this.$assocSkill.cause = this.item;
        }
    }

    postProcess() {
        super.postProcess();
        if (this.item.nestedIn?.system instanceof GearItemData) {
            this.$durability.addVM(this.item.nestedIn.system.$durability, {
                includeBase: true,
            });
        } else {
            this.$durability.disabled = game.sohl?.MOD.NoAssocSkill;
        }
        this.$assocSkill = this.actor.getItem(this.assocSkillName, {
            types: [SkillItemData.TYPE_NAME],
            isName: true,
        });
        if (this.$assocSkill) {
            this.$attack.addVM(this.$assocSkill.system.$masteryLevel, {
                includeBase: true,
            });
            this.$attack.fate.addVM(
                this.$assocSkill.system.$masteryLevel.fate,
                {
                    includeBase: true,
                },
            );
        } else {
            this.$attack.disabled = game.sohl?.MOD.NoAssocSkill;
        }
    }
}
