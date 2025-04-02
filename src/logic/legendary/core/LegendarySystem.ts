import { BaseSystem } from "@module/logic/common/core/BaseSystem";

export class LegendarySystem extends BaseSystem {
    readonly id = "legendary";
    readonly title = "Legendary";
    readonly INIT_MESSAGE = ` _                               _
    | |                             | |
    | |     ___  __ _  ___ _ __   __| | __ _ _ __ _   _
    | |    / _ \\/ _\` |/ _ \\ '_ \\ / _\` |/ _\` | '__| | | |
    | |___|  __/ (_| |  __/ | | | (_| | (_| | |  | |_| |
    \\_____/\\___|\\__, |\\___|_| |_|\\__,_|\\__,_|_|   \\__, |
                 __/ |                             __/ |
                |___/                             |___/
    ===========================================================`;

    readonly CONFIG = {
        ...BaseSystem.prototype.CONFIG,
    };
}

// Register the LegendarySystem as a variant of the SohlSystem
SohlVariant["legendary"] = LegendarySystem;
