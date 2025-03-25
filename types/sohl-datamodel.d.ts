declare global {
    /**
     * Represents a single action that can be performed from a data model or context menu.
     */
    export interface SohlAction {
        /** The name of the action */
        name: string;

        /** The function to invoke for the action */
        functionName: string;

        /** The CSS class for the context icon (Font Awesome or similar) */
        contextIconClass: string;

        /**
         * A function taking a single argument (e.g., `thisArg`) and returning a boolean,
         * OR a plain boolean indicating whether the action is available.
         */
        contextCondition: ((thisArg: any) => boolean) | boolean;

        /** The group identifier for sorting or grouping actions */
        contextGroup: string;

        /** Whether this action requires asynchronous behavior */
        useAsync: boolean;
    }

    /**
     * Represents an effect key used to bind effects to specific data paths or abbreviations.
     */
    export interface EffectKey {
        /** Unique ID for this effect key */
        id: string;

        /** Dot-separated path within the data model to apply this effect */
        path: string;

        /** A short abbreviation for display or shorthand purposes */
        abbrev: string;
    }

    /**
     * Metadata used to define the structure and capabilities of a data model.
     */
    export interface DataModelMetadata {
        /** Internal name of the data model */
        name: string;

        /** Localization key (e.g., "MYMODULE.MYDATA") used for internationalization */
        locId: string;

        /** Icon class (e.g., Font Awesome) to visually represent this data model */
        iconCssClass: string;

        /** Image URL or path representing this data model visually */
        img: string;

        /** The default sheet class (or identifier) to be used for this model */
        sheet: string;

        /** The default action associated with this model */
        defaultAction: string | null;

        /** A map of all actions available for this model */
        actions: Record<string, SohlAction>;

        /** Event hooks or handlers keyed by event name */
        events: Record<string, string>;

        /** A set of known effect keys that apply to this model */
        effectKeys: Record<string, EffectKey>;

        /** The schema version number used for migration/versioning purposes */
        schemaVersion: string;
    }
}

export {};
