/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />

// ✅ Import document classes from generated types
import type { SohlActor } from "@generated/common/actor/SohlActor.mjs";
import type { SohlActorSheet } from "@generated/common/actor/SohlActorSheet.mjs";

// ✅ Import data models from generated types
import type { AnimateEntityActorData } from "@generated/common/actor/datamodel/AnimateEntityActorData.mjs";
import type { InanimateObjectActorData } from "@generated/common/actor/datamodel/InanimateObjectActorData.mjs";
import type { SohlActorData } from "@generated/common/actor/datamodel/SohlActorData.mjs";

// ✅ Import logic classes from generated types
import type { AnimateEntityLogic } from "@generated/logic/actor/AnimateEntityLogic.mjs";
import type { InanimateObjectLogic } from "@generated/logic/actor/InanimateObjectLogic.mjs";
import type { SohlActorLogic } from "@generated/logic/actor/SohlActorLogic.mjs";

declare global {
    /**
     * Override Foundry's document class config for Actor
     */
    interface DocumentClassConfig {
        Actor: typeof SohlActor;
    }

    /**
     * Override Foundry's sheet config for Actor
     */
    interface DocumentSheetConfig {
        Actor: typeof SohlActorSheet;
    }

    /**
     * Include actor data models in the system registry
     */
    interface ActorSystemData {
        AnimateEntityActorData: AnimateEntityActorData;
        InanimateObjectActorData: InanimateObjectActorData;
        SohlActorData: SohlActorData;
    }

    /**
     * Extend the `sohl.game` object to include actor-related classes
     */
    var sohl: typeof sohl & {
        game: typeof sohl.game & {
            actor: {
                documentClass: typeof SohlActor;
                documentClasses: ActorSystemData;
                sheet: {
                    SohlActorSheet: typeof SohlActorSheet;
                };
            };
        };
        logic: {
            AnimateEntityLogic: typeof AnimateEntityLogic;
            InanimateObjectLogic: typeof InanimateObjectLogic;
            SohlActorLogic: typeof SohlActorLogic;
        };
    };

    namespace CONFIG {
        interface Actor {
            macros: Record<string, Macro | undefined>;
        }
    }
}

export {};
