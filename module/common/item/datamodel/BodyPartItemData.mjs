import { _l } from "./sohl-localize.mjs";
import { fields } from "../sohl-common.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { BodyLocationItemData } from "./BodyLocationItemData.mjs";
import { SohlItem } from "./SohlItem.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class BodyPartItemData extends SohlItemData {
    $heldItem;
    $bodyLocations;
    $health;

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "bodypart",
                locId: "BODYPART",
                iconCssClass: "fa-duotone fa-skeleton-ribs",
                img: "systems/sohl/assets/icons/ribcage.svg",
                sheet: "systems/sohl/templates/item/bodypart-sheet.hbs",
                nestOnly: true,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            abbrev: new fields.StringField(),
            canHoldItem: new fields.BooleanField({ initial: false }),
            heldItemId: new fields.StringField(),
        });
    }

    /** @override */
    processSiblings() {
        super.processSiblings();

        // Body Part Items should never show up under the actor's "owned" items, they should always be
        // virtual items nested within a BodyZone item.  But let's just ensure that if this is not the
        // case we abandon processing immediately.
        if (this.actor && !this.item.isNested) {
            console.warn(
                `Item ${this.uuid} is a BodyPart that is not nested in a BodyZone, please correct this`,
            );
        }

        this.$bodyLocations = [];
        for (const it of this.actor.allItems()) {
            if (it.system instanceof BodyLocationItemData) {
                if (it.cause?.id === this.id) {
                    this.$bodyLocations.push(it);
                }
            }
        }

        this.$heldItem =
            this.canHoldItem &&
            this.heldItemId &&
            this.actor.items.find((it) => it.id === this.heldItemId);

        if (this.$heldItem) {
            this.$heldItem.system.$isHeldBy.push(this.item);
        }
    }

    /** @override */
    postProcess() {
        super.postProcess();
        /*
         * Check all held items to ensure they still exist and are carried,
         * otherwise drop the item from the body part.
         */
        if (this.$heldItem?.system instanceof GearItemData) {
            if (this.$heldItem.system.isCarried) {
                this.$heldItem.system.$isHeldBy.push(this.item.id);
            } else {
                const heldItemType =
                    SohlItem.types[this.$heldItem.type].constructor.metadata
                        .label;
                ui.notifications?.warn(
                    _l("SOHL.BODYPART.NotCarriedWarning", {
                        heldItemType,
                        heldItemName: this.$heldItem.name,
                        itemName: this.item.name,
                    }),
                );
                this.update({ "system.heldItem": "" });
            }
        }
    }
}
