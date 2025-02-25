/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
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

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
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
        const systemData = actorData.system;

        // Пример: «модификаторы» способностей (если вам нужно)
        for (let [key, ability] of Object.entries(systemData.abilities)) {
            ability.mod = ability.value;
        }

        // Пример: «модификаторы» навыков (если вам нужно)
        for (let [x, skill] of Object.entries(systemData.skills)) {
            // skill.mod = skill.value; // или skill.c, если у вас действительно есть skill.c
            skill.mod = skill.c;
        }

        // Убедимся, что навыки не превышают связанную способность
        for (let [key, skill] of Object.entries(systemData.skills)) {
            const abilityKey = skill.ability;
            if (systemData.abilities[abilityKey]) {
                const abilityValue = systemData.abilities[abilityKey].value;
                if (skill.value > abilityValue) {
                    skill.value = abilityValue;
                }
            }
        }

        systemData.armor = systemData.armor || { bonus: 0, result: 0 };
        systemData.steadfast = systemData.steadfast || { bonus: 0, result: 0 };
        systemData.tension = systemData.tension || { value: 0 };

        // Класс Доспеха: armor.result = бонус + навык "vynoslivost"
        systemData.armor.result = Number(systemData.armor.bonus) + Number(systemData.skills.vynoslivost.value);

        // Стойкость: steadfast.result = бонус + навык "stoikost"
        systemData.steadfast.result = Number(systemData.steadfast.bonus) + Number(systemData.skills.stoikost.value);

        // Напряжённость: tension.max = половина здоровья (health.damage)
        systemData.tension.max = systemData.health.damage;

        // Таблица базовых значений потока (cond от 1 до 20)
        const fluxTable = [
            15, 20, 25, 30, 40, 50, 60, 70, 85, 100,
            115, 130, 150, 170, 190, 210, 235, 260, 285, 310
        ];

        const condValue = parseInt(systemData.abilities.cond.value) || 0;
        const fluxBonus = parseInt(systemData.flux.bonus) || 0;

        let baseFlux = 0;
        if (condValue >= 1 && condValue <= 20) {
            baseFlux = fluxTable[condValue - 1];
        }

        // Итоговое значение потока
        systemData.flux.value = baseFlux + fluxBonus;
        // Макс. ОЗ = 10 + 5 * (con + will)
        systemData.health.max = 10 + 5 * (systemData.abilities.con.value + systemData.abilities.will.value);

        // Если текущие ОЗ не заданы или > max, приравниваем к max
        if (!systemData.health.value || systemData.health.value > systemData.health.max) {
            systemData.health.value = systemData.health.max;
        }

        // Ранение = floor(health.max / 2)
        systemData.health.damage = Math.floor(systemData.health.max / 2);
    }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    systemData.xp = systemData.crcr * systemData.cr * 100;
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
        data[x] = foundry.utils.deepClone(c);
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
