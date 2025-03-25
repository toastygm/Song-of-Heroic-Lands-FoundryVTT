import { Utility } from "./utility.mjs";
import { fields } from "../sohl-common.mjs";
import { ProjectileGearItemData } from "./ProjectileGearItemData.mjs";
import { WeaponGearItemData } from "./WeaponGearItemData.mjs";
import { ArmorGearItemData } from "./ArmorGearItemData.mjs";
import { ContainerGearItemData } from "./ContainerGearItemData.mjs";
import { MiscGearItemData } from "./MiscGearItemData.mjs";
import { ConcoctionGearItemData } from "./ConcoctionGearItemData.mjs";
import { SohlItemData } from "./SohlItemData.mjs";

export class GearItemData extends SohlItemData {
    _totalWeight;
    $weight;
    $value;
    $quality;
    $durability;
    $isHeldBy;
    $skillItem;

    static TYPE = Object.freeze({
        MISC: MiscGearItemData.TYPE_NAME,
        CONTAINER: ContainerGearItemData.TYPE_NAME,
        ARMOR: ArmorGearItemData.TYPE_NAME,
        WEAPON: WeaponGearItemData.TYPE_NAME,
        PROJECTILE: ProjectileGearItemData.TYPE_NAME,
        CONCOCTION: ConcoctionGearItemData.TYPE_NAME,
    });

    static EFFECT_KEYS = Object.freeze({
        WEIGHT: { id: "weight", path: "system.$weight", abbrev: "Wt" },
        VALUE: { id: "value", path: "system.$value", abbrev: "Val" },
        QUALITY: { id: "quality", path: "system.$quality", abbrev: "Qal" },
        DURABILITY: {
            id: "durability",
            path: "system.$durability",
            abbrev: "Dur",
        },
    });

    /** @inheritdoc */
    static metadata = Object.freeze(
        sohl.utils.mergeObject(
            super.metadata,
            {
                locId: "GEAR",
                effectKeys: this.genEffectKeys(this.EFFECT_KEYS, "GEAR"),
                schemaVersion: "0.5.6",
            },
            { inplace: false },
        ),
    );

    get container() {
        return this.nestedIn instanceof ContainerGearItemData ?
                this.nestedIn
            :   null;
    }

    get totalWeight() {
        return this._totalWeight;
    }

    get equipped() {
        return false;
    }

    get isHeld() {
        return !!this.$isHeldBy.length;
    }

    static defineSchema() {
        return sohl.utils.mergeObject(
            super.defineSchema(),
            {
                abbrev: new fields.StringField(),
                quantity: new fields.NumberField({
                    integer: true,
                    initial: 1,
                    min: 0,
                }),
                weightBase: new fields.NumberField({
                    initial: 0,
                    min: 0,
                }),
                valueBase: new fields.NumberField({
                    initial: 0,
                    min: 0,
                }),
                isCarried: new fields.BooleanField({ initial: true }),
                isEquipped: new fields.BooleanField({ initial: false }),
                qualityBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
                durabilityBase: new fields.NumberField({
                    integer: true,
                    initial: 0,
                    min: 0,
                }),
            },
            { inplace: false },
        );
    }

    /** @override */
    prepareBaseData() {
        super.prepareBaseData();
        this.$isHeldBy = [];
        this.$skillItem = null;
        this.$value = new CONFIG.ValueModifier({}, { parent: this });
        this.$value.setBase(this.valueBase);
        this.$weight = new CONFIG.ValueModifier({}, { parent: this });
        this.$weight.setBase(this.weightBase);
        this.$quality = new CONFIG.ValueModifier({}, { parent: this });
        this.$quality.setBase(this.qualityBase);
        this.$durability = new CONFIG.ValueModifier({}, { parent: this });
        this.$durability.setBase(this.durabilityBase);
        this._totalWeight = new CONFIG.ValueModifier({}, { parent: this });

        // If the gear is inside of a container, then the "carried"
        // flag is inherited from the container.
        if (this.nestedIn) {
            this.isCarried = this.nestedIn.system.isCarried;

            // Anything in a container is unequipped automatically
            this.isEquipped = false;
        }

        this.isEquipped &&= this.isCarried;
    }

    /** @override */
    prepareDerivedData() {
        super.prepareDerivedData();
        const baseWeight =
            this.isCarried ?
                Utility.maxPrecision(this.quantity * this.$weight.effective, 2)
            :   0;
        this._totalWeight.setBase(baseWeight);

        // Add quality to durability
        if (this.$quality.effective) {
            this.$durability.add(
                GearItemData.mods.Durability.name,
                GearItemData.mods.Durability.abbrev,
                this.$quality.effective,
            );
        }
    }
}
