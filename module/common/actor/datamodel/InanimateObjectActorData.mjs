import { fields } from "./sohl-common.mjs";
import { SohlActorData } from "./SohlActorData.mjs";

export class InanimateObjectActorData extends SohlActorData {
    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "object",
                locId: "OBJECT",
                iconCssClass: "fas fa-treasure-chest",
                img: "icons/svg/item-bag.svg",
                sheet: "systems/sohl/templates/actor/actor-sheet.hbs",
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                maxCapacity: new fields.NumberField({
                    integer: true,
                    initial: 0,
                }),
            },
            { inplace: false },
        );
    }

    prepareBaseData() {
        super.prepareBaseData();
        this.$isSetup = true;
    }
}
