/**
 * @file ValueModifier.ts
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
import { ValueDeltaData } from "./ValueDelta";
import { SohlBaseMetadata } from "./SohlBase";
import {
    BaseModifier,
    BaseModifierData,
    BaseModifierOptions,
} from "./BaseModifier";

export interface ValueModifierData extends BaseModifierData {
    disabledReason: string;
    baseValue: number;
    customFunction: Function;
    deltas: ValueDeltaData[];
}

export type ValueModifierMap = SohlMap<string, ValueModifier>;

/**
 * Represents a value and its modifying deltas.
 */
export class ValueModifier extends BaseModifier<ValueModifierData> {
    static readonly metadata: SohlBaseMetadata = {
        name: "ValueModifier",
        schemaVersion: "0.6.0",
    } as const;

    protected _initialize(
        data: Partial<ValueModifierData> = {},
        options: Partial<BaseModifierOptions> = {},
    ): void {
        super._initialize(data, options);
    }

    toJSON(): ValueModifierData {
        return {
            ...super.toJSON(),
        };
    }
}
