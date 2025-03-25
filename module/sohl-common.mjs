/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />

import { SOHL } from "./common/helper/constants.mjs";
import { AnimateEntityActorData } from "./common/actor/datamodel/AnimateEntityActorData.mjs";
import { InanimateObjectActorData } from "./InanimateObjectActorData.mjs";
import { MeleeWeaponStrikeModeItemData } from "./common/item/datamodel/MeleeWeaponStrikeModeItemData.mjs";
import { MissileWeaponStrikeModeItemData } from "./common/item/datamodel/MissileWeaponStrikeModeItemData.mjs";
import { CombatTechniqueStrikeModeItemData } from "./common/CombatTechniqueStrikeModeItemData.mjs";
import { CombatManeuverItemData } from "./common/CombatManeuverItemData.mjs";
import { MysteryItemData } from "./common/item/datamodel/MysteryItemData.mjs";
import { MysticalAbilityItemData } from "./common/item/datamodel/MysticalAbilityItemData.mjs";
import { PhilosophyItemData } from "./common/item/datamodel/PhilosophyItemData.mjs";
import { DomainItemData } from "./common/DomainItemData.mjs";
import { InjuryItemData } from "./common/item/datamodel/InjuryItemData.mjs";
import { AfflictionItemData } from "./common/AfflictionItemData.mjs";
import { TraitItemData } from "./common/item/datamodel/TraitItemData.mjs";
import { SkillItemData } from "./common/SkillItemData.mjs";
import { AffiliationItemData } from "./common/AffiliationItemData.mjs";
import { AnatomyItemData } from "./common/AnatomyItemData.mjs";
import { BodyZoneItemData } from "./common/BodyZoneItemData.mjs";
import { BodyPartItemData } from "./common/BodyPartItemData.mjs";
import { BodyLocationItemData } from "./common/BodyLocationItemData.mjs";
import { MysticalDeviceItemData } from "./common/item/datamodel/MysticalDeviceItemData.mjs";
import { ConcoctionGearItemData } from "./common/ConcoctionGearItemData.mjs";
import { MiscGearItemData } from "./common/item/datamodel/MiscGearItemData.mjs";
import { ContainerGearItemData } from "./common/ContainerGearItemData.mjs";
import { ArmorGearItemData } from "./common/ArmorGearItemData.mjs";
import { WeaponGearItemData } from "./common/item/datamodel/WeaponGearItemData.mjs";
import { ProjectileGearItemData } from "./common/item/datamodel/ProjectileGearItemData.mjs";
import { EventItemData } from "./common/EventItemData.mjs";
import { MersenneTwister } from "./common/MersenneTwister.mjs";

/**
 * A reference to the `fields` namespace from the Foundry VTT data module.
 * This namespace contains schema field definitions used for data validation
 * and management within Foundry Virtual Tabletop.
 *
 * @namespace fields
 * @see {@link foundry.data.fields}
 */
export const fields = foundry.data.fields;

export const SohlActorDataModels = Object.freeze({
    [AnimateEntityActorData.TYPE_NAME]: AnimateEntityActorData,
    [InanimateObjectActorData.TYPE_NAME]: InanimateObjectActorData,
});

export const SohlItemDataModels = Object.freeze({
    [AffiliationItemData.TYPE_NAME]: AffiliationItemData,
    [AfflictionItemData.TYPE_NAME]: AffiliationItemData,
    [AnatomyItemData.TYPE_NAME]: AnatomyItemData,
    [ArmorGearItemData.TYPE_NAME]: ArmorGearItemData,
    [BodyLocationItemData.TYPE_NAME]: BodyLocationItemData,
    [BodyPartItemData.TYPE_NAME]: BodyPartItemData,
    [BodyZoneItemData.TYPE_NAME]: BodyZoneItemData,
    [CombatTechniqueStrikeModeItemData.TYPE_NAME]:
        CombatTechniqueStrikeModeItemData,
    [CombatManeuverItemData.TYPE_NAME]: CombatManeuverItemData,
    [ConcoctionGearItemData.TYPE_NAME]: ConcoctionGearItemData,
    [ContainerGearItemData.TYPE_NAME]: ContainerGearItemData,
    [EventItemData.TYPE_NAME]: EventItemData,
    [InjuryItemData.TYPE_NAME]: InjuryItemData,
    [MeleeWeaponStrikeModeItemData.TYPE_NAME]: MeleeWeaponStrikeModeItemData,
    [MiscGearItemData.TYPE_NAME]: MiscGearItemData,
    [MissileWeaponStrikeModeItemData.TYPE_NAME]:
        MissileWeaponStrikeModeItemData,
    [MysteryItemData.TYPE_NAME]: MysteryItemData,
    [MysticalAbilityItemData.TYPE_NAME]: MysticalAbilityItemData,
    [PhilosophyItemData.TYPE_NAME]: PhilosophyItemData,
    [DomainItemData.TYPE_NAME]: DomainItemData,
    [MysticalDeviceItemData.TYPE_NAME]: MysticalDeviceItemData,
    [ProjectileGearItemData.TYPE_NAME]: ProjectileGearItemData,
    [SkillItemData.TYPE_NAME]: SkillItemData,
    [TraitItemData.TYPE_NAME]: TraitItemData,
    [WeaponGearItemData.TYPE_NAME]: WeaponGearItemData,
});

SOHL.classes = Object.freeze({
    SohlActor,
    SohlItem,
    SohlMacro,
    SohlMacroConfig,
    SohlActiveEffect,
    SohlActiveEffectConfig,
    SkillBase,
    Utility,
    SohlActorSheet,
    SohlItemSheet,
    NestedItemSheet,
    ValueModifier,
    ImpactModifier,
    MasteryLevelModifier,
    CombatModifier,
    SuccessTestResult,
    OpposedTestResult,
    CombatTestResult,
    ImpactResult,
});
