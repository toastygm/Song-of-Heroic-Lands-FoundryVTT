/**
 * @file SohlEffect.ts
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
import { SohlTemporal } from "./SohlTemporal";
import { AnyLogic } from "./SohlLogic";
import { RegisterClass, SohlBaseMetadata } from "./SohlBase";

export interface SohlEffectData extends SohlEventData {}

export interface SohlEffectOptions extends SohlEventOptions<AnyLogic> {}

export enum EffectScope {
    SELF = "self",
    ITEM = "item",
    ACTOR = "actor",
    OTHER = "other",
}

export type EffectMap = SohlMap<string, SohlEffect>;

@RegisterClass
export class SohlEffect extends SohlEvent<
    AnyLogic,
    SohlEffectData,
    SohlEffectOptions
> {
    static readonly metadata: SohlBaseMetadata = {
        ...super.metadata,
        name: "SohlEffect",
        schemaVersion: "0.6.0",
    } as const;

    private _createdAt!: SohlTemporal;
    private _activateAt!: SohlTemporal;
    private _expireAt!: SohlTemporal;

    protected _initialize(
        data: Partial<SohlEffectData> = {},
        options: Partial<SohlEffectOptions> = {},
    ) {
        super._initialize(data, options);
        this._createdAt = new SohlTemporal();
        this._activateAt = new SohlTemporal();
        this._expireAt = new SohlTemporal();
    }

    /**
     * A static method to create an instance of SohlIntrinsicAction.
     *
     * @param data - The data used to initialize the instance.
     * @param options - Additional options for the instance.
     * @returns A new SohlIntrinsicAction instance.
     */
    static create(
        this: typeof SohlEvent,
        data: Partial<SohlEffectData>,
        options: Partial<SohlEffectOptions>,
    ): SohlEffect {
        data.class = data.class || this.metadata.name;
        data.schemaVersion = data.schemaVersion || this.metadata.schemaVersion;
        const instance = this.fromData(data, options) as SohlEffect;
        // Parent is a SohlLogic subclass instance
        (instance.parent as AnyLogic).addAction(instance);
        return instance;
    }
}
