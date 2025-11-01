import { MODULE_ID, RUNE_TYPE_KEYS, UPGRADE_KEYS, debugLog } from '../config.mjs';

function buildRankOptions(selected) {
  const worldType = game.settings.get(MODULE_ID, 'worldType');
  const baseKey = worldType === 'stellar' ? 'MY_RPG.RankNumeric' : 'MY_RPG.RankGradient';
  const selectedNumber = Number(selected) || 0;
  const options = [
    {
      value: '',
      label: game.i18n.localize('MY_RPG.Rank.Unspecified'),
      selected: !selectedNumber
    }
  ];

  for (let rank = 1; rank <= 5; rank += 1) {
    options.push({
      value: String(rank),
      label: game.i18n.localize(`${baseKey}.Rank${rank}`),
      selected: selectedNumber === rank
    });
  }

  return options;
}

function buildUpgradeOptions(selected) {
  const normalized = selected || 'None';
  return UPGRADE_KEYS.map((value) => ({
    value,
    label: game.i18n.localize(`MY_RPG.AbilityUpgrades.${value}`),
    selected: normalized === value
  }));
}

function buildRuneTypeOptions(selected) {
  const normalized = selected || 'Spell';
  return RUNE_TYPE_KEYS.map((value) => ({
    value,
    label: game.i18n.localize(`MY_RPG.RuneTypes.${value}`),
    selected: normalized === value
  }));
}

function buildSkillOptions(selected) {
  const skills = CONFIG.MY_RPG?.skills ?? {};
  const options = [
    {
      value: '',
      label: game.i18n.localize('MY_RPG.WeaponsTable.SkillNoneOption'),
      selected: !selected
    }
  ];

  for (const [key, labelKey] of Object.entries(skills)) {
    options.push({
      value: key,
      label: game.i18n.localize(labelKey),
      selected: key === selected
    });
  }

  return options;
}

export class MyRPGItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['myrpg', 'sheet', 'item'],
      width: 620,
      height: 600
    });
  }

  async getData(options) {
    const sheetData = await super.getData(options);
    const itemData = sheetData.item ?? sheetData.document ?? this.item;
    sheetData.system = sheetData.system ?? itemData?.system ?? {};
    sheetData.config = CONFIG.MY_RPG ?? {};
    sheetData.worldType = game.settings.get(MODULE_ID, 'worldType');

    if (game.settings.get(MODULE_ID, 'debugMode')) {
      // DEBUG-LOG
      debugLog('Preparing item sheet data', {
        type: this.item.type,
        itemId: this.item.id
      });
      this.item.logDebugState('Item sheet snapshot');
    }

    return sheetData;
  }
}

export class MyRPGCartridgeSheet extends MyRPGItemSheet {
  get template() {
    return 'systems/myrpg/templates/item/cartridge-sheet.hbs';
  }

  async getData(options) {
    const data = await super.getData(options);
    data.rankOptions = buildRankOptions(data.system.rank);
    data.upgradeOptions = buildUpgradeOptions(data.system.upgrade1);
    data.upgradeOptionsSecondary = buildUpgradeOptions(data.system.upgrade2);
    data.runeTypeOptions = buildRuneTypeOptions(data.system.runeType);
    data.showRuneType = data.worldType === 'unity';
    return data;
  }
}

export class MyRPGImplantSheet extends MyRPGItemSheet {
  get template() {
    return 'systems/myrpg/templates/item/implant-sheet.hbs';
  }

  async getData(options) {
    const data = await super.getData(options);
    data.rankOptions = buildRankOptions(data.system.rank);
    data.upgradeOptions = buildUpgradeOptions(data.system.upgrade1);
    data.upgradeOptionsSecondary = buildUpgradeOptions(data.system.upgrade2);
    return data;
  }
}

export class MyRPGArmorSheet extends MyRPGItemSheet {
  get template() {
    return 'systems/myrpg/templates/item/armor-sheet.hbs';
  }
}

export class MyRPGWeaponSheet extends MyRPGItemSheet {
  get template() {
    return 'systems/myrpg/templates/item/weapon-sheet.hbs';
  }

  async getData(options) {
    const data = await super.getData(options);
    data.skillOptions = buildSkillOptions(data.system.skill);
    return data;
  }
}

export class MyRPGGearSheet extends MyRPGItemSheet {
  get template() {
    return 'systems/myrpg/templates/item/gear-sheet.hbs';
  }
}
