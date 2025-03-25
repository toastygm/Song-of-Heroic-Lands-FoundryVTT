export class NestedItemSheet extends ItemSheet {
    /**
     * Updates an object with new data.
     * @param event The event triggering the update
     * @param formData The new data to update the object with
     * @returns A Promise that resolves to the updated object after the update operation is complete
     *
     * @async
     * @param {*} event
     * @param {*} formData
     * @returns {unknown}
     */
    // biome-ignore lint/correctness/noUnusedVariables: <explanation>
    async _updateObject(event, formData) {
        const newAry = sohl.utils.deepClone(this.item.system.items);
        const index = newAry.findIndex((obj) => obj._id === formData._id);
        if (index < 0) {
            newAry.push(formData);
        } else {
            sohl.utils.mergeObject(newAry[index], formData);
            newAry.splice(index, 1, formData);
        }

        return this.item.update({ "system.items": newAry });
    }
}
