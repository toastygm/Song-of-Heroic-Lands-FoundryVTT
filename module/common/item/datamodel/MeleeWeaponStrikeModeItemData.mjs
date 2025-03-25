import { CombatTestResult } from "../../result/CombatTestResult.mjs";
import { SOHL_VARIANTS } from "../../helper/constants.mjs";
import { _l } from "../../helper/sohl-localize.mjs";
import { SohlContextMenu } from "../../helper/SohlContextMenu.mjs";
import { Utility } from "../../helper/utility.mjs";
import { WeaponGearItemData } from "./WeaponGearItemData.mjs";
import { StrikeModeItemData } from "./StrikeModeItemData.mjs";

export class MeleeWeaponStrikeModeItemData extends StrikeModeItemData {
    $length;

    static EFFECT_KEYS = Object.freeze({
        LENGTH: { id: "length", path: "system.$length", abbrev: "Len" },
    });

    static ACTION = Object.freeze({
        BLOCK: {
            id: "blockTest",
            contextIconClass: "fas fa-shield",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$defense.block.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
        },
        COUNTERSTRIKE: {
            id: "counterstrikeTest",
            contextIconClass: "fas fa-circle-half-stroke",
            contextCondition: (header) => {
                header = header instanceof HTMLElement ? header : header[0];
                const li = header.closest(".item");
                const item = fromUuidSync(li.dataset.uuid);
                return item && !item.system.$defense.counterstrike.disabled;
            },
            contextGroup: SohlContextMenu.SORT_GROUPS.ESSENTIAL,
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "meleestrikemode",
                locId: "MELEESTRIKEMODE",
                iconCssClass: "fas fa-sword",
                img: "systems/sohl/assets/icons/sword.svg",
                sheet: "systems/sohl/templates/item/meleestrikemode-sheet.hbs",
                nestOnly: true,
                group: "melee",
                actions: this.genActions(this.ACTION, "MELEESTRIKEMODE"),
                effectKeys: this.genEffectKeys(
                    this.EFFECT_KEYS,
                    "MELEESTRIKEMODE",
                ),
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async autoCombatMelee(speaker, actor, token, character, scope = {}) {
        // TODO: Implement auto combat melee
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$attack);
        scope.impactMod = Utility.deepClone(this.$impact);
        scope.testType = CombatTestResult.TEST.MELEEATTACK;
        scope.title = _l("{weapon} {strikeModeName} Melee Attack Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async blockTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$defense.block);
        scope.testType = CombatTestResult.TEST.BLOCK;
        scope.title = _l("{weapon} {strikeModeName} Block Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    async counterstrikeTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$defense.counterstrike);
        scope.impactMod = Utility.deepClone(this.$impact);
        scope.testType = CombatTestResult.TEST.COUNTERSTRIKE;
        scope.title = _l("{weapon} {strikeModeName} Counterstrike Test", {
            weapon: this.item.nestedIn.name,
            strikeModeName: this.name,
        });
        return await CONFIG.SuccessTestResult.createMacroTest(
            speaker,
            actor,
            token,
            character,
            scope,
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$length = new CONFIG.ValueModifier({}, { parent: this });

        // Length is only set if this Strike Mode is nested in a WeaponGear
        if (this.item.nestedIn instanceof WeaponGearItemData) {
            this.$length.setBase(this.item.nestedIn.system.lengthBase);
        }
    }

    processSiblings() {
        super.processSiblings();
        this.$defense.block.addVM(this.$assocSkill.system.$masteryLevel, {
            includeBase: true,
        });
        this.$defense.block.fate.addVM(
            this.$assocSkill.system.$masteryLevel.fate,
            { includeBase: true },
        );
        this.$defense.counterstrike.addVM(
            this.$assocSkill.system.$masteryLevel,
            { includeBase: true },
        );
        this.$defense.counterstrike.fate.addVM(
            this.$assocSkill.system.$masteryLevel.fate,
            { includeBase: true },
        );

        // If outnumbered, then add the outnumbered penalty to the defend "bonus" (in this case a penalty)
        if (this.outnumberedPenalty) {
            this.$defense.block.add(
                game.sohl?.MOD.Outnumbered,
                this.outnumberedPenalty,
            );
            this.$defense.counterstrike.add(
                game.sohl?.MOD.Outnumbered,
                this.outnumberedPenalty,
            );
        }
    }
}
