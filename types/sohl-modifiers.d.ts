/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />

// ✅ Import document classes from generated types
import type { ValueModifier } from "@generated/common/ValueModifier.mjs";
import type { ImpactModifier } from "@module/common/modifier/ImpactModifier.mjs";
import type { MasteryLevelModifier } from "@module/common/modifier/MasteryLevelModifier.mjs";
import type { CombatModifier } from "@module/common/modifier/CombatModifier.mjs";

declare global {
    /**
     * Declare the system's custom modifier types
     */
    interface ModifierConfig {
        ValueModifier: typeof ValueModifier;
        ImpactModifier: typeof ImpactModifier;
        MasteryLevelModifier: typeof MasteryLevelModifier;
        CombatModifier: typeof CombatModifier;
    }

    /**
     * Extend the `sohl.logic` object to include modifier classes
     */
    var sohl: typeof sohl & {
        game: typeof sohl.game & {
            actor: {
                documentClass: typeof SohlActor;
                documentClasses: ActorSystemData;
                logic: {
                    AnimateEntityLogic: typeof AnimateEntityLogic;
                    InanimateObjectLogic: typeof InanimateObjectLogic;
                    SohlActorLogic: typeof SohlActorLogic;
                };
                sheet: {
                    SohlActorSheet: typeof SohlActorSheet;
                };
            };
        };
        logic: typeof sohl.logic & {
            modifiers: ModifierConfig;
        };
    };
}
