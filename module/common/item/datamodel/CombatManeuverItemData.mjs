import { SohlItemData } from "./SohlItemData.mjs";

export class CombatManeuverItemData extends SohlItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "combatmaneuver",
                locId: "COMBATMANEUVER",
                iconCssClass: "fas fa-hand-fist",
                img: "systems/sohl/assets/icons/sparkle.svg",
                sheet: "systems/sohl/templates/item/combatmaneuver-sheet.hbs",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );
}
