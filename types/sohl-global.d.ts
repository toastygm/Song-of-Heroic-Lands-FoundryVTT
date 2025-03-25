// Reference the Foundry VTT types
/// <reference types="@league-of-foundry-developers/foundry-vtt-types" />

// Import custom utility types
import type { MersenneTwister } from "@module/common/mersenne-twister.mjs";
import type { SohlLocalize } from "@module/common/sohl-localize.mjs";
import type { SohlUtility } from "@module/common/sohl-utility.mjs";
import * as SohlHelpers from "@module/common/sohl-helpers.mjs";

// Non-document overriden foundry classes
import type { SohlContextMenu } from "@module/foundry/sohl-context-menu.mjs";

declare global {
    // ✅ Custom utility typedefs
    export type PlainObject = Record<string, any>;
    export type UnknownObject = Record<string, unknown>;
    export type StrictObject<T> = Record<string, T>;
    export type Constructor<T = {}> = new (...args: any[]) => T;
    export type AnyFunction = (...args: any[]) => any;
    export type MaybePromise<T> = T | Promise<T>;

    /** Used for fields that may be missing or intentionally cleared */
    export type Maybe<T> = T | null | undefined;

    /** Used when a value is expected but may be null */
    export type Nullable<T> = T | null;

    /** Used for optional fields */
    export type Optional<T> = T | undefined;
    export type OptArray<T> = T[] | undefined;

    /** A type of Object that is constructed; e.g., not a plain object */
    export type ConstructedObject = object & {
        constructor: {
            name: Exclude<string, "Object">;
        };
    };

    /** JSON */
    type JSONValue =
        | string
        | number
        | boolean
        | null
        | JSONArray
        | JSONValueMap;

    interface JSONArray extends Array<JSONValue> {}

    interface JSONObject {
        [key: string]: JSONValue;
    }

    /* ============== Logic Types ==================== */

    /**
     * A minimal structural type used by Logic classes to describe the parent DataModel.
     * It must have a `parent` property which may optionally define an `update()` method,
     * like in Foundry's embedded documents.
     */
    type LogicCompatibleDataModel = {
        parent: {
            update: (data: any) => unknown;
        };
    };

    type BaseLogicOptions<TDataModel> = {
        parent?: TDataModel;
    };

    /**
     * Represents any Logic class tied to a Logic-compatible DataModel.
     */
    type AnyLogic = BaseLogic<LogicCompatibleDataModel>;

    /**
     * Represents options passed to a Logic constructor when type parameter is not statically known.
     */
    type AnyLogicOptions = BaseLogicOptions<LogicCompatibleDataModel>;

    /**
     * Extends the global `game` object to include our system data
     */
    interface Game {
        sohl: SohlSystem;
    }

    /**
     * The shape of our game system attached to `game.sohl`
     */
    interface SohlSystem {
        id: string;
        title: string;
        //        class: Record<string, ValueModifier>;
        versionsData: unknown;
        sysVer: unknown;
        registerSystemVersion: (id: string, data: unknown) => void;
        //        i18n: typeof SohlLocalize;
        //        utils: typeof SohlHelpers;
        foundry: typeof foundry;
        //        contextMenu: typeof SohlContextMenu;
        ready: boolean;
        hasSimpleCalendar: boolean;
        defaultVariant: string;
        CONFIG: unknown;
        CHARS: Record<string, string>;
        SETTINGS: unknown;
        SOHL_INIT_MESSAGE: string;
    }

    /**
     * Variants supported by the system
     */
    export type SohlVariant = "default" | "legendary" | "variantA" | "variantB";

    /**
     * Global variable for system-agnostic utilities and classes
     */
    var sohl: {
        //       utils: typeof SohlUtils;
        //     i18n: typeof SohlLocalize;
        foundry: typeof foundry;
        //   twist: MersenneTwister;
        game: {
            //   contextMenu: typeof SohlContextMenu;
        };
    };
}

// ✅ Declare any external modules used by the system
declare const SimpleCalendar: {
    Hooks: {
        Ready: string;
        // Add more hooks if needed
    };
    // Extend as needed
};

export {};
