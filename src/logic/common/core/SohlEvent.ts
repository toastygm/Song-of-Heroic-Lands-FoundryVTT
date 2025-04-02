/**
 * @file SohlEvent.ts
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
import { SohlTemporal } from "./SohlTemporal";
import { AnyLogic, SohlLogic } from "./SohlLogic"; // Ensure this path is correct
import {
    AnySohlBase,
    SohlBase,
    SohlBaseData,
    SohlBaseMetadata,
    SohlBaseOptions,
} from "./SohlBase";
import { SohlDataModel } from "@module/foundry/core/SohlDataModel";

export const enum EventTerm {
    DURATION = "duration", // Event will last for a duration
    INDEFINITE = "indefinite", // Event will last indefinitely until removed
    PERMANENT = "permanent", // Event will last permanently
}

export const enum EventActivation {
    IMMEDIATE = "immediate", // Event will be activated immediately
    DELAYED = "delayed", // Event will be activated after a delay
    SCHEDULED = "scheduled", // Event will be activated at a scheduled time
}

export const enum EventRepeat {
    NONE = "none", // Event will not repeat
    ONCE = "once", // Event will repeat once
    REPEATED = "repeated", // Event will repeat multiple times
}

export interface SohlEventData extends SohlBaseData {
    id: string;
    name: string; // Name of the event
    whenActivate: EventActivation; // when the event will be activated
    delay: number;
    activate: SohlTemporal | number; // Time when the event will be activated
    term: EventTerm; // How long the event will continue
    duration: number; // Duration of the event if term is DURATION
    expire: SohlTemporal | number; // Time when the event will expire
    repeat: EventRepeat; // How often the event will repeat
}

export interface SohlEventOptions<P extends AnyLogic>
    extends SohlBaseOptions<P & AnySohlBase> {}

// Constructor type for SohlEvent and its subclasses
export interface AnySohlEventConstructor<
    P = unknown,
    D extends SohlEventData = SohlEventData,
    O extends SohlEventOptions<P> = SohlEventOptions<P>,
    R extends SohlEvent<P, D, O> = SohlEvent<P, D, O>,
> extends Function {
    new (data: Partial<D>, options: Partial<O>): R;
}

export type AnyEvent = InstanceType<AnySohlEventConstructor>;

export type EventMap = SohlMap<string, AnyEvent>;

export type SohlEventTermType = (typeof EventTerm)[keyof typeof EventTerm];

// Base class
export abstract class SohlEvent<
    P extends AnyLogic = AnyLogic,
    D extends SohlEventData = SohlEventData,
    O extends SohlEventOptions<P> = SohlEventOptions<P>,
> extends SohlBase<P> {
    private _id!: string;
    private _name!: string; // Name of the event
    private _whenActivate!: EventActivation; // When the event will be activated
    private _delay!: number; // Delay before activation
    private _activate!: SohlTemporal; // Time when the event will be activated
    private _term!: EventTerm; // How long the event will continue
    private _duration!: number; // Duration of the event if term is DURATION
    private _expire!: SohlTemporal; // Time when the event will expire
    private _repeat!: EventRepeat; // How often the event will repeat

    protected _initialize(data: Partial<D> = {}, options: Partial<O> = {}) {
        super._initialize(data, options);
        if (!options.parent) throw new Error("Logic classes require a parent");
        this._id = data.id || sohl.utils.generateUniqueId();
        sohl.utils._inIdCache(this._id);
        this._name = data.name || "Unnamed Event";
        this._whenActivate = data.whenActivate || EventActivation.IMMEDIATE;
        this._delay = data.delay || 0;
        let activateTime: number;
        if (this._whenActivate === EventActivation.IMMEDIATE) {
            activateTime = game.time.worldTime;
        } else if (this._whenActivate === EventActivation.SCHEDULED) {
            activateTime =
                typeof data.activate === "number" ?
                    data.activate
                :   (data.activate as SohlTemporal).value;
        } else {
            activateTime = game.time.worldTime + this._delay;
        }
        this._activate = new SohlTemporal(activateTime);
        this._term = data.term || EventTerm.DURATION;
        this._duration = data.duration || 0;
        let expireTime: number;
        if (this._term === EventTerm.DURATION) {
            expireTime = this._activate.value + (this._duration ?? 0);
        } else if (this._term === EventTerm.PERMANENT) {
            expireTime = Number.MAX_SAFE_INTEGER;
        } else {
            expireTime =
                typeof data.expire === "number" ?
                    data.expire
                :   (data.expire as SohlTemporal).value;
        }
        this._expire = new SohlTemporal(expireTime);
        this._repeat = data.repeat || EventRepeat.NONE;
    }

    // Getter for the event ID
    get id(): string {
        return this._id;
    }

    get name(): string {
        return this._name;
    }

    // Getter for when the event will be activated
    get whenActivate(): EventActivation {
        return this._whenActivate;
    }

    // Getter for the delay before activation
    get delay(): number {
        return this._delay;
    }

    // Getter for the activation time
    get activate(): SohlTemporal {
        return this._activate.clone();
    }

    // Getter for the event term
    get term(): EventTerm {
        return this._term;
    }

    // Getter for the event duration
    get duration(): number {
        return this._duration;
    }

    // Getter for the expiration time
    get expire(): SohlTemporal {
        return this._expire.clone();
    }

    // Getter for the event repeat type
    get repeat(): EventRepeat {
        return this._repeat;
    }

    /**
     * Converts this SohlEvent instance into a SohlEventData object.
     * @returns A SohlEventData object representing this event.
     */
    toJSON(): D {
        return {
            ...super.toJSON(),
            id: this._id,
            name: this._name,
            whenActivate: this._whenActivate,
            delay: this._delay,
            activate: this._activate.value,
            term: this._term,
            duration: this._duration,
            expire: this._expire.value,
            repeat: this._repeat,
        } as D;
    }
}
