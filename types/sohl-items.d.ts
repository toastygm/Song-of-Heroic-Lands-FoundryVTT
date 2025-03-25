// types/sohl-items.d.ts
/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />

// ✅ Import document and sheet classes from generated types
import type { SohlItem } from "@generated/common/item/SohlItem.mjs";
import type { SohlItemSheet } from "@generated/common/item/SohlItemSheet.mjs";

// ✅ Import all item data models
import type { AffiliationItemData } from "@generated/common/item/datamodel/AffiliationItemData.mjs";
import type { AfflictionItemData } from "@generated/common/item/datamodel/AfflictionItemData.mjs";
import type { AnatomyItemData } from "@generated/common/item/datamodel/AnatomyItemData.mjs";
import type { ArmorGearItemData } from "@generated/common/item/datamodel/ArmorGearItemData.mjs";
import type { BodyLocationItemData } from "@generated/common/item/datamodel/BodyLocationItemData.mjs";
import type { BodyPartItemData } from "@generated/common/item/datamodel/BodyPartItemData.mjs";
import type { BodyZoneItemData } from "@generated/common/item/datamodel/BodyZoneItemData.mjs";
import type { CombatManeuverItemData } from "@generated/common/item/datamodel/CombatManeuverItemData.mjs";
import type { CombatTechniqueStrikeModeItemData } from "@generated/common/item/datamodel/CombatTechniqueStrikeModeItemData.mjs";
import type { ConcoctionGearItemData } from "@generated/common/item/datamodel/ConcoctionGearItemData.mjs";
import type { ContainerGearItemData } from "@generated/common/item/datamodel/ContainerGearItemData.mjs";
import type { DomainItemData } from "@generated/common/item/datamodel/DomainItemData.mjs";
import type { EventItemData } from "@generated/common/item/datamodel/EventItemData.mjs";
import type { GearItemData } from "@generated/common/item/datamodel/GearItemData.mjs";
import type { InjuryItemData } from "@generated/common/item/datamodel/InjuryItemData.mjs";
import type { MasteryLevelItemData } from "@generated/common/item/datamodel/MasteryLevelItemData.mjs";
import type { MeleeWeaponStrikeModeItemData } from "@generated/common/item/datamodel/MeleeWeaponStrikeModeItemData.mjs";
import type { MiscGearItemData } from "@generated/common/item/datamodel/MiscGearItemData.mjs";
import type { MissileWeaponStrikeModeItemData } from "@generated/common/item/datamodel/MissileWeaponStrikeModeItemData.mjs";
import type { MysteryItemData } from "@generated/common/item/datamodel/MysteryItemData.mjs";
import type { MysticalAbilityItemData } from "@generated/common/item/datamodel/MysticalAbilityItemData.mjs";
import type { MysticalDeviceItemData } from "@generated/common/item/datamodel/MysticalDeviceItemData.mjs";
import type { PhilosophyItemData } from "@generated/common/item/datamodel/PhilosophyItemData.mjs";
import type { ProjectileGearItemData } from "@generated/common/item/datamodel/ProjectileGearItemData.mjs";
import type { ProtectionItemData } from "@generated/common/item/datamodel/ProtectionItemData.mjs";
import type { SkillItemData } from "@generated/common/item/datamodel/SkillItemData.mjs";
import type { SohlItemData } from "@generated/common/item/datamodel/SohlItemData.mjs";
import type { StrikeModeItemData } from "@generated/common/item/datamodel/StrikeModeItemData.mjs";
import type { TraitItemData } from "@generated/common/item/datamodel/TraitItemData.mjs";
import type { WeaponGearItemData } from "@generated/common/item/datamodel/WeaponGearItemData.mjs";

// ✅ Import logic classes
import type { AffiliationLogic } from "@generated/logic/item/AffiliationLogic.mjs";
import type { AfflictionLogic } from "@generated/logic/item/AfflictionLogic.mjs";
import type { AnatomyLogic } from "@generated/logic/item/AnatomyLogic.mjs";
import type { ArmorGearLogic } from "@generated/logic/item/ArmorGearLogic.mjs";
import type { BodyLocationLogic } from "@generated/logic/item/BodyLocationLogic.mjs";
import type { BodyPartLogic } from "@generated/logic/item/BodyPartLogic.mjs";
import type { BodyZoneLogic } from "@generated/logic/item/BodyZoneLogic.mjs";
import type { CombatManeuverLogic } from "@generated/logic/item/CombatManeuverLogic.mjs";
import type { CombatTechniqueStrikeModeLogic } from "@generated/logic/item/CombatTechniqueStrikeModeLogic.mjs";
import type { ConcoctionGearLogic } from "@generated/logic/item/ConcoctionGearLogic.mjs";
import type { ContainerGearLogic } from "@generated/logic/item/ContainerGearLogic.mjs";
import type { DomainLogic } from "@generated/logic/item/DomainLogic.mjs";
import type { EventLogic } from "@generated/logic/item/EventLogic.mjs";
import type { GearLogic } from "@generated/logic/item/GearLogic.mjs";
import type { InjuryLogic } from "@generated/logic/item/InjuryLogic.mjs";
import type { MasteryLevelLogic } from "@generated/logic/item/MasteryLevelLogic.mjs";
import type { MeleeWeaponStrikeModeLogic } from "@generated/logic/item/MeleeWeaponStrikeModeLogic.mjs";
import type { MiscGearLogic } from "@generated/logic/item/MiscGearLogic.mjs";
import type { MissileWeaponStrikeModeLogic } from "@generated/logic/item/MissileWeaponStrikeModeLogic.mjs";
import type { MysteryLogic } from "@generated/logic/item/MysteryLogic.mjs";
import type { MysticalAbilityLogic } from "@generated/logic/item/MysticalAbilityLogic.mjs";
import type { MysticalDeviceLogic } from "@generated/logic/item/MysticalDeviceLogic.mjs";
import type { PhilosophyLogic } from "@generated/logic/item/PhilosophyLogic.mjs";
import type { ProjectileGearLogic } from "@generated/logic/item/ProjectileGearLogic.mjs";
import type { ProtectionLogic } from "@generated/logic/item/ProtectionLogic.mjs";
import type { SkillLogic } from "@generated/logic/item/SkillLogic.mjs";
import type { SohlItemLogic } from "@generated/logic/item/SohlItemLogic.mjs";
import type { StrikeModeLogic } from "@generated/logic/item/StrikeModeLogic.mjs";
import type { TraitLogic } from "@generated/logic/item/TraitLogic.mjs";
import type { WeaponGearLogic } from "@generated/logic/item/WeaponGearLogic.mjs";

declare global {
    /**
     * Override document class config
     */
    interface DocumentClassConfig {
        Item: typeof SohlItem;
    }

    /**
     * Override sheet config
     */
    interface DocumentSheetConfig {
        Item: typeof SohlItemSheet;
    }

    /**
     * Register all item data models
     */
    interface ItemSystemData {
        AffiliationItemData: AffiliationItemData;
        AfflictionItemData: AfflictionItemData;
        AnatomyItemData: AnatomyItemData;
        ArmorGearItemData: ArmorGearItemData;
        BodyLocationItemData: BodyLocationItemData;
        BodyPartItemData: BodyPartItemData;
        BodyZoneItemData: BodyZoneItemData;
        CombatManeuverItemData: CombatManeuverItemData;
        CombatTechniqueStrikeModeItemData: CombatTechniqueStrikeModeItemData;
        ConcoctionGearItemData: ConcoctionGearItemData;
        ContainerGearItemData: ContainerGearItemData;
        DomainItemData: DomainItemData;
        EventItemData: EventItemData;
        GearItemData: GearItemData;
        InjuryItemData: InjuryItemData;
        MasteryLevelItemData: MasteryLevelItemData;
        MeleeWeaponStrikeModeItemData: MeleeWeaponStrikeModeItemData;
        MiscGearItemData: MiscGearItemData;
        MissileWeaponStrikeModeItemData: MissileWeaponStrikeModeItemData;
        MysteryItemData: MysteryItemData;
        MysticalAbilityItemData: MysticalAbilityItemData;
        MysticalDeviceItemData: MysticalDeviceItemData;
        PhilosophyItemData: PhilosophyItemData;
        ProjectileGearItemData: ProjectileGearItemData;
        ProtectionItemData: ProtectionItemData;
        SkillItemData: SkillItemData;
        SohlItemData: SohlItemData;
        StrikeModeItemData: StrikeModeItemData;
        TraitItemData: TraitItemData;
        WeaponGearItemData: WeaponGearItemData;
    }

    /**
     * Extend sohl.game with item classes
     */
    var sohl: typeof sohl & {
        game: typeof sohl.game & {
            item: {
                documentClass: typeof SohlItem;
                documentClasses: ItemSystemData;
                sheet: {
                    SohlItemSheet: typeof SohlItemSheet;
                };
                logic: {
                    AffiliationLogic: typeof AffiliationLogic;
                    AfflictionLogic: typeof AfflictionLogic;
                    AnatomyLogic: typeof AnatomyLogic;
                    ArmorGearLogic: typeof ArmorGearLogic;
                    BodyLocationLogic: typeof BodyLocationLogic;
                    BodyPartLogic: typeof BodyPartLogic;
                    BodyZoneLogic: typeof BodyZoneLogic;
                    CombatManeuverLogic: typeof CombatManeuverLogic;
                    CombatTechniqueStrikeModeLogic: typeof CombatTechniqueStrikeModeLogic;
                    ConcoctionGearLogic: typeof ConcoctionGearLogic;
                    ContainerGearLogic: typeof ContainerGearLogic;
                    DomainLogic: typeof DomainLogic;
                    EventLogic: typeof EventLogic;
                    GearLogic: typeof GearLogic;
                    InjuryLogic: typeof InjuryLogic;
                    MasteryLevelLogic: typeof MasteryLevelLogic;
                    MeleeWeaponStrikeModeLogic: typeof MeleeWeaponStrikeModeLogic;
                    MiscGearLogic: typeof MiscGearLogic;
                    MissileWeaponStrikeModeLogic: typeof MissileWeaponStrikeModeLogic;
                    MysteryLogic: typeof MysteryLogic;
                    MysticalAbilityLogic: typeof MysticalAbilityLogic;
                    MysticalDeviceLogic: typeof MysticalDeviceLogic;
                    PhilosophyLogic: typeof PhilosophyLogic;
                    ProjectileGearLogic: typeof ProjectileGearLogic;
                    ProtectionLogic: typeof ProtectionLogic;
                    SkillLogic: typeof SkillLogic;
                    SohlItemLogic: typeof SohlItemLogic;
                    StrikeModeLogic: typeof StrikeModeLogic;
                    TraitLogic: typeof TraitLogic;
                    WeaponGearLogic: typeof WeaponGearLogic;
                };
            };
        };
    };

    namespace CONFIG {
        interface Item {
            macros: Record<string, Macro | undefined>;
        }
    }
}

export {};
