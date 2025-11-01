// Import document classes.
import { myrpgActor } from './documents/actor.mjs';
import { MyRPGItem } from './documents/item.mjs';
// Import sheet classes.
import { myrpgActorSheet } from './sheets/actor-sheet.mjs';
import {
  MyRPGCartridgeSheet,
  MyRPGArmorSheet,
  MyRPGGearSheet,
  MyRPGImplantSheet,
  MyRPGWeaponSheet
} from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { MY_RPG, debugLog, registerSystemSettings } from './config.mjs';
import './helpers/handlebars-helpers.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.myrpg = {
    myrpgActor,
    MyRPGItem,
    debugLog
  };

  // Add custom constants for configuration.
  CONFIG.MY_RPG = MY_RPG;

  registerSystemSettings();

  // Define custom Document classes
  CONFIG.Actor.documentClass = myrpgActor;
  CONFIG.Item.documentClass = MyRPGItem;

  // systems/myrpg/myrpg.mjs  — в хуке init
  CONFIG.Combat.initiative = {
    // Initiative rolls use d10 plus Body value
    formula: '1d10 + @abilities.con.value',
    decimals: 2
  };

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('myrpg', myrpgActorSheet, {
    makeDefault: true,
    label: 'MY_RPG.SheetLabels.Actor'
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('myrpg', MyRPGCartridgeSheet, {
    types: ['cartridge'],
    makeDefault: true,
    label: 'MY_RPG.SheetLabels.ItemAbility'
  });
  Items.registerSheet('myrpg', MyRPGImplantSheet, {
    types: ['implant'],
    makeDefault: true,
    label: 'MY_RPG.SheetLabels.ItemMod'
  });
  Items.registerSheet('myrpg', MyRPGArmorSheet, {
    types: ['armor'],
    makeDefault: true,
    label: 'MY_RPG.SheetLabels.ItemArmor'
  });
  Items.registerSheet('myrpg', MyRPGWeaponSheet, {
    types: ['weapon'],
    makeDefault: true,
    label: 'MY_RPG.SheetLabels.ItemWeapon'
  });
  Items.registerSheet('myrpg', MyRPGGearSheet, {
    types: ['gear'],
    makeDefault: true,
    label: 'MY_RPG.SheetLabels.ItemGear'
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

Hooks.once('ready', function () {
  // DEBUG-LOG
  debugLog('MyRPG system ready', {
    version: game.system.version,
    userId: game.user?.id,
    isGM: game.user?.isGM ?? false
  });

  if (!game.user.isGM) return;
  if (game.settings.get('myrpg', 'worldTypeChosen')) return;

  const content = `<p>${game.i18n.localize('MY_RPG.WorldMode.DialogContent')}</p>`;
  new Dialog({
    title: game.i18n.localize('MY_RPG.WorldMode.DialogTitle'),
    content,
    buttons: {
      unity: {
        label: game.i18n.localize('MY_RPG.WorldMode.Unity'),
        callback: () => {
          game.settings.set('myrpg', 'worldType', 'unity');
          game.settings.set('myrpg', 'worldTypeChosen', true);
        }
      },
      stellar: {
        label: game.i18n.localize('MY_RPG.WorldMode.Stellar'),
        callback: () => {
          game.settings.set('myrpg', 'worldType', 'stellar');
          game.settings.set('myrpg', 'worldTypeChosen', true);
        }
      }
    },
    default: 'unity'
  }).render(true);
});
