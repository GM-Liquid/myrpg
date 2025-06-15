/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

import { getRankAndDie } from '../helpers/utils.mjs';

export class myrpgActor extends Actor {
  prepareDerivedData() {
    super.prepareDerivedData();
    if (this.type === 'character') this._prepareCharacterData();
  }

  _prepareCharacterData() {
    const s = this.system;

    /* 0. Лимит значений по рангу ----------------------------------- */
    const rankLimit = (Number(s.currentRank) || 1) * 4; // 4-8-12-16-20…

    /* 1. Способности ---------------------------------------------- */
    for (const a of Object.values(s.abilities)) {
      a.value = Math.min(a.value, rankLimit); // обрезаем
      a.mod = a.value; // «бонус» = само значение
      a.die = getRankAndDie(a.value).die; // размер куба 6/8/10/12/14
    }

    /* 2. Навыки ---------------------------------------------------- */
    for (const sk of Object.values(s.skills)) {
      sk.value = Math.min(sk.value, rankLimit);
      sk.mod = sk.value;
    }

    /* 3. Производные параметры ------------------------------------ */
    s.speed.value = this._calcSpeed(s);
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
    const { rank } = getRankAndDie(s.abilities.con?.value ?? 0);
    return 10 + rank * 10 + (Number(s.temphealth) || 0);
  }

  _calcFlux(s) {
    const { rank } = getRankAndDie(s.abilities.spi?.value ?? 0);
    return rank; // 1-5
  }

  _BonusBase(attrVal) {
    return Math.ceil(attrVal / 2) + 3;
  }

  _calcSpeed(s) {
    return (
      this._BonusBase(s.abilities.dex?.value ?? 0) +
      (Number(s.armor?.itemSpeed) || 0) +
      (Number(s.tempspeed) || 0)
    );
  }

  _calcDefPhys(s) {
    return (
      this._BonusBase(s.abilities.con?.value ?? 0) +
      (Number(s.armor?.itemPhys) || 0) +
      (Number(s.tempphys) || 0)
    );
  }
  _calcDefAzure(s) {
    return (
      this._BonusBase(s.abilities.spi?.value ?? 0) +
      (Number(s.armor?.itemAzure) || 0) +
      (Number(s.tempazure) || 0)
    );
  }
  _calcDefMent(s) {
    return (
      this._BonusBase(s.abilities.int?.value ?? 0) +
      (Number(s.armor?.itemMental) || 0) +
      (Number(s.tempmental) || 0)
    );
  }
}
