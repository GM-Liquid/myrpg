/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
function getRankAndDie(val) {
    const rank = Math.floor((val - 1) / 4) + 1;          // 1..5
    const die = [4, 6, 8, 10, 12][rank - 1];
    return { rank, die };
}

export class myrpgActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**@override*/
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.myrpg || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

    _prepareCharacterData(actorData) {
        if (actorData.type !== "character") return;

        const systemData = actorData.system;

        // Вычисляем модификаторы способностей и навыков, а также корректируем значения навыков.
        this._calculateAbilityMods(systemData);
        this._calculateSkillMods(systemData);

        // Производные характеристики
        systemData.health.max = this._calculateHealthMax(systemData);
        if (!systemData.health.value || systemData.health.value > systemData.health.max) {
            systemData.health.value = systemData.health.max;
        }

        // Производные: Поток, КД, Стойкость и Скорость
        systemData.flux.value = this._calculateFlux(systemData);
 //       systemData.armor.result = this._calculateArmor(systemData);
//        systemData.steadfast.result = this._calculateSteadfast(systemData);
        systemData.speed.value = this._calculateSpeed(systemData);
        systemData.defenses = {
            physical: this._calculatePhysicalDefense(systemData),
            azure: this._calculateAzureDefense(systemData),
            mental: this._calculateMentalDefense(systemData)
        };
    }

    /*-------------------------------------------
      Новые приватные методы для расчётов
    --------------------------------------------*/

    // Вычисление модификаторов способностей
    _calculateAbilityMods(systemData) {
        for (let [key, ability] of Object.entries(systemData.abilities)) {
            ability.mod = ability.value;
        }
    }

    // Вычисление модификаторов навыков и проверка их значений
    _calculateSkillMods(systemData) {
        for (let [x, skill] of Object.entries(systemData.skills)) {
            // Устанавливаем модификатор, предполагая наличие свойства c
            skill.mod = skill.c;
            // Если навык связан с характеристикой – проверяем, чтобы его значение не превышало значение характеристики
            if (systemData.abilities[skill.ability]) {
                const abilityValue = systemData.abilities[skill.ability].value;
                if (skill.value > abilityValue) {
                    skill.value = abilityValue;
                }
            }
        }
    }

    // Расчёт максимального ОЗ по новой формуле
    _calculateHealthMax(systemData) {
        const { rank: conRank } = getRankAndDie(systemData.abilities.con.value);
        const temp = Number(systemData.temphealth) || 0;
        return 5 + conRank * 5 + temp;
    }

    // Расчёт Потока по новой таблице проводимости 1–20
    _calculateFlux(systemData) {
        const spirit = systemData.abilities.spi.value;
        return getRankAndDie(spirit).rank;   // Поток = ранг Духа (1‑5)
    }

    _calculatePhysicalDefense(systemData) {
        const base = Math.ceil(systemData.abilities.con.value / 2) + 3;
        const armor = Number(systemData.armor?.itemPhys) || 0;
        const temp = Number(systemData.tempphys) || 0;
        return base + armor + temp;
    }

    /* Азур-защита = ⌈Дух / 2⌉ + 3 + бонусы (исправлен spi) */
    _calculateAzureDefense(systemData) {
        const base = Math.ceil(systemData.abilities.spi.value / 2) + 3;
        const armor = Number(systemData.armor?.itemAzure) || 0;
        const temp = Number(systemData.tempazure) || 0;
        return base + armor + temp;
    }

    /* Ментал защита = ⌈Разум / 2⌉ + 3 + бонусы */
    _calculateMentalDefense(systemData) {
        const base = Math.ceil(systemData.abilities.int.value / 2) + 3;
        const armor = Number(systemData.armor?.itemMental) || 0;
        const temp = Number(systemData.tempmental) || 0;
        return base + armor + temp;
    }

    // Расчёт КД (Armor)
    _calculateArmor(systemData) {
        // Если навыка нет — получим undefined, ?.value вернёт undefined, а Number(undefined)||0 даст 0
        const base = Number(systemData.skills.vynoslivost?.value) || 0;
        const tempBonus = Number(systemData.temparmor) || 0;
        const armorItem = Number(systemData.armor.itemAC) || 0;
        return base + tempBonus + armorItem;
    }

    // Расчёт Скорости
    _calculateSpeed(systemData) {
        const { rank: dexRank } = getRankAndDie(systemData.abilities.dex.value);
        const temp = Number(systemData.tempspeed) || 0;
        return 5 + dexRank + temp;
    }


  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
      const systemData = actorData.system;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with `this.system`
    const data = { ...super.getRollData() };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
      }

      if (data.skills) {
          for (let [x, c] of Object.entries(data.skills)) {
              let skillData = foundry.utils.deepClone(c);
              // Если значение пустое, обрабатываем его как 0
              if (skillData.value === "" || skillData.value === null || skillData.value === undefined) {
                  skillData.value = 0;
              } else {
                  skillData.value = parseInt(skillData.value, 10) || 0;
              }
              data[x] = skillData;
          }
      }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
      }

      if (data.attributes.level) {
          data.lvl = data.attributes.level.c ?? 0;
      }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }
}
