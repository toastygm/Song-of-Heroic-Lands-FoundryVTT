import type { SohlActiveEffect } from "@module/foundry/sohl-effect.mjs";
import type { SohlEffectConfig } from "@module/foundry/sohl-effect-config.mjs";
import type { ActiveEffectData } from "@module/common/active/datamodel/ActiveEffectData.mjs";

// Logic model (optional placeholder for business logic)
import type { SohlEffectLogic } from "@module/logic/effect/SohlEffectLogic.mjs";

declare global {
    interface EffectSystemData {
        ActiveEffectData: ActiveEffectData;
    }

    interface DocumentClassConfig {
        ActiveEffect: typeof SohlActiveEffect;
    }

    interface DocumentSheetConfig {
        ActiveEffect: typeof SohlEffectConfig;
    }

    var sohl: typeof sohl & {
        game: typeof sohl.game & {
            effect: {
                documentClass: typeof SohlActiveEffect;
                sheetClass: typeof SohlEffectConfig;
                dataModel: {
                    ActiveEffectData: typeof ActiveEffectData;
                };
                logic?: {
                    SohlEffectLogic: typeof SohlEffectLogic;
                };
            };
        };
    };
}

export {};
