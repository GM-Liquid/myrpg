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
        const systemData = actorData.system;
        systemData.initiative = systemData.abilities.dex.value;
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

        systemData.health.max = 10 + 5 * (systemData.abilities.con.value + systemData.abilities.will.value) + (Number(systemData.temphealth) || 0);
        if (!systemData.health.value || systemData.health.value > systemData.health.max) {
            systemData.health.value = systemData.health.max;
        }
        systemData.health.damage = Math.floor(systemData.health.max / 2);

        // Поток (Flux)
        // Базовый поток вычисляется по таблице в зависимости от значения способности cond
        const fluxTable = [15, 20, 25, 30, 40, 50, 60, 70, 85, 100,
            115, 130, 150, 170, 190, 210, 235, 260, 285, 310];
        const condValue = parseInt(systemData.abilities.cond.value) || 0;
        let baseFlux = 0;
        if (condValue >= 1 && condValue <= 20) {
            baseFlux = fluxTable[condValue - 1];
        }
        systemData.flux.value = baseFlux + (Number(systemData.tempflux) || 0);

        // КД (Armor)
        systemData.armor.result =
            Number(systemData.skills.vynoslivost.value) +
            (Number(systemData.temparmor) || 0) +
            (Number(systemData.armor.itemAC) || 0);

        // Стойкость (Steadfast)
        systemData.steadfast.result =
            Number(systemData.skills.stoikost.value) +
            (Number(systemData.tempsteadfast) || 0) +
            (Number(systemData.armor.itemSteadfast) || 0);

        // Скорость передвижения
        systemData.speed.value = 10 + (Number(systemData.tempspeed) || 0);
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
      data.generalBonus = Number(systemData.generalBonus) || 0;
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
