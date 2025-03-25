import { SohlFunctionField } from "./SohlFunctionField.mjs";
import { GearItemData } from "./GearItemData.mjs";
import { fields } from "../sohl-common.mjs";
import { ValueModifier } from "./ValueModifier.mjs";

export class ContainerGearItemData extends GearItemData {
    $capacity;

    static STATUS = Object.freeze({
        OK: 0,
        OVER_ENCUMBERED: 1,
        OVER_MAX: 2,
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                name: "containergear",
                locId: "CONTAINERGEAR",
                iconCssClass: "fas fa-sack",
                img: "systems/sohl/assets/icons/sack.svg",
                sheet: "systems/sohl/templates/item/containergear-sheet.hbs",
                nestOnly: false,
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    static defineSchema() {
        return sohl.utils.mergeObject(super.defineSchema(), {
            maxCapacityBase: new fields.NumberField({
                integer: true,
                initial: 0,
                min: 0,
            }),
        });
    }

    /** @override */
    prepareBaseData() {
        class CapacityModifier extends ValueModifier {
            static defineSchema() {
                return sohl.utils.mergeObject(super.defineSchema(), {
                    max: new fields.NumberField({
                        initial: 0,
                        min: 0,
                    }),
                    value: new SohlFunctionField({
                        initial: (thisVM) => {
                            return Math.round(thisVM.effective * 1000) / 1000;
                        },
                    }),
                    status: new SohlFunctionField({
                        initial: (thisVM) => {
                            if (
                                thisVM.parent.totalWeight.modifier >
                                thisVM.max.effective
                            ) {
                                return this.STATUS.OVER_MAX;
                            } else {
                                return this.STATUS.OK;
                            }
                        },
                    }),
                });
            }
        }

        super.prepareBaseData();
        this.$capacity = new CapacityModifier({}, { parent: this });
        this.$capacity.max.setBase(this.maxCapacityBase);
    }

    calcContentWeight() {
        this.items.forEach((it) => {
            if (it.system instanceof GearItemData) {
                if (it.system instanceof ContainerGearItemData) {
                    it.system.calcContentWeight();
                }

                this.totalWeight.add(
                    (game.sohl?.MOD.ItemWeight.name)`${this.abbrev}Wt`,
                    it.system.totalWeight.effective,
                    { item: this.name },
                );
            }
        });
    }

    /** @override */
    postProcess() {
        super.postProcess();
        this.calcContentWeight();
    }
}
