export class SohlCombatant extends Combatant {
    async _preCreate(createData, options, user) {
        let allowed = await super._preCreate(createData, options, user);
        if (allowed === false) return false;
        if (!createData.initiative) {
            this.updateSource({
                initiative: this.actor?.system.initiativeRank || 0,
            });
        }
    }
}
