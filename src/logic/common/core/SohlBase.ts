/**
 * @file SohlBase.ts
 * @project Song of Heroic Lands (SoHL)
 * @module logic.common.core
 * @author Tom Rodriguez aka "Toasty" <toasty@heroiclands.com>
 * @contact Email: toasty@heroiclands.com
 * @contact Join the SoHL Discord: https://discord.gg/f2Qjar3Rqv
 * @license GPL-3.0 (https://www.gnu.org/licenses/gpl-3.0.html)
 * @copyright (c) 2025 Tom Rodriguez
 *
 * Permission is granted to copy, modify, and distribute this work under the
 * terms of the GNU General Public License v3.0 (GPLv3). You must provide
 * appropriate credit, state any changes made, and distribute modified versions
 * under the same license. You may not impose additional restrictions on the
 * recipients' exercise of the rights granted under this license. This is only a
 * summary of the GNU GPLv3 License. For the full terms, see the LICENSE.md
 * file in the project root or visit: https://www.gnu.org/licenses/gpl-3.0.html
 *
 * @description
 * This file defines the SohlBase class, its associated interfaces, and
 * utilities for serialization, deserialization, and dynamic subclass
 * registration. It provides a foundation for all Sohl-related
 * logic and ensures extensibility through a centralized registry.
 *
 * @see GitHub Repository: https://github.com/toastygm/Song-of-Heroic-Lands-FoundryVTT
 * @see Foundry VTT System Page: https://foundryvtt.com/packages/sohl
 */

import { SohlDataModel } from "@module/foundry/core/SohlDataModel";
import { SohlMap } from "@module/utils/SohlMap";

/**
 * Represents the base data structure for all SohlBase subclasses.
 * This interface defines the common properties that all subclasses must include.
 */
export interface SohlBaseData {
    /**
     * The name of the class to which this data belongs.
     * Used for deserialization to determine the correct constructor.
     */
    class: string;

    /**
     * The schema version of the data.
     * Used to ensure compatibility between serialized data and the class implementation.
     */
    schemaVersion: string;
}

/**
 * Represents the options that can be passed to a SohlBase subclass during instantiation.
 */
export interface SohlBaseOptions<P = unknown> {
    /**
     * The parent object of the instance, if applicable.
     */
    parent: P;
}

/**
 * Represents the constructor type for any subclass of SohlBase.
 */
export type AnySohlBaseConstructor = SohlBaseConstructor<
    SohlBase<any, SohlBaseData, SohlBaseOptions<any>>
>;

/**
 * Represents the constructor type for SohlBase and its subclasses.
 * This is used to define the structure of constructors for all subclasses.
 */
export interface SohlBaseConstructor<T extends AnySohlBase> extends Function {
    /**
     * Metadata about the class, including its name and schema version.
     */
    metadata: {
        name: string;
        schemaVersion: string;
    };

    /**
     * The constructor function for the subclass.
     * @param data - The data used to initialize the instance.
     * @param options - Additional options for the instance.
     */
    new (
        data: Partial<SohlBaseData>,
        options: Partial<SohlBaseOptions<any>>,
    ): T;
}

/**
 * Represents any subclass of SohlBase.
 * This type is used to refer to instances of any registered subclass.
 */
export type AnySohlBase = InstanceType<AnySohlBaseConstructor>;

/**
 * Represents a map of SohlBase subclass instances, keyed by a string.
 */
export type SohlBaseMap = SohlMap<string, AnySohlBase>;

export interface SohlBaseMetadata {
    name: string;
    schemaVersion: string;
}

/**
 * Represents the base class for all Sohl-related logic.
 * Provides generic methods for serialization, deserialization, and cloning.
 */
export abstract class SohlBase<
    P = unknown,
    D extends SohlBaseData = SohlBaseData,
    O extends SohlBaseOptions<P> = SohlBaseOptions<P>,
> {
    static readonly metadata: SohlBaseMetadata = {
        name: "SohlBase",
        schemaVersion: "0.6.0",
    } as const;

    protected _parent?: P;
    private _class!: string;
    private _schemaVersion!: string;

    constructor(data: Partial<D> = {}, options: Partial<O> = {}) {
        this._initialize(data, options);
    }

    protected _initialize(
        data: Partial<D> = {},
        options: Partial<O> = {},
    ): void {
        this._parent = options.parent;
        this._class = data.class || this.constructor.name;
        this._schemaVersion =
            data.schemaVersion ||
            (this.constructor as AnySohlBaseConstructor).metadata.schemaVersion;
    }

    get parent(): P {
        if (!this._parent) {
            throw new Error("Parent is not defined");
        }
        return this._parent;
    }

    get class(): string {
        return this._class;
    }

    get schemaVersion(): string {
        return this._schemaVersion;
    }

    /**
     * Converts the current instance to a plain object suitable for JSON serialization.
     * This method is generic and ensures type safety for the data being converted.
     *
     * @returns A plain object that can be JSON stringified.
     */
    toJSON(): D {
        return {
            class: this._class,
            schemaVersion: this._schemaVersion,
        } as D;
    }

    /**
     * Creates a new instance of the subclass using the provided data and options.
     * The data should be in the same format as the subclass's `toJSON` method.
     * This method is generic and ensures type safety for the data being passed.
     *
     * @param data - The data used to initialize the instance.
     * @param options - Additional options for the instance.
     * @returns A new instance of the subclass.
     */
    static fromData<
        T extends SohlBase<any, D, O>,
        P extends SohlBase<any, any, any> | SohlDataModel,
        D extends SohlBaseData = SohlBaseData,
        O extends SohlBaseOptions<P> = SohlBaseOptions<P>,
    >(data: Partial<D> = {}, options: Partial<O> = {}): T {
        if (!data.class) {
            throw new Error("Missing '_class' property in SohlBaseData.");
        }
        const constructor = sohl.classRegistry[
            data.class
        ] as AnySohlBaseConstructor;
        if (!constructor) {
            throw new Error(
                `Class '${data.class}' is not registered in SohlBaseRegistry.`,
            );
        }

        return new constructor(data, options) as T;
    }
    /**
     * Creates a deep copy of the instance of the subclass wholly independent
     * of the instance it is invoked on.
     *
     * @returns A new instance of the subclass.
     */
    clone<T extends this, D extends SohlBaseData>(data: Partial<D> = {}): T {
        const newObj = sohl.utils.mergeObject(this.toJSON(), data);
        return new (this.constructor as AnySohlBaseConstructor)(newObj, {
            parent: this._parent,
        }) as T;
    }
}

/**
 * Decorator to register subclasses of SohlBase in the SohlBaseRegistry.
 * This allows subclasses to be dynamically instantiated using the `fromJSON` method.
 *
 * @param name - The name of the subclass to register.
 * @returns A function that registers the subclass in the SohlBaseRegistry.
 */
export function RegisterClass(constructor: any) {
    sohl.classRegistry[constructor.metadata.name] = constructor;
}
