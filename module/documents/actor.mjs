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

  /**
   * Prepare Character type specific data
   */
    _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

    // Loop through ability scores, and add their modifiers to our sheet output.
    for (let [key, ability] of Object.entries(systemData.abilities)) {
      // Calculate the modifier using d20 rules.
      ability.mod = ability.value;
      }

    for (let [x, skill] of Object.entries(systemData.skills)) {
      // Calculate the modifier using d20 rules.
      skill.mod = skill.c;
    }
        // Для каждого навыка убеждаемся, что его значение не превышает значение связанной способности
        for (let [key, skill] of Object.entries(systemData.skills)) {
            let abilityKey = skill.ability;  // например, "will", "dex" и т.д.
            if (systemData.abilities[abilityKey]) {
                let abilityValue = systemData.abilities[abilityKey].value;
                // Если значение навыка превышает значение способности, устанавливаем его равным значению способности
                if (skill.value > abilityValue) {
                    skill.value = abilityValue;
                }
            }
        }

        // Таблица базовых значений потока для значений проводимости от 1 до 20
        const fluxTable = [
            15,  // cond = 1
            20,  // cond = 2
            25,  // cond = 3
            30,  // cond = 4
            40,  // cond = 5
            50,  // cond = 6
            60,  // cond = 7
            70,  // cond = 8
            85,  // cond = 9
            100, // cond = 10
            115, // cond = 11
            130, // cond = 12
            150, // cond = 13
            170, // cond = 14
            190, // cond = 15
            210, // cond = 16
            235, // cond = 17
            260, // cond = 18
            285, // cond = 19
            310  // cond = 20
        ];

        const condValue = systemData.abilities.cond.value || 0;  // Получаем проводимость
        const fluxBonus = systemData.flux.bonus || 0;            // Получаем бонус к потоку

        // Если значение проводимости в допустимом диапазоне (от 1 до 20), берём базовый поток из таблицы
        let baseFlux = 0;
        if (condValue >= 1 && condValue <= 20) {
            baseFlux = fluxTable[condValue - 1];
        }

        // Рассчитываем итоговое значение потока
        systemData.flux.value = baseFlux + fluxBonus;

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
