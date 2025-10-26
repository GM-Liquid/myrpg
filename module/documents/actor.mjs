/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */


export class myrpgActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === 'character' || this.type === 'npc') this._prepareCharacterData();
  }

  _prepareCharacterData() {
    const s = this.system;
    const isCharacter = this.type === 'character';
    const isNpc = this.type === 'npc';

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

    const stress = s.stress ?? (s.stress = {});
    const calcStressMax = isNpc ? this._calcNpcStressMax : this._calcStressMax;
    stress.max = calcStressMax.call(this, s);
    const currentStress = Number(stress.value) || 0;
    stress.value = Math.clamp
      ? Math.clamp(currentStress, 0, stress.max)
      : Math.min(Math.max(currentStress, 0), stress.max);

    if (isCharacter) {
      const wounds = s.wounds ?? (s.wounds = {});
      wounds.minor = Boolean(wounds.minor);
      wounds.severe = Boolean(wounds.severe);
    } else if (isNpc && s.wounds !== undefined) {
      delete s.wounds;
    }

    s.flux.value = this._calcFlux(s);
    s.defenses = {
      physical: this._calcDefPhys(s),
      azure: this._calcDefAzure(s),
      mental: this._calcDefMent(s)
    };
  }

  /* ------------------------ Формулы ------------------------------ */
  _sumArmor(list, prop) {
    if (!Array.isArray(list)) list = Object.values(list || {});
    return list.reduce(
      (t, a) =>
        t + (a.equipped ? (Number(a[prop]) || 0) * (Number(a.quantity) || 1) : 0),
      0
    );
  }

  _calcStressMax(s) {
    const rank = Math.max(Number(s.currentRank) || 0, 0);
    const tempHealth = Math.max(Number(s.temphealth) || 0, 0);
    const forceShield = Math.max(this._sumArmor(s.armorList, 'itemShield'), 0);
    return Math.max(0, rank + 4 + tempHealth + forceShield);
  }

  _calcNpcStressMax(s) {
    const rank = Math.max(Number(s.currentRank) || 0, 0);
    const tempHealth = Math.max(Number(s.temphealth) || 0, 0);
    const forceShield = Math.max(this._sumArmor(s.armorList, 'itemShield'), 0);
    return Math.max(0, 6 + rank + tempHealth + forceShield);
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
