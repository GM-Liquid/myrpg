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

  // Define custom Document classes
  CONFIG.Actor.documentClass = myrpgActor;

  // systems/myrpg/myrpg.mjs  — в хуке init
  CONFIG.Combat.initiative = {
    // Initiative rolls based on Body
    formula: '2d@abilities.con.die + @abilities.con.value',
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
