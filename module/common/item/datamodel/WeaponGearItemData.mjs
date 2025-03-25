import { BodyPartItemData } from "./BodyPartItemData.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { fields } from "../../../sohl-common.mjs";

export class WeaponGearItemData extends GearItemData {
    $heldBy;
    $heldByFavoredPart;

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "weapongear",
                locId: "WEAPONGEAR",
                iconCssClass: "fas fa-sword",
                img: "systems/sohl/assets/icons/sword.svg",
                sheet: "systems/sohl/templates/item/weapongear-sheet.hbs",
                nestOnly: false,
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

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$heldBy = [];
        this.$heldByFavoredPart = false;
    }

    /** @override */
    processSiblings() {
        super.processSiblings();
        let favParts = this.actor.getTraitByAbbrev("favparts");
        favParts &&= favParts.system.textValue.split(",").map((v) => v.trim());
        this.$heldByFavoredPart = false;
        this.$heldBy = this.actor.itemTypes[BodyPartItemData.TYPE_NAME].reduce(
            (ary, it) => {
                if (it.system.heldItemId === this.item.id) {
                    ary.push(it);
                    this.$heldByFavoredPart ||= favParts.includes(it.name);
                }
                return ary;
            },
            [],
        );
    }
}
