import { SohlItemData } from "./SohlItemData.mjs";

export class AnatomyItemData extends SohlItemData {
    $sum;

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "anatomy",
                locId: "ANATOMY",
                iconCssClass: "fas fa-person",
                img: "systems/sohl/assets/icons/person.svg",
                sheet: "systems/sohl/templates/item/anatomy-sheet.hbs",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );
}
