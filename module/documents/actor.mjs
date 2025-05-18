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
        if (actorData.type !== "character") return;

        const systemData = actorData.system;

        // ��������� ������������ ������������ � �������, � ����� ������������ �������� �������.
        this._calculateAbilityMods(systemData);
        this._calculateSkillMods(systemData);

        // ����������� ��������������
        systemData.health.max = this._calculateHealthMax(systemData);
        if (!systemData.health.value || systemData.health.value > systemData.health.max) {
            systemData.health.value = systemData.health.max;
        }
        systemData.tension.max = Math.floor(systemData.health.max / 2);

        // �����������: �����, ��, ��������� � ��������
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
      ����� ��������� ������ ��� ��������
    --------------------------------------------*/

    // ���������� ������������� ������������
    _calculateAbilityMods(systemData) {
        for (let [key, ability] of Object.entries(systemData.abilities)) {
            ability.mod = ability.value;
        }
    }

    // ���������� ������������� ������� � �������� �� ��������
    _calculateSkillMods(systemData) {
        for (let [x, skill] of Object.entries(systemData.skills)) {
            // ������������� �����������, ����������� ������� �������� c
            skill.mod = skill.c;
            // ���� ����� ������ � ��������������� � ���������, ����� ��� �������� �� ��������� �������� ��������������
            if (systemData.abilities[skill.ability]) {
                const abilityValue = systemData.abilities[skill.ability].value;
                if (skill.value > abilityValue) {
                    skill.value = abilityValue;
                }
            }
        }
    }

    // ������ ������������� �� �� ����� �������
    _calculateHealthMax(systemData) {
        return 10 + (systemData.abilities.will.value * 10);
    }

    // ������ ������ �� ����� ������� ������������ 1�20
    _calculateFlux(systemData) {
        const fluxTable = [
            15, 20, 25, 30, 40, 50, 60, 70, 85, 100, 115, 130, 150, 170, 190, 210, 235, 260, 285, 310        ];
        const condValue = parseInt(systemData.abilities.cond.value) || 0;
        const baseFlux = (condValue >= 1 && condValue <= 20)
            ? fluxTable[condValue - 1]
            : 0;
        return baseFlux + (Number(systemData.tempflux) || 0);
    }

    _calculatePhysicalDefense(systemData) {
        const base = systemData.abilities?.con?.value ?? 0;
        const armor = Number(systemData.armor?.itemPhys) || 0;
        const temp = Number(systemData.tempphys) || 0;
        return base + armor + temp;
    }

    _calculateAzureDefense(systemData) {
        const base = systemData.abilities?.cond?.value ?? 0;
        const armor = Number(systemData.armor?.itemAzure) || 0;
        const temp = Number(systemData.tempazure) || 0;
        return base + armor + temp;
    }

    _calculateMentalDefense(systemData) {
        const base = systemData.abilities?.int?.value ?? 0;
        const armor = Number(systemData.armor?.itemMental) || 0;
        const temp = Number(systemData.tempmental) || 0;
        return base + armor + temp;
    }

    // ������ �� (Armor)
    _calculateArmor(systemData) {
        // ���� ������ ��� � ������� undefined, ?.value ����� undefined, � Number(undefined)||0 ���� 0
        const base = Number(systemData.skills.vynoslivost?.value) || 0;
        const tempBonus = Number(systemData.temparmor) || 0;
        const armorItem = Number(systemData.armor.itemAC) || 0;
        return base + tempBonus + armorItem;
    }

    // ������ ��������� (Steadfast)
    _calculateSteadfast(systemData) {
        const base = Number(systemData.skills.stoikost?.value) || 0;
        const tempBonus = Number(systemData.tempsteadfast) || 0;
        const armorItem = Number(systemData.armor.itemSteadfast) || 0;
        return base + tempBonus + armorItem;
    }

    // ������ ��������
    _calculateSpeed(systemData) {
        return 10 + (Number(systemData.tempspeed) || 0);
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
              // ���� �������� ������, ������������ ��� ��� 0
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
