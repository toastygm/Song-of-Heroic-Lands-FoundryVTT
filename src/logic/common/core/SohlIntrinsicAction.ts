/**
 * @file SohlIntrinsicAction.ts
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
import { SohlEvent } from "./SohlEvent";
import { AnyLogic } from "./SohlLogic";
import { RegisterClass, SohlBaseMetadata } from "./SohlBase";
import { SohlActionData, SohlActionOptions } from "./SohlAction";

export interface SohlIntrinsicActionData extends SohlActionData {
    functionName: string;
}

export interface SohlIntrinsicActionOptions
    extends SohlActionOptions<AnyLogic> {}

export type IntrinsicActionMap = SohlMap<string, SohlIntrinsicAction>;

@RegisterClass
export class SohlIntrinsicAction extends SohlEvent<
    AnyLogic,
    SohlIntrinsicActionData,
    SohlIntrinsicActionOptions
> {
    static readonly metadata: SohlBaseMetadata = {
        ...super.metadata,
        name: "SohlIntrinsicAction",
        schemaVersion: "0.6.0",
    } as const;

    private _functionName!: string;

    protected _initialize(
        data: Partial<SohlIntrinsicActionData> = {},
        options: Partial<SohlIntrinsicActionOptions> = {},
    ) {
        if (!data.functionName) {
            throw new Error("Intrinsic Action must have a function name.");
        }
        super._initialize(data, options);
        this._functionName = data.functionName;
    }

    /**
     * Converts this SohlAction instance into a SohlActionData object.
     * @returns A SohlActionData object representing this event.
     */
    toJSON(): SohlIntrinsicActionData {
        return {
            ...super.toJSON(),
            functionName: this._functionName,
        } as SohlIntrinsicActionData;
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
        data: Partial<SohlIntrinsicActionData>,
        options: Partial<SohlIntrinsicActionOptions>,
    ): SohlIntrinsicAction {
        data.class = data.class || this.metadata.name;
        data.schemaVersion = data.schemaVersion || this.metadata.schemaVersion;
        const instance = this.fromData(data, options) as SohlIntrinsicAction;
        // Parent is a SohlLogic subclass instance
        (instance.parent as AnyLogic).addAction(instance);
        return instance;
    }
}
