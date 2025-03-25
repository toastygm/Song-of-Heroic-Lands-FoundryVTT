/** @typedef {import("@league-of-foundry-developers/foundry-vtt-types")} */
/** @typedef {import("@sohl-datamodel").EffectKey} EffectKey */
/** @typedef {import("@sohl-datamodel").DataModelMetadata} DataModelMetadata */
/** @typedef {import("@sohl-datamodel").SohlAction} SohlAction */
import { _l } from "../../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { Utility } from "../../helper/utility.mjs";
import { fields } from "../../../sohl-common.mjs";
import { SohlMacro } from "../../macro/SohlMacro.mjs";
import { SkillBase } from "../../SkillBase.mjs";
import { MysteryItemData } from "./MysteryItemData.mjs";
import { SohlItemData } from "./SohlItemData.mjs";
import { SuccessTestResult } from "../../result/SuccessTestResult.mjs";

export class MasteryLevelItemData extends SohlItemData {
    $boosts;
    $skillBase;
    $masteryLevel;

    /**
     * @type {Readonly<Record<string, EffectKey>>}
     */
    static EFFECT_KEYS = Object.freeze({
        LENGTH: { id: "length", path: "system.$length", abbrev: "Len" },
        BOOST: { id: "boost", path: "system.$boosts", abbrev: "Boost" },
        MASTERYLEVEL: {
            id: "masteryLevel",
            path: "system.$masteryLevel",
            abbrev: "ML",
        },
        FATE: { id: "fate", path: "system.$masteryLevel.fate", abbrev: "Fate" },
        SUCCESSLEVEL: {
            id: "successLevel",
            path: "system.$masteryLevel.successLevelMod",
            abbrev: "SL",
        },
    });

    static ACTION = Object.freeze({
        SETIMPROVEFLAG: {
            id: "setImproveFlag",
            contextIconClass: "fas fa-star",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return (
                    item && item.system.canImprove && !item.system.improveFlag
                );
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },
        UNSETIMPROVEFLAG: {
            id: "unsetImproveFlag",
            contextIconClass: "far fa-star",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return (
                    item && item.system.canImprove && item.system.improveFlag
                );
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },
        IMPROVEWITHSDR: {
            id: "improveWithSDR",
            contextIconClass: "fas fa-star",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item?.system.canImprove && item.system.improveFlag;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.GENERAL,
            useAsync: true,
        },
        SUCCESSTEST: {
            id: "successTest",
            contextIconClass: "fas fa-person",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$masteryLevel.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        OPPOSEDTESTSTART: {
            id: "opposedTestStart",
            contextIconClass:
                "fas fa-arrow-down-left-and-arrow-up-right-to-center",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                if (!item) return false;
                const token = item.actor?.getToken();
                return token && !item.system.$masteryLevel.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
            useAsync: true,
        },
        OPPOSEDTESTRESUME: {
            id: "opposedTestResume",
            contextIconClass: "fas fa-people-arrows",
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
                locId: "MASTERYLEVEL",
                defaultAction: this.ACTION.SUCCESSTEST.id,
                actions: this.genActions(this.ACTION, "MASTERYLEVEL"),
                effectKeys: this.genEffectKeys(
                    this.EFFECT_KEYS,
                    "MASTERYLEVEL",
                ),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get fateSkills() {
        return this.item.getFlag("sohl", "fateSkills") || [];
    }

    get boosts() {
        return this.$boosts;
    }

    /**
     * Searches through all of the Fate mysteries on the actor, gathering any that
     * are applicable to this skill, and returns them.
     *
     * @readonly
     * @type {SohlItem[]} An array of Mystery fate items that apply to this skill.
     */
    get availableFate() {
        let result = [];
        if (!this.$masteryLevel.disabled) {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof MysteryItemData &&
                    it.system.subType === MysteryItemData.CATEGORY.FATE
                ) {
                    const fateSkills = this.fateSkills;
                    // If a fate item has a list of fate skills, then that fate
                    // item is only applicable to those skills.  If the fate item
                    // has no list of skills, then the fate item is applicable
                    // to all skills.
                    if (
                        !fateSkills.length ||
                        fateSkills.includes(this.item.name)
                    ) {
                        if (it.system.$level.effective > 0) result.push(it);
                    }
                }
            }
        }
        return result;
    }

    get fateBonusItems() {
        let result = [];
        if (this.actor) {
            for (const it of this.actor.allItems()) {
                if (
                    it.system instanceof MysteryItemData &&
                    it.system.config.category ===
                        MysteryItemData.CATEGORY.FATEBONUS
                ) {
                    const skills = it.fateSkills;
                    if (!skills || skills.includes(this.item.name)) {
                        if (
                            !it.system.$charges.disabled ||
                            it.system.$charges.effective > 0
                        ) {
                            result.push(it);
                        }
                    }
                }
            }
        }
        return result;
    }

    get canImprove() {
        return (
            !this.item.isVirtual &&
            (game.user.isGM || this.item.isOwner) &&
            !this.$masteryLevel.disabled
        );
    }

    get valid() {
        return this.skillBase.valid;
    }

    get skillBase() {
        return this.$skillBase;
    }

    get sdrIncr() {
        return 1;
    }

    get defaultAction() {
        return SuccessTestResult.TEST.SKILL;
    }

    getIntrinsicActions(_data = this, defaultAction = null, actions = []) {
        return super.getIntrinsicActions(
            _data,
            defaultAction,
            Utility.uniqueActions(
                actions,
                [
                    SuccessTestResult.TEST.SKILL,
                    SuccessTestResult.TEST.SETIMPROVEFLAG,
                    SuccessTestResult.TEST.UNSETIMPROVEFLAG,
                    SuccessTestResult.TEST.IMPROVESDR,
                ].map((a) => SuccessTestResult.tests[a]),
            ),
        );
    }

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
            skillBaseFormula: new fields.StringField(),
            masteryLevelBase: new fields.NumberField({
                initial: 0,
                min: 0,
            }),
            improveFlag: new fields.BooleanField({ initial: false }),
        });
    }

    async successTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$masteryLevel);
        scope.type = `${this.item.type}-${this.item.name}-success-test`;
        scope.title = _l("{label} Test", { label: this.item.label });
        return await super.successTest(speaker, actor, token, character, scope);
    }

    /**
     * Perform an opposed test
     * @param {object} options
     * @returns {SuccessTestChatData}
     */
    async opposedTestStart(speaker, actor, token, character, scope = {}) {
        ({ speaker, actor, token, character } = SohlMacro.getExecuteDefaults({
            speaker,
            actor,
            token,
            character,
            needsToken: true,
            self: this,
        }));
        let {
            skipDialog = false,
            type = `${this.item.type}-${this.item.name}-source-opposedtest`,
            title = _l("{label} Opposed Test", { label: this.item.label }),
            targetToken,
        } = scope;

        targetToken ||= Utility.getUserTargetedToken(token);
        if (!targetToken) return null;

        if (!token) {
            ui.notifications?.warn(_l("No attacker token identified."));
            return null;
        }

        if (!token.isOwner) {
            ui.notifications?.warn(
                _l(
                    "You do not have permissions to perform this operation on {name}",
                    { name: token.name },
                ),
            );
            return null;
        }

        let sourceTestResult = new CONFIG.SuccessTestResult(
            {
                speaker,
                item: this.item,
                rollMode: game.settings.get("core", "rollMode"),
                type,
                title:
                    title ||
                    _l("{name} {label} Test", {
                        name: token?.name || actor?.name,
                        label: this.item.label,
                    }),
                situationalModifier: 0,
                mlMod: Utility.deepClone(this.$masteryLevel),
            },
            { parent: this },
        );

        sourceTestResult = await this.successTest(
            speaker,
            actor,
            token,
            character,
            {
                skipDialog,
                type,
                title,
                noChat: true,
            },
        );

        const opposedTest = new CONFIG.OpposedTestResult(
            {
                speaker,
                targetToken,
                sourceTestResult,
            },
            { parent: this },
        );

        return opposedTest.toRequestChat();
    }

    async opposedTestResume(speaker, actor, token, character, scope = {}) {
        let {
            noChat = false,
            opposedTestResult,
            testType = SuccessTestResult.TEST.SKILL,
        } = scope;

        if (!opposedTestResult) {
            throw new Error("Must supply opposedTestResult");
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
            opposedTestResult.targetTestResult = new CONFIG.SuccessTestResult(
                {
                    speaker,
                    item: this.item,
                    rollMode: game.settings.get("core", "rollMode"),
                    type: SuccessTestResult.TEST.SKILL,
                    title: _l("Opposed {label} Test", {
                        label: this.item.label,
                    }),
                    situationalModifier: 0,
                    mlMod: Utility.deepClone(this.item.system.$masteryLevel),
                },
                { parent: this },
            );

            opposedTestResult.targetTestResult = this.successTest({
                noChat: true,
                testType,
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

        let allowed = await opposedTestResult.evaluate();

        if (allowed && !noChat) {
            opposedTestResult.toChat({
                template: "systems/sohl/templates/chat/opposed-result-card.hbs",
                title: _l("Opposed Action Result"),
            });
        }

        return allowed ? opposedTestResult : false;
    }

    async improveWithSDR(speaker) {
        const updateData = { "system.improveFlag": false };
        let roll = await Roll.create(`1d100 + ${this.skillBase.value}`);
        const isSuccess = roll.total > this.$masteryLevel.base;

        if (isSuccess) {
            updateData["system.masteryLevelBase"] =
                this.masteryLevelBase + this.sdrIncr;
        }
        let prefix = _l("{subType} {label}", {
            subType: this.constructor.subTypes[this.subType],
            label: _l(this.constructor.metadata.label),
        });
        const chatTemplate =
            "systems/sohl/templates/chat/standard-test-card.hbs";
        const chatTemplateData = {
            variant: game.sohl?.id,
            type: `${this.type}-${this.name}-improve-sdr`,
            title: _l("{label} Development Roll", { label: this.item.label }),
            effTarget: this.$masteryLevel.base,
            isSuccess: isSuccess,
            rollValue: roll.total,
            rollResult: roll.result,
            showResult: true,
            resultText:
                isSuccess ?
                    _l("{prefix} Increase", { prefix })
                :   _l("No {prefix} Increase", { prefix }),
            resultDesc:
                isSuccess ?
                    _l("{label} increased by {incr} to {final}", {
                        label: this.item.label,
                        incr: this.sdrIncr,
                        final: this.$masteryLevel.base + this.sdrIncr,
                    })
                :   "",
            description:
                isSuccess ?
                    SuccessTestResult.SUCCESS_TEXT.SUCCESS
                :   SuccessTestResult.SUCCESS_TEXT.FAILURE,
            notes: "",
            sdrIncr: this.sdrIncr,
        };

        const chatHtml = await renderTemplate(chatTemplate, chatTemplateData);

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

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$boosts = 0;
        this.$masteryLevel = new CONFIG.MasteryLevelModifier(
            {
                properties: {
                    fate: new CONFIG.MasteryLevelModifier({}, { parent: this }),
                },
            },
            { parent: this },
        );
        this.$masteryLevel.setBase(this.masteryLevelBase);
        if (this.actor) {
            const fateSetting = game.settings.get("sohl", "optionFate");

            if (fateSetting === "everyone") {
                this.$masteryLevel.fate.setBase(50);
            } else if (fateSetting === "pconly") {
                if (this.actor.hasPlayerOwner) {
                    this.$masteryLevel.fate.setBase(50);
                } else {
                    this.$masteryLevel.fate.disabled = game.sohl?.MOD.NoFateNPC;
                }
            } else {
                this.$masteryLevel.fate.disabled =
                    game.sohl?.MOD.NoFateSettings;
            }
        }
        this.$skillBase ||= new SkillBase(this.skillBaseFormula, {
            items: this.actor?.items,
        });
    }

    processSiblings() {
        super.processSiblings();
        this.$skillBase.setAttributes(this.actor.allItems());

        if (this.$masteryLevel.base > 0) {
            let newML = this.$masteryLevel.base;

            for (let i = 0; i < this.boosts; i++) {
                newML += this.constructor.calcMasteryBoost(newML);
            }

            this.$masteryLevel.setBase(newML);
        }

        // Ensure base ML is not greater than MaxML
        if (this.$masteryLevel.base > this.$masteryLevel.max) {
            this.$masteryLevel.setBase(this.$masteryLevel.max);
        }

        if (this.skillBase.attributes.includes("Aura")) {
            // Any skill that has Aura in its SB formula cannot use fate
            this.$masteryLevel.fate.disabled = game.sohl?.MOD.NoFateAura;
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        if (this.$masteryLevel.disabled) {
            this.$masteryLevel.fate.disabled =
                game.sohl?.MOD.MasteryLevelDisabled;
        }
        if (!this.$masteryLevel.fate.disabled) {
            const fate = this.actor.getTraitByAbbrev("fate");
            if (fate) {
                this.$masteryLevel.fate.addVM(fate.system.$score, {
                    includeBase: true,
                });
            } else {
                this.$masteryLevel.fate.setBase(50);
            }

            this.fateBonusItems.forEach((it) => {
                this.$masteryLevel.fate.add(
                    game.sohl?.MOD.FateBonus,
                    it.system.$level.effective,
                    { skill: it.label },
                );
            });
            if (!this.availableFate.length) {
                this.$masteryLevel.fate.disabled =
                    game.sohl?.MOD.NoFateAvailable;
            }
        }
    }
}
