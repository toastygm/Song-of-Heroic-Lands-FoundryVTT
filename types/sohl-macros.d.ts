// types/sohl-macros.d.ts
/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />

// ✅ Import the document, sheet, and logic class for Macros
import type { SohlMacro } from "@generated/foundry/SohlMacro.mjs";
import type { SohlMacroConfig } from "@generated/foundry/SohlMacroConfig.mjs";
import type { MacroLogic } from "@generated/logic/macro/MacroLogic.mjs";

declare global {
    /**
     * Extend the global CONFIG to reference the SohlMacro document class.
     */
    interface DocumentClassConfig {
        Macro: typeof SohlMacro;
    }

    /**
     * Extend the global CONFIG to reference the SohlMacroConfig sheet class.
     */
    interface DocumentSheetConfig {
        Macro: typeof SohlMacroConfig;
    }

    /**
     * Extend the system registration under globalThis.sohl.
     */
    var sohl: typeof sohl & {
        game: typeof sohl.game & {
            macro: {
                documentClass: typeof SohlMacro;
                sheet: {
                    SohlMacroConfig: typeof SohlMacroConfig;
                };
                logic: {
                    MacroLogic: typeof MacroLogic;
                };
            };
        };
    };
}

export {};
