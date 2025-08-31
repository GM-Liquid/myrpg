/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */


export class myrpgActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === 'character') this._prepareCharacterData();
  }

  _prepareCharacterData() {
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
    // health max derives from base 20 plus bonuses
    s.health.max = this._calcHealthMax(s);
    s.health.value = Math.min(s.health.value ?? s.health.max, s.health.max);
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

  _calcHealthMax(s) {
    return (
      15 +
      this._sumArmor(s.armorList, 'itemShield') +
      (Number(s.temphealth) || 0)
    );
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
