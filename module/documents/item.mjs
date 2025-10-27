export class myrpgItem extends Item {
  /** @override */
  prepareBaseData() {
    super.prepareBaseData();
    const systemData = this.system ?? (this.system = {});

    const baseDefaults = {
      description: '',
      notes: '',
      equipped: false,
      quantity: 1,
      bonuses: {
        physical: 0,
        arcane: 0,
        mental: 0,
        shield: 0,
        speed: 0,
        attack: 0
      }
    };

    const typeDefaults = {
      ability: {
        rank: '',
        cost: '',
        effect: ''
      },
      mod: {
        slot: '',
        effect: ''
      },
      armor: {
        category: '',
        coverage: ''
      },
      weapon: {
        skill: '',
        damage: '',
        range: '',
        properties: ''
      },
      gear: {
        uses: '',
        weight: '',
        rarity: ''
      }
    };

    foundry.utils.mergeObject(systemData, baseDefaults, {
      inplace: true,
      overwrite: false
    });

    const bonuses = systemData.bonuses ?? (systemData.bonuses = {});
    foundry.utils.mergeObject(bonuses, baseDefaults.bonuses, {
      inplace: true,
      overwrite: false
    });

    const specific = typeDefaults[this.type];
    if (specific) {
      foundry.utils.mergeObject(systemData, specific, {
        inplace: true,
        overwrite: false
      });
    }
  }

  /** @override */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.debugState();
  }

  debugState() {
    console.debug('[MyRPG] Item prepared', {
      name: this.name,
      type: this.type,
      system: foundry.utils.deepClone(this.system ?? {})
    });
  }
}
