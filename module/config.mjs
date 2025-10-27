import { MY_RPG } from './helpers/config.mjs';

export const MODULE_ID = 'myrpg';
export const UPGRADE_KEYS = [
  'None',
  'Damage',
  'Area',
  'Cost',
  'Range',
  'Duration',
  'Activations',
  'Link'
];
export const RUNE_TYPE_KEYS = ['Spell', 'Creature', 'Item', 'Portal', 'Domain', 'Saga'];

export function registerSystemSettings() {
  game.settings.register(MODULE_ID, 'worldType', {
    name: 'MY_RPG.WorldMode.SettingName',
    hint: 'MY_RPG.WorldMode.SettingHint',
    scope: 'world',
    config: true,
    type: String,
    choices: {
      unity: game.i18n.localize('MY_RPG.WorldMode.Unity'),
      stellar: game.i18n.localize('MY_RPG.WorldMode.Stellar')
    },
    default: 'unity'
  });

  game.settings.register(MODULE_ID, 'worldTypeChosen', {
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  });

  game.settings.register(MODULE_ID, 'debugMode', {
    name: 'MY_RPG.Settings.DebugMode.Name',
    hint: 'MY_RPG.Settings.DebugMode.Hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false
  });
}

export function debugLog(message, ...args) {
  try {
    const enabled = game?.settings?.get?.(MODULE_ID, 'debugMode');
    if (!enabled) return;
  } catch (error) {
    return;
  }

  const prefix = '[MyRPG]';
  if (args.length) {
    console.debug(prefix, message, ...args);
  } else {
    console.debug(prefix, message);
  }
}

export { MY_RPG };
