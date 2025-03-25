import { CombatTestResult } from "./result/CombatTestResult.mjs";
import { _l } from "./sohl-localize.mjs";
import { SohlContextMenu } from "./SohlContextMenu.mjs";
import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";
import { StrikeModeItemData } from "./StrikeModeItemData.mjs";

export class CombatTechniqueStrikeModeItemData extends StrikeModeItemData {
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
                name: "combattechniquestrikemode",
                locId: "COMBATTECHNIQUE",
                iconCssClass: "fas fa-hand-fist",
                img: "systems/sohl/assets/icons/punch.svg",
                sheet: "systems/sohl/templates/item/combattechniquestrikemode-sheet.hbs",
                nestOnly: true,
                group: "melee",
                actions: this.genActions(this.ACTION, "COMBATTECHNIQUE"),
                effectKeys: this.genEffectKeys(
                    this.EFFECT_KEYS,
                    "COMBATTECHNIQUE",
                ),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            lengthBase: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$attack);
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

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$length = new CONFIG.ValueModifier({}, { parent: this });
        this.$length.setBase(this.lengthBase);
    }

    processSiblings() {
        super.processSiblings();
        this.$attack.addVM(this.$assocSkill.system.$masteryLevel, {
            includeBase: true,
        });
        this.$defense.block.addVM(this.$assocSkill.system.$masteryLevel, {
            includeBase: true,
        });
        this.$defense.counterstrike.addVM(
            this.$assocSkill.system.$masteryLevel,
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
