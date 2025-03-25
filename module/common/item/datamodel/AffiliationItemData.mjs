//import { SohlItemData } from "@module/common/item/datamodel/SohlItemData.mjs";

//const { StringField, NumberField } = foundry.data.fields;
function mergeObject(target, source, options = {}) {
    return {};
}
/**
 * Represents the data model for an Affiliation item in the Sohl system.
 * Extends the base `SohlItemData` class and provides additional schema
 * and metadata specific to affiliations.
 *
 * @extends SohlItemData
 */
export class AffiliationItemData extends Object {
    /** @inheritdoc */
    static metadata = Object.freeze(
        mergeObject(
            super.metadata,
            {
                name: "affiliation",
                locId: "AFFILIATION",
                iconCssClass: "fa-duotone fa-people-group",
                img: "systems/sohl/assets/icons/people-group.svg",
                sheet: "systems/sohl/templates/item/affiliation-sheet.hbs",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    /** @inheritdoc */
    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                society: new StringField(),
                office: new StringField(),
                title: new StringField(),
                level: new NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
            },
            { inplace: false },
        );
    }
}
