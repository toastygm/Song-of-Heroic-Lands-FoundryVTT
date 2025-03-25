import { CombatTestResult } from "../../result/CombatTestResult.mjs";
import { _l } from "../../helper/sohl-localize.mjs";
import { Utility } from "../../helper/utility.mjs";
import { fields } from "../../../sohl-common.mjs";
import { ProjectileGearItemData } from "./ProjectileGearItemData.mjs";
import { StrikeModeItemData } from "./StrikeModeItemData.mjs";

export class MissileWeaponStrikeModeItemData extends StrikeModeItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "missilestrikemode",
                locId: "MISSLESTRIKEMODE",
                iconCssClass: "fas fa-bow-arrow",
                img: "systems/sohl/assets/icons/longbow.svg",
                sheet: "systems/sohl/templates/item/missilestrikemode-sheet.hbs",
                nestOnly: true,
                group: "missile",
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            projectileType: new fields.StringField({
                initial: ProjectileGearItemData.SUBTYPE.NONE,
                required: true,
                choices: Utility.getChoicesMap(
                    ProjectileGearItemData.SUBTYPE,
                    "SOHL.PROJECTILEGEAR.SUBTYPE",
                ),
            }),
        });
    }

    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async autoCombatMissile(speaker, actor, token, character, scope = {}) {
        // TODO: Implement auto combat missile
    }

    async attackTest(speaker, actor, token, character, scope = {}) {
        scope.mlMod = Utility.deepClone(this.$attack);
        scope.testType = CombatTestResult.TEST.MISSILEATTACK;
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

    prepareBaseData() {
        super.prepareBaseData();
        this.$defense.block.disabled = game.sohl?.MOD.NoBlock;
        this.$defense.counterstrike.disabled = game.sohl?.MOD.NoCounterstrike;
    }
}
