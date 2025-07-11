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
  _calcHealthMax(s) {
    return (
      20 +
      (Number(s.armor?.itemShield) || 0) +
      (Number(s.temphealth) || 0)
    );
  }

  _calcFlux(s) {
    return (
      (s.abilities.spi?.value ?? 0) * 10 +
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
      (Number(s.armor?.itemSpeed) || 0) +
      (Number(s.tempspeed) || 0)
    );
  }

  _calcDefPhys(s) {
    return (
      1 +
      (s.abilities.con?.value ?? 0) +
      (Number(s.armor?.itemPhys) || 0) +
      (Number(s.tempphys) || 0)
    );
  }
  _calcDefAzure(s) {
    return (
      1 +
      (s.abilities.spi?.value ?? 0) +
      (Number(s.armor?.itemAzure) || 0) +
      (Number(s.tempazure) || 0)
    );
  }
  _calcDefMent(s) {
    return (
      1 +
      (s.abilities.int?.value ?? 0) +
      (Number(s.armor?.itemMental) || 0) +
      (Number(s.tempmental) || 0)
    );
  }
}
