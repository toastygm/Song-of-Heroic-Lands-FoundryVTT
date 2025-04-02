/**
 * @file SohlAction.ts
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
import { SohlEvent, SohlEventData, SohlEventOptions } from "./SohlEvent";
import { AnyLogic } from "./SohlLogic";
import { SohlBaseMetadata } from "./SohlBase";

export interface SohlActionData extends SohlEventData {
    scope: ActionScope;
    notes: string;
    description: string;
    contextIconClass: string;
    contextCondition: string;
    contextGroup: string;
}

export interface SohlActionOptions<P extends AnyLogic>
    extends SohlEventOptions<P> {}

export enum ActionScope {
    SELF = "self",
    ITEM = "item",
    ACTOR = "actor",
    OTHER = "other",
}

/** Constructor type for SohlAction and its subclasses */
export interface AnySohlActionConstructor<
    P = unknown,
    D extends SohlActionData = SohlActionData,
    O extends SohlActionOptions<P> = SohlActionOptions<P>,
    R extends SohlEvent<P, D, O> = SohlAction<P, D, O>,
> extends Function {
    new (data: Partial<D>, options: Partial<O>): R;
    metadata: SohlBaseMetadata;
    fromData(data: Partial<D>, options: Partial<O>): AnyLogic;
    create(
        this: AnySohlActionConstructor<P, D, O, R>,
        data: Partial<D>,
        options: Partial<O>,
    ): R;
}

export type AnyAction = InstanceType<AnySohlActionConstructor>;

export type ActionMap = SohlMap<string, AnyAction>;

export abstract class SohlAction<
    P extends AnyLogic,
    D extends SohlActionData = SohlActionData,
    O extends SohlActionOptions<P> = SohlActionOptions<P>,
> extends SohlEvent<P> {
    private _scope!: ActionScope;
    private _notes!: string;
    private _description!: string;
    private _contextIconClass!: string;
    private _contextCondition!: string;
    private _contextGroup!: string;

    protected _initialize(data: Partial<D> = {}, options: Partial<O> = {}) {
        super._initialize(data, options);
        this._scope = data.scope || ActionScope.SELF;
        this._notes = data.notes || "";
        this._description = data.description || "";
        this._contextIconClass = data.contextIconClass || "";
        this._contextCondition = data.contextCondition || "";
        this._contextGroup = data.contextGroup || "";
    }

    /**
     * Converts this SohlAction instance into a SohlActionData object.
     * @returns A SohlActionData object representing this event.
     */
    toJSON(): D {
        return {
            ...super.toJSON(),
            scope: this._scope,
            notes: this._notes,
            description: this._description,
            contextIconClass: this._contextIconClass,
            contextCondition: this._contextCondition,
            contextGroup: this._contextGroup,
        } as D;
    }
}
