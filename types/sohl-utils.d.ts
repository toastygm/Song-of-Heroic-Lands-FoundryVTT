// ✅ Global namespace declarations
declare global {
    /**
     * Extend the Game object with our system-specific data
     */
    interface Game {
        sohl: SohlSystem;
    }

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
}

export {};
