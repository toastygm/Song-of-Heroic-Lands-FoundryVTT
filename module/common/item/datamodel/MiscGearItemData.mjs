import { GearItemData } from "./GearItemData.mjs";

export class MiscGearItemData extends GearItemData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "miscgear",
                locId: "MISCGEAR",
                iconCssClass: "fas fa-ball-pile",
                img: "systems/sohl/assets/icons/miscgear.svg",
                sheet: "systems/sohl/templates/item/miscgear-sheet.hbs",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );
}
