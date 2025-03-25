import { _l } from "../../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { SohlFunctionField } from "../../SohlFunctionField.mjs";
import { Utility } from "../../helper/utility.mjs";
import { ImpactResult } from "../../result/ImpactResult.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlMacro } from "../../macro/SohlMacro.mjs";
import { InjuryItemData } from "../../item/datamodel/InjuryItemData.mjs";
import { PhilosophyItemData } from "../../item/datamodel/PhilosophyItemData.mjs";
import { CombatTechniqueStrikeModeItemData } from "../CombatTechniqueStrikeModeItemData.mjs";
import { MissileWeaponStrikeModeItemData } from "../../item/datamodel/MissileWeaponStrikeModeItemData.mjs";
import { MeleeWeaponStrikeModeItemData } from "../../item/datamodel/MeleeWeaponStrikeModeItemData.mjs";
import { SohlActorData } from "./SohlActorData.mjs";
import { SohlItem } from "../../item/SohlItem.mjs";
import { SuccessTestResult } from "../../result/SuccessTestResult.mjs";

export class AnimateEntityActorData extends SohlActorData {
    /**
     * Represents the health of a entity.
     *
     * @type {ValueModifier}
     */
    $health;

    /**
     * Represents the base healing rate
     */
    $healingBase;

    /**
     * Represents the sum of all zones.
     *
     * @type {number}
     */
    $zoneSum;

    /**
     * Represents the base body weight of a entity without any gear
     *
     * @type {ValueModifier}
     */
    $bodyWeight;

    /**
     * Represents the level of shock the character is experiencing.
     *
     * @type {number}
     */
    $shockState;

    $fate;

    $engagedOpponents;

    $domains;

    $magicMod;

    static EFFECT_KEYS = Object.freeze({
        IMPACT: { id: "impact", path: "system.$impact", abbrev: "Imp" },
        ENGAGEDOPPONENTS: {
            id: "engagedOpponents",
            path: "system.$engagedOpponents",
            abbrev: "EngOpp",
        },
    });

    static ACTION = Object.freeze({
        SHOCK: {
            id: "shockTest",
            contextIconClass: "far fa-face-eyes-xmarks",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        STUMBLE: {
            id: "stumbleTest",
            contextIconClass: "far fa-person-falling",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        FUMBLE: {
            id: "fumbleTest",
            contextIconClass: "far fa-ball-pile",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        MORALE: {
            id: "moraleTest",
            contextIconClass: "far fa-people-group",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        FEAR: {
            id: "fearTest",
            contextIconClass: "far fa-face-scream",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        AFFLICTIONCONTRACT: {
            id: "contractAfflictionTest",
            contextIconClass: "fas fa-virus",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        FATIGUE: {
            id: "fatigueTest",
            contextIconClass: "fas fa-face-downcast-sweat",
            contextCondition: true,
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        CALCIMPACT: {
            id: "calcImpact",
            contextIconClass: "fas fa-bullseye-arrow",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$impact.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
        },
        DISPATCHAUTOCOMBAT: {
            id: "dispatchAutoCombat",
            contextIconClass: "fas fa-people-arrows",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
        },
        DISPATCHAUTOCOMBATRESUME: {
            id: "dispatchAutoCombatResume",
            contextIconClass: "fas fa-people-arrows",
            contextCondition: false,
            contextGroup: SohlContextMenu.SORT_GROUPS.HIDDEN,
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "entity",
                locId: "ENTITY",
                iconCssClass: "fas fa-person",
                img: "icons/svg/item-bag.svg",
                sheet: "systems/sohl/templates/actor/actor-sheet.hbs",
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "ENTITY"),
                defaultAction: null,
                actions: this.genActions(this.ACTION, "ENTITY"),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async improveWithSDR(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async successTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async fatigueTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async courseTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async treatmentTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async diagnosisTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async healingTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async bleedingStoppageTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async bloodLossAdvanceTest(speaker, actor, token, character, scope = {}) {
        return;
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async calcImpact(speaker, actor, token, character, scope = {}) {
        let { impactResult, itemId } = scope;
        if (!(impactResult instanceof ImpactResult)) {
            if (!itemId) {
                throw new Error("must provide either impactResult or itemId");
            }
            const item = this.actor.getItem(itemId, {
                types: [
                    MeleeWeaponStrikeModeItemData.TYPE_NAME,
                    MissileWeaponStrikeModeItemData.TYPE_NAME,
                    CombatTechniqueStrikeModeItemData.TYPE_NAME,
                ],
            });
            impactResult = Utility.JSON_reviver({
                thisArg: item.system,
            })("", impactResult);
        }
        return impactResult.item?.system.execute("calcImpact", {
            impactResult,
        });
    }

    async shockTest(speaker, actor, token, character, scope = {}) {
        let { testResult } = scope;
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!testResult) {
            const shockSkill = this.actor.getItem("shk", { types: ["skill"] });
            if (!shockSkill) return null;
            testResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST.SHOCK,
                    mlMod: Utility.deepClone(shockSkill.system.$masteryLevel),
                },
                { parent: shockSkill.system },
            );
            // For the shock test, the test should not include the impairment penalty
            testResult.mlMod.delete("BPImp");
        }

        testResult = testResult.item.system.successTest(scope);

        testResult.shockMod = 1 - testResult.successLevel;
        return testResult;
    }

    async stumbleTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const agility = this.actor.getItem("agl", { types: ["trait"] });
            const acrobatics = this.actor.getItem("acro", { types: ["skill"] });
            const item =
                (
                    agility?.system.$masteryLevel.effective >
                    acrobatics?.system.$masteryLevel.effective
                ) ?
                    agility
                :   acrobatics;
            if (!item) return null;

            scope.testResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST.STUMBLE,
                    mlMod: Utility.deepClone(item.system.$masteryLevel),
                },
                { parent: item.system },
            );
        }

        return scope.testResult.item.system.successTest(scope);
    }

    async fumbleTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const dexterity = this.actor.getItem("dex", { types: ["trait"] });
            const legerdemain = this.actor.getItem("lgdm", {
                types: ["skill"],
            });
            const item =
                (
                    dexterity?.system.$masteryLevel.effective >
                    legerdemain?.system.$masteryLevel.effective
                ) ?
                    dexterity
                :   legerdemain;
            if (!item) return null;

            scope.testResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST.FUMBLE,
                    mlMod: Utility.deepClone(item.system.$masteryLevel),
                },
                { parent: item.system },
            );
        }

        return scope.testResult.item.system.successTest(scope);
    }

    async moraleTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const initSkill = this.actor.getItem("init", { types: ["skill"] });
            if (!initSkill) return null;
            scope.testResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST.MORALE,
                    mlMod: Utility.deepClone(initSkill.system.$masteryLevel),
                },
                { parent: initSkill.system },
            );
        }

        scope.testResult = scope.testResult.item.system.successTest(scope);
        return this._createTestItem(scope);
    }

    async fearTest(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            const initSkill = this.actor.getItem("init", { types: ["skill"] });
            if (!initSkill) return null;
            scope.testResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST.FEAR,
                    mlMod: Utility.deepClone(initSkill.system.$masteryLevel),
                },
                { parent: initSkill.system },
            );
        }

        scope.testResult = scope.testResult.item.system.successTest(scope);
        return this._createTestItem(scope);
    }

    async _createTestItem(scope) {
        let createItem = game.settings.get("sohl", "recordTrauma");
        if (!scope.testResult.isSuccess && createItem !== "disable") {
            if (createItem === "ask") {
                createItem = await Dialog.confirm({
                    title: _l(
                        "SOHL.Actor.entity._createTestItem.dialog.title",
                        {
                            label: scope.testResult.item.label,
                        },
                    ),
                    content: _l(
                        "SOHL.Actor.entity._createTestItem.dialog.content",
                        {
                            label: scope.testResult.item.label,
                            name: this.name,
                        },
                    ),
                    yes: () => {
                        return "enable";
                    },
                });
            }

            if (createItem === "enable") {
                await SohlItem.create(scope.testResult.item.toObject(), {
                    parent: this.item,
                    clean: true,
                });
            }
        }
        return scope.testResult;
    }

    async contractAfflictionTest(speaker, actor, token, character, scope = {}) {
        let { afflictionObj } = scope;
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsActor: true,
            self: this,
        }));

        if (!scope.testResult) {
            if (!afflictionObj) return null;

            const item = new SohlItem(afflictionObj);
            if (!item) return null;

            scope.testResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    testType: SuccessTestResult.TEST.AFFLICTIONCONTRACT,
                    mlMod: Utility.deepClone(item.system.$masteryLevel),
                },
                { parent: item.system },
            );
        }

        scope.testResult = scope.testResult.item.system.successTest(scope);
        return this._createTestItem(scope);
    }

    prepareBaseData() {
        class HealthModifier extends CONFIG.ValueModifier {
            static defineSchema() {
                return sohl.utils.mergeObject(super.defineSchema(), {
                    max: new fields.NumberField({
                        integer: true,
                        nullable: false,
                        initial: 0,
                        min: 0,
                    }),
                    pct: new SohlFunctionField({
                        initial: (thisVM) =>
                            Math.round(
                                (thisVM.effective /
                                    (thisVM.max || Number.EPSILON)) *
                                    100,
                            ),
                    }),
                });
            }
        }
        super.prepareBaseData();
        this.$health = new HealthModifier({}, { parent: this });
        this.$healingBase = new CONFIG.ValueModifier({}, { parent: this });
        this.$zoneSum = 0;
        this.$isSetup = true;
        this.$shockState = InjuryItemData.SHOCK.NONE;
        this.$engagedOpponents = new CONFIG.ValueModifier({}, { parent: this });
        this.$engagedOpponents.setBase(0);
        this.$domains = Object.fromEntries(
            Object.keys(PhilosophyItemData.categories).map((c) => [c, []]),
        );
    }
}
