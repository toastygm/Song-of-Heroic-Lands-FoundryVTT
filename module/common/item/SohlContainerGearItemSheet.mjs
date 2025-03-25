import { SohlItemSheet } from "./SohlItemSheet.mjs";

/**
 * Represents the item sheet for a container gear item in the Sohl system.
 * Extends the base `SohlItemSheet` class to provide custom behavior and options.
 * @extends {SohlItemSheet}
 */
export class SohlContainerGearItemSheet extends SohlItemSheet {
    static get defaultOptions() {
        return sohl.utils.mergeObject(super.defaultOptions, {
            width: 725,
        });
    }
}
