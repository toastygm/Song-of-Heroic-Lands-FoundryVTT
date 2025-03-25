import { fields } from "../sohl-common.mjs";
import { BodyPartItemData } from "./BodyPartItemData.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class BodyZoneItemData extends SohlItemData {
    $bodyParts;

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "bodyzone",
                locId: "BODYZONE",
                iconCssClass: "fa-duotone fa-person",
                img: "systems/sohl/assets/icons/person.svg",
                sheet: "systems/sohl/templates/item/bodyzone-sheet.hbs",
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyParts = [];
    }

    processSiblings() {
        super.processSiblings();

        // Body Zone Items should never show up under the actor's "owned" items, they should always be
        // virtual items nested within an Anatomy item.  But let's just ensure that if this is not the
        // case we abandon processing immediately.
        if (this.actor && !this.item.isNested) {
            console.warn(
                `Item ${this.uuid} is a BodyZone that is not nested in an Anatomy, please correct this`,
            );
        }

        this.$bodyParts = [];
        for (const it of this.actor.allItems()) {
            if (it.system instanceof BodyPartItemData) {
                if (it.nestedIn?.id === this.id) {
                    this.$bodyParts.push(it);
                }
            }
        }
    }
}
