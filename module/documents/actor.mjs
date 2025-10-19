/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */


export class myrpgActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === 'character') this._prepareCharacterData();
    else if (this.type === 'npc') this._prepareNpcData();
  }

  _prepareSharedActorData() {
    const s = this.system;

    /* 1. Способности ---------------------------------------------- */
    for (const a of Object.values(s.abilities)) {
      a.mod = a.value; // «бонус» = само значение
    }

    /* 2. Навыки ---------------------------------------------------- */
    for (const sk of Object.values(s.skills)) {
      sk.mod = sk.value;
    }

    /* 3. Производные параметры ------------------------------------ */
    s.speed.value = this._calcSpeed(s);

    return s;
  }

  _prepareCharacterData() {
    const s = this._prepareSharedActorData();
    this._applyCharacterDurability(s);
    this._finalizeCombatStats(s);
  }

  _prepareNpcData() {
    const s = this._prepareSharedActorData();
    this._applyNpcDurability(s);
    this._finalizeCombatStats(s);
  }

  _applyCharacterDurability(s) {
    const stress = s.stress ?? (s.stress = {});
    stress.max = this._calcCharacterStressMax(s);
    const currentStress = Number(stress.value) || 0;
    stress.value = Math.clamp
      ? Math.clamp(currentStress, 0, stress.max)
      : Math.min(Math.max(currentStress, 0), stress.max);

    const wounds = s.wounds ?? (s.wounds = {});
    wounds.minor = Boolean(wounds.minor);
    wounds.severe = Boolean(wounds.severe);
  }

  _applyNpcDurability(s) {
    const stress = s.stress ?? (s.stress = {});
    stress.max = this._calcNpcStressMax(s);
    const currentStress = Number(stress.value) || 0;
    stress.value = Math.clamp
      ? Math.clamp(currentStress, 0, stress.max)
      : Math.min(Math.max(currentStress, 0), stress.max);
    if ('wounds' in s) delete s.wounds;
  }

  _finalizeCombatStats(s) {
    s.flux.value = this._calcFlux(s);
    s.defenses = {
      physical: this._calcDefPhys(s),
      azure: this._calcDefAzure(s),
      mental: this._calcDefMent(s)
    };
  }

  /* ------------------------ Р¤РѕСЂРјСѓР»С‹ ------------------------------ */
  _sumArmor(list, prop) {
    if (!Array.isArray(list)) list = Object.values(list || {});
    return list.reduce(
      (t, a) =>
        t + (a.equipped ? (Number(a[prop]) || 0) * (Number(a.quantity) || 1) : 0),
      0
    );
  }

  _calcStressMax(s) {
    return this.type === 'npc'
      ? this._calcNpcStressMax(s)
      : this._calcCharacterStressMax(s);
  }

  _calcCharacterStressMax(s) {
    const rank = Math.max(Number(s.currentRank) || 0, 0);
    const bonus = Number(s.temphealth) || 0;
    return Math.max(0, rank + 4 + bonus);
  }

  _calcNpcStressMax(s) {
    const rank = Math.max(Number(s.currentRank) || 0, 0);
    return Math.max(0, 6 + rank);
  }

  _calcFlux(s) {
    return (
      (Number(s.currentRank) || 0) * 5 +
      (Number(s.tempflux) || 0)
    );
  }

  _BonusBase(attrVal) {
    return attrVal + 1;
  }

  _calcSpeed(s) {
    return (
      5 +
      (s.abilities.con?.value ?? 0) +
      this._sumArmor(s.armorList, 'itemSpeed') +
      (Number(s.tempspeed) || 0)
    );
  }

  _calcDefPhys(s) {
    return (
      2 +
      (s.abilities.con?.value ?? 0) +
      this._sumArmor(s.armorList, 'itemPhys') +
      (Number(s.tempphys) || 0)
    );
  }
  _calcDefAzure(s) {
    return (
      2 +
      (s.abilities.spi?.value ?? 0) +
      this._sumArmor(s.armorList, 'itemAzure') +
      (Number(s.tempazure) || 0)
    );
  }
  _calcDefMent(s) {
    return (
      2 +
      (s.abilities.int?.value ?? 0) +
      this._sumArmor(s.armorList, 'itemMental') +
      (Number(s.tempmental) || 0)
    );
  }
}
