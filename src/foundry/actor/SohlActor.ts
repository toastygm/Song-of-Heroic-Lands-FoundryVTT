/**
 * @file SohlActor.ts
 * @project Song of Heroic Lands (SoHL)
 * @module foundry.actor
 * @author Tom Rodriguez aka "Toasty" <toasty@heroiclands.com>
 * @contact Email: toasty@heroiclands.com
 * @contact Join the SoHL Discord: https://bit.ly/44vZ10j
 * @license CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/)
 * @copyright (c) 2025 Tom Rodriguez
 *
 * This file is part of the Song of Heroic Lands system for Foundry VTT.
 * This work is licensed under the Creative Commons Attribution-
 * ShareAlike 4.0 International License. See the LICENSE.md file in the project
 * root for more details.
 *
 * Permission is granted to share, remix, and distribute this work under
 * the terms of the Creative Commons Attribution-ShareAlike 4.0 International
 * License. You must provide appropriate credit, indicate if changes were made,
 * and distribute your contributions under the same license.
 *
 * @description
 * Brief description of what this file does and its role in the system.
 */

import {
    SohlLogic,
    LogicMap,
    AnyLogic,
} from "@module/logic/common/core/SohlLogic";
import {
    ActionMap,
    AnyAction,
    SohlAction,
} from "@module/logic/common/core/SohlAction";
import { Itr } from "@module/utils/Itr";
import { SohlMap } from "@module/utils/SohlMap";
import Actor from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/documents/actor.mjs";
import { EffectMap, SohlEffect } from "@module/logic/common/core/SohlEffect";
export class SohlActor extends Actor {
    private _logics!: LogicMap;
    private _actions!: ActionMap;
    private _effects!: EffectMap;

    prepareBaseData() {
        // this is ugly, but typescript doesn't recognize "super.prepareBaseData()" as a function
        // even though it is defined in the ClientDocumentMixin class. Since we are certain that
        // this method is defined, we simply cast this to any to call the function in Actor.
        (Object.getPrototypeOf(this) as any).prepareBaseData.call(this);
        this._logics = new SohlMap();
        this._actions = new SohlMap();
    }

    get logics(): Itr<[string, AnyLogic]> {
        return this._logics.entries();
    }

    addLogic(name: string, logic: AnyLogic): void {
        if (this._logics.has(name)) return;
        sohl.utils._inIdCache(logic.id);
        this._logics.set(name, logic);
    }

    get effects(): Itr<[string, SohlEffect]> {
        return this._effects.entries();
    }

    addEffect(name: string, effect: SohlEffect): void {
        if (this._effects.has(name)) return;
        sohl.utils._inIdCache(effect.id);
        this._effects.set(name, effect);
    }

    get actions(): Itr<[string, AnyAction]> {
        return this._actions.entries();
    }

    addAction(name: string, action: AnyAction): void {
        if (this._actions.has(name)) return;
        sohl.utils._inIdCache(action.id);
        this._actions.set(name, action);
    }
}
