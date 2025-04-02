import { BaseSystem } from "@module/logic/common/core/BaseSystem";

export class MistyIsleSystem extends BaseSystem {
    readonly id = "mistyisle";
    readonly title = "mistyisle";
    readonly INIT_MESSAGE = `___  ____     _           _____    _      
|  \\/  (_)   | |         |_   _|  | |     
| .  . |_ ___| |_ _   _    | | ___| | ___ 
| |\\/| | / __| __| | | |   | |/ __| |/ _ \\
| |  | | \\__ \\ |_| |_| |  _| |\\__ \\ |  __/
\\_|  |_/_|___/\\__|\\__, |  \\___/___/_|\\___|
                   __/ |                  
                  |___/                   
===========================================================`;

    readonly CONFIG = {
        ...BaseSystem.prototype.CONFIG,
    };
}

// Register the LegendarySystem as a variant of the SohlSystem
SohlVariant["legendary"] = MistyIsleSystem;
