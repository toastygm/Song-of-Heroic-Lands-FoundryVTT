declare global {
    interface DocumentClassConfig {
        Actor: typeof import("@module/foundry/sohl-actor.mjs").SohlActor;
        Item: typeof import("@module/foundry/sohl-item.mjs").SohlItem;
        Macro: typeof import("@module/foundry/sohl-macro.mjs").SohlMacro;
        ActiveEffect: typeof import("@module/foundry/sohl-effect.mjs").SohlActiveEffect;
        JournalEntry: typeof import("@module/foundry/sohl-journal.mjs").SohlJournalEntry;
    }
}

export {};
