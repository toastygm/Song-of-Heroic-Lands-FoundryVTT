import { SohlBaseShape } from "@tests/common/SohlBaseShape";

export interface SohlItemShape extends SohlBaseShape {
    isIdentified: boolean;
    rarity: string;
}
