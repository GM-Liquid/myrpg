// Import document classes.
import { myrpgActor } from './documents/actor.mjs';
// Import sheet classes.
import { myrpgActorSheet } from './sheets/actor-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { MY_RPG } from './helpers/config.mjs';
import './helpers/handlebars-helpers.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.myrpg = {
    myrpgActor
  };

  // Add custom constants for configuration.
  CONFIG.MY_RPG = MY_RPG;

  game.settings.register('myrpg', 'worldType', {
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

  game.settings.register('myrpg', 'worldTypeChosen', {
    scope: 'world',
    config: false,
    type: Boolean,
    default: false
  });

  // Define custom Document classes
  CONFIG.Actor.documentClass = myrpgActor;

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

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

Hooks.once('ready', function () {
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
