/**
 * @file SohlLogic.ts
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
 * Brief description of what this file does and its role in the system.
 *
 * @see GitHub Repository: https://github.com/toastygm/Song-of-Heroic-Lands-FoundryVTT
 * @see Foundry VTT System Page: https://foundryvtt.com/packages/sohl
 */

import { SohlMap } from "@module/utils/SohlMap";
import { SohlAction, SohlActionData, ActionMap, AnyAction } from "./SohlAction";
import { SohlEffect, SohlEffectData, EffectMap } from "./SohlEffect";
import { Itr } from "@module/utils/Itr";
import { SohlActor } from "@module/foundry/actor/SohlActor";
import { SohlItem } from "@module/foundry/item/SohlItem";
import {
    SohlLogicSchema,
    SohlDataModel,
} from "@module/foundry/core/SohlDataModel";
import {
    SohlBase,
    SohlBaseData,
    SohlBaseMetadata,
    SohlBaseOptions,
} from "./SohlBase";

export type LogicCompatibleParent = {
    parent: {
        update(data?: UnknownObject, operation?: UnknownObject): Promise<any>;
        parent:
            | LogicCompatibleParent
            | foundry.abstract.TypeDataModel<
                  SohlLogicSchema,
                  foundry.abstract.Document.Any
              >;
    };
    _nestedLogicObjs?: SohlLogicData[];
};

export interface SohlLogicData extends SohlBaseData {
    id: string;
    name: string;
    description: string;
    type: string;
    img: string;
    nestedLogicObjs: SohlLogicData[];
    nestedEffectObjs: SohlEffectData[];
    nestedActionObjs: SohlActionData[];
}

export interface SohlLogicOptions<P extends SohlLogic<any, any> | SohlDataModel>
    extends SohlBaseOptions<any> {}

export interface AnySohlLogicConstructor<T = any> extends Function {
    new (
        data: Partial<SohlLogicData>,
        options: Partial<SohlLogicOptions<any>>,
    ): T;
    metadata: SohlBaseMetadata;
    fromData(
        data: Partial<SohlLogicData>,
        options: Partial<SohlLogicOptions<any>>,
    ): AnyLogic;
}

/**
 * Represents any subclass instance of SohlLogic.
 */
export type AnyLogic = InstanceType<AnySohlLogicConstructor>;

export type LogicMap = SohlMap<string, AnyLogic>;

export abstract class SohlLogic<
    P extends SohlLogic<any, any> | SohlDataModel,
    D extends SohlLogicData = SohlLogicData,
    O extends SohlLogicOptions<P> = SohlLogicOptions<P>,
> extends SohlBase<P, D, O> {
    static readonly metadata: SohlBaseMetadata = {
        name: "SohlBase",
        schemaVersion: "0.6.0",
    } as const;

    private _id!: string;
    private _name!: string;
    private _type!: string;
    private _description!: string;
    private _img!: string;
    private _nestedLogics!: LogicMap;
    private _nestedActions!: ActionMap;
    private _nestedEffects!: EffectMap;

    protected _initialize(
        data: Partial<D> = {},
        options: Partial<O> = {},
    ): void {
        super._initialize(data, options);
        if (!options.parent) throw new Error("Logic classes require a parent");
        if (!data.name || !data.type)
            throw new Error("Logic classes require a name and type");
        this._id = data.id || sohl.utils.generateUniqueId();
        sohl.utils._inIdCache(this._id);
        this._name = data.name;
        this._type = data.type;
        this._description = data.description ?? "";
        this._img = data.img ?? "";
        const nestedLogicEntries = (data.nestedLogicObjs?.map(
            (logic: SohlLogicData) => [
                logic.id as string,
                (this.constructor as typeof SohlLogic).fromData(logic, {
                    parent: this._parent,
                }),
            ],
        ) || []) as [string, AnyLogic][];
        this._nestedLogics = new SohlMap(nestedLogicEntries);
        const nestedEffectEntries = (data.nestedEffectObjs?.map(
            (effect: SohlEffectData) => [
                effect.id as string,
                (this.constructor as typeof SohlEffect).fromData(effect, {
                    parent: this._parent,
                }),
            ],
        ) || []) as [string, SohlEffect][];
        this._nestedEffects = new SohlMap(nestedEffectEntries);
        const nestedActionEntries = (data.nestedActionObjs?.map(
            (action: SohlActionData) => [
                action.id as string,
                (this.constructor as typeof SohlAction).fromData(action, {
                    parent: this._parent,
                }),
            ],
        ) || []) as [string, AnyAction][];
        this._nestedActions = new SohlMap(nestedActionEntries);
    }

    addLogic(logic: AnyLogic): void {
        if (this._nestedLogics.has(logic._id)) return;
        sohl.utils._inIdCache(logic.id);
        this._nestedLogics.set(logic._id, logic);
    }

    deleteLogic(id: string): void {
        if (!this._nestedLogics.has(id)) return;
        this._nestedLogics.delete(id);
    }

    get nestedLogics(): Itr<[string, AnyLogic]> {
        return this._nestedLogics.entries();
    }

    addEffect(effect: SohlEffect): void {
        if (this._nestedEffects.has(effect.id)) return;
        sohl.utils._inIdCache(effect.id);
        this._nestedEffects.set(effect.id, effect);
    }

    deleteEffect(id: string): void {
        if (!this._nestedEffects.has(id)) return;
        this._nestedEffects.delete(id);
    }

    get nestedEffects(): Itr<[string, SohlEffect]> {
        return this._nestedEffects.entries();
    }

    addAction(action: AnyAction): void {
        if (this._nestedActions.has(action.id)) return;
        sohl.utils._inIdCache(action.id);
        this._nestedActions.set(action.id, action);
    }

    deleteAction(id: string): void {
        if (!this._nestedActions.has(id)) return;
        this._nestedActions.delete(id);
    }

    get nestedActions(): Itr<[string, AnyAction]> {
        return this._nestedActions.entries();
    }

    get id(): string {
        return this._id;
    }

    /**
     * Create virtual logics from the nested logic objects.
     */
    createVirtualLogics(doc: SohlActor | SohlItem): void {}

    /**
     * Prepare the base data for the logic.
     */
    prepareBaseData(): void {}

    /**
     * Process the effects of the logic.
     */
    processEffects(effects: Itr<[string, SohlEffect]>): void {}

    /**
     * Process the actions of the logic.
     */
    processActions(actions: Itr<[string, AnyAction]>): void {}

    /**
     * Process the siblings of this logic.
     */
    processSiblings(siblings: Itr<[string, AnyLogic]>): void {}

    postProcess(): void {}

    toJSON(): D {
        return {
            ...super.toJSON(),
            id: this._id,
            type: this._type,
            name: this._name,
            description: this._description,
            img: this._img,
            nestedLogicObjs: this._nestedLogics.map((logic) => logic.toJSON()),
        };
    }

    /**
     * A generic static method to create an instance of a subclass of SohlBase.
     * This method allows you to specify the type of the subclass and its data and options.
     *
     * @param data - The data used to initialize the instance.
     * @param options - Additional options for the instance.
     * @returns A new instance of the specified subclass of SohlBase.
     */
    static create<
        T extends AnyLogic,
        P extends SohlLogic<any, any> | SohlDataModel,
        D extends SohlLogicData = SohlLogicData,
        O extends SohlLogicOptions<P> = SohlLogicOptions<P>,
    >(data: Partial<D> = {}, options: Partial<O> = {}): Promise<T> {
        data.class = data.class || this.metadata.name;
        const instance = this.fromData(data, options) as AnyLogic;
        const parent = (instance as SohlBase<P>).parent;
        if (parent && Object.hasOwn(parent, "_logics")) {
            // Parent is a SohlLogic subclass instance
            instance.parent.addLogic(instance.id, instance);
            return Promise.resolve(instance);
        } else {
            // Parent is a SohlDataModel instance
            const doc = (instance.parent as SohlDataModel)?.parent;
            doc?.update({ "system.logicObjs": instance.toJSON() });
            return Promise.resolve(instance);
        }
    }

    /**
     * Updates the current instance with new data.
     * This method is generic and ensures type safety for the data being updated.
     *
     * @param data - A partial object containing the properties to update.
     */
    update<T extends this>(data: Partial<D>): T {
        const newData = sohl.utils.mergeObject(this.toJSON(), data);
        this._initialize(newData);
        return this as T;
    }

    /**
     * Deletes the current instance.
     * This method is generic and ensures that the deletion logic is consistent across subclasses.
     */
    delete(): void {
        if (Object.hasOwn(this.parent, "_logics")) {
            // Parent is a SohlLogic subclass instance
            (this.parent as AnyLogic).deleteLogic(this._id);
        } else {
            // Parent is a SohlDataModel instance, so we will delete the
            // the whole document contianing the logic, since a SohlDataModel
            // instance should always have exactly one logic object.
            const doc = this.parent?.parent;
            doc.delete();
        }
    }
}
