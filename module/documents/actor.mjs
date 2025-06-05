/**
 * Extend the base Actor document by defining a custom roll data structure which
 * is ideal for the MyRPG system.
 * @extends {Actor}
 */
import { getRankAndDie } from '../helpers/utils.mjs';

export class myrpgActor extends Actor {
    /* ------------------------ Foundry Hooks ------------------------ */
    prepareDerivedData() {
        // базовая подготовка
        super.prepareDerivedData();

        if (this.type === "character") this._prepareCharacterData();
    }

    /* ------------------------ CHARACTER ---------------------------- */
    _prepareCharacterData() {
        const s = this.system;                        // короче запись

        /* 1. Модификаторы способностей и навыков ---------------------- */
        for (const a of Object.values(s.abilities)) a.mod = a.value;

        for (const sk of Object.values(s.skills)) {
            sk.mod = sk.value;                         // если понадобится «c» – замените
            const abilVal = s.abilities[sk.ability]?.value ?? 0;
            if (sk.value > abilVal) sk.value = abilVal;
        }

        /* 2. Производные характеристики ------------------------------ */
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
    _calcSpeed(s) {
        const { rank } = getRankAndDie(s.abilities.dex?.value ?? 0);
        return 5 + rank + (Number(s.tempspeed) || 0);
    }

    _calcHealthMax(s) {
        const { rank } = getRankAndDie(s.abilities.con?.value ?? 0);
        return 5 + rank * 5 + (Number(s.temphealth) || 0);
    }

    _calcFlux(s) {
        const { rank } = getRankAndDie(s.abilities.spi?.value ?? 0);
        return rank;                                 // 1-5
    }

    _defBase(attrVal) { return Math.ceil(attrVal / 2) + 3; }

    _calcDefPhys(s) { return this._defBase(s.abilities.con?.value ?? 0) + (Number(s.armor?.itemPhys) || 0) + (Number(s.tempphys) || 0); }
    _calcDefAzure(s) { return this._defBase(s.abilities.spi?.value ?? 0) + (Number(s.armor?.itemAzure) || 0) + (Number(s.tempazure) || 0); }
    _calcDefMent(s) { return this._defBase(s.abilities.int?.value ?? 0) + (Number(s.armor?.itemMental) || 0) + (Number(s.tempmental) || 0); }
}
