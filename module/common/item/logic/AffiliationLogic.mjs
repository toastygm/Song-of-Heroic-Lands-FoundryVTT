import { BaseLogic } from "@module/common/abstract/BaseLogic.mjs";

/**
 * Represents the logic for handling affiliations within the system.
 * Extends the base logic functionality and provides accessors for
 * affiliation-related properties such as society, office, title, and level.
 *
 * @extends BaseLogic
 */
export class AffiliationLogic extends BaseLogic {
    /** @inheritdoc */
    static metadata = Object.freeze({
        name: "AffiliationLogic",
        schemaVersion: "0.5.6",
    });

    /** @type {string} */
    get society() {
        return this.parent.society;
    }
    set society(value) {
        this.parent.society = value;
    }
    /** @type {string} */
    get office() {
        return this.parent.office;
    }
    set office(value) {
        this.parent.office = value;
    }
    /** @type {string} */
    get title() {
        return this.parent.title;
    }
    set title(value) {
        this.parent.title = value;
    }
    /** @type {number} */
    get level() {
        return this.parent.level;
    }
    set level(value) {
        this.parent.level = value;
    }
}
