import { SOHL_VARIANTS } from "./helper/constants.mjs";
import { ImpactModifier } from "./modifier/ImpactModifier.mjs";
import { fields } from "../sohl-common.mjs";
import { ArmorGearItemData } from "./ArmorGearItemData.mjs";
import { BodyLocationItemData } from "./BodyLocationItemData.mjs";
import { SohlItemData } from "./item/datamodel/SohlItemData.mjs";
import { SubtypeMixin } from "./SubtypeMixin.mjs";

export class ProtectionItemData extends SubtypeMixin(SohlItemData) {
    $protection;
    $bodyLocations;

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "protection",
                locId: "PROTECTION",
                iconCssClass: "fas fa-shield",
                img: "systems/sohl/assets/icons/shield.svg",
                sheet: "systems/sohl/templates/item/protection-sheet.hbs",
                nestOnly: true,
                defaultSubType: SOHL_VARIANTS.legendary,
                subTypes: SOHL_VARIANTS,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get transferToActor() {
        return this.subType === game.sohl?.id && super.transferToActor;
    }

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            protectionBase: new fields.SchemaField({
                [ImpactModifier.ASPECT.BLUNT]: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                [ImpactModifier.ASPECT.EDGED]: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                [ImpactModifier.ASPECT.PIERCING]: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                [ImpactModifier.ASPECT.FIRE]: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$bodyLocations = [];
        this.$protection = Object.fromEntries(
            Object.keys(this.protectionBase).map((k) => [
                k,
                new CONFIG.ValueModifier({}, { parent: this }).setBase(
                    this.protectionBase[k],
                ),
            ]),
        );
    }

    processSiblings() {
        super.processSiblings();
        if (!this.item.nestedIn || this.subType !== game.sohl?.id) return;

        let armorGearData = null;
        if (
            this.item.nestedIn.system instanceof ArmorGearItemData &&
            this.item.nestedIn.system.isEquipped
        ) {
            armorGearData = this.item.nestedIn.system;
            this.$bodyLocations = this.actor.itemTypes[
                BodyLocationItemData.TYPE_NAME
            ].filter(
                (i) =>
                    armorGearData.locations.flexible.includes(i.name) ||
                    armorGearData.locations.rigid.includes(i.name),
            );
        } else if (this.item.nestedIn.system instanceof BodyLocationItemData) {
            this.$bodyLocations.push(this.item.nestedIn);
        }

        this.$bodyLocations.forEach((bl) => {
            const blData = bl.system;
            Object.keys(this.$protection).forEach((aspect) => {
                if (this.$protection[aspect].effective)
                    blData.$protection[aspect]?.add(
                        game.sohl?.MOD.ArmorProtection,
                        this.$protection[aspect].effective,
                        { source: this.item.name, abbrev: this.abbrev },
                    );
            });

            if (armorGearData) {
                // if a material has been specified, add it to the layers
                if (armorGearData.material) {
                    if (blData.$layers) blData.$layers += ",";
                    blData.$layers += armorGearData.material;
                }

                // If any of the armor is rigid, then flag the whole bodylocation as rigid.
                blData.$traits.isRigid ||=
                    armorGearData.locations.rigid.includes(bl.name);
            }
        });
    }
}
