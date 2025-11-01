import { debugLog } from '../config.mjs';

const BASE_DEFAULTS = {
  description: '',
  rank: '',
  equipped: false
};

const TYPE_DEFAULTS = {
  cartridge: {
    rank: '',
    runeType: 'Spell',
    skill: '',
    skillBonus: 0
  },
  implant: {
    rank: '',
    skill: '',
    skillBonus: 0
  },
  armor: {
    quantity: 1,
    rank: '',
    itemPhys: 0,
    itemAzure: 0,
    itemMental: 0,
    itemShield: 0,
    itemSpeed: 0
  },
  weapon: {
    quantity: 1,
    rank: '',
    skill: '',
    skillBonus: 0
  },
  gear: {
    quantity: 1,
    rank: ''
  }
};

function cloneDefaults(data) {
  return foundry.utils.deepClone(data);
}

export class MyRPGItem extends Item {
  prepareBaseData() {
    super.prepareBaseData();
    this._applyTypeDefaults();
  }

  _applyTypeDefaults() {
    const systemData = this.system ?? (this.system = {});
    foundry.utils.mergeObject(systemData, cloneDefaults(BASE_DEFAULTS), {
      insertKeys: true,
      overwrite: false,
      inplace: true
    });

    const typeDefaults = TYPE_DEFAULTS[this.type];
    if (!typeDefaults) return;
    foundry.utils.mergeObject(systemData, cloneDefaults(typeDefaults), {
      insertKeys: true,
      overwrite: false,
      inplace: true
    });
  }

  get isCartridge() {
    return this.type === 'cartridge';
  }

  get isImplant() {
    return this.type === 'implant';
  }

  get isAbility() {
    return this.isCartridge;
  }

  get isMod() {
    return this.isImplant;
  }

  get isArmor() {
    return this.type === 'armor';
  }

  get isWeapon() {
    return this.type === 'weapon';
  }

  get isGear() {
    return this.type === 'gear';
  }

  get description() {
    return String(this.system.description ?? '');
  }

  get quantity() {
    return Number(this.system.quantity ?? 1);
  }

  get isEquipped() {
    return Boolean(this.system.equipped);
  }

  get cartridgeData() {
    if (!this.isCartridge) return undefined;
    const { rank = '', runeType = 'Spell', skill = '', skillBonus = 0 } = this.system;
    return {
      rank: String(rank ?? ''),
      runeType: String(runeType ?? 'Spell'),
      skill: String(skill ?? ''),
      skillBonus: Number(skillBonus ?? 0) || 0
    };
  }

  get implantData() {
    if (!this.isImplant) return undefined;
    const { rank = '', skill = '', skillBonus = 0 } = this.system;
    return {
      rank: String(rank ?? ''),
      skill: String(skill ?? ''),
      skillBonus: Number(skillBonus ?? 0) || 0
    };
  }

  get abilityData() {
    return this.cartridgeData;
  }

  get modData() {
    return this.implantData;
  }

  get armorBonuses() {
    if (!this.isArmor) return undefined;
    const { itemPhys = 0, itemAzure = 0, itemMental = 0, itemShield = 0, itemSpeed = 0 } = this.system;
    return {
      physical: Number(itemPhys ?? 0) || 0,
      azure: Number(itemAzure ?? 0) || 0,
      mental: Number(itemMental ?? 0) || 0,
      shield: Number(itemShield ?? 0) || 0,
      speed: Number(itemSpeed ?? 0) || 0
    };
  }

  get weaponProfile() {
    if (!this.isWeapon) return undefined;
    const { skill = '', skillBonus = 0 } = this.system;
    return {
      skill: String(skill ?? ''),
      skillBonus: Number(skillBonus ?? 0) || 0
    };
  }

  logDebugState(context = 'MyRPGItem state') {
    // DEBUG-LOG
    debugLog(context, {
      id: this.id,
      name: this.name,
      type: this.type,
      system: foundry.utils.duplicate(this.system ?? {})
    });
  }
}
