// Import document classes.
import { myrpgActor } from './documents/actor.mjs';
// Import sheet classes.
import { myrpgActorSheet } from './sheets/actor-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { MY_RPG } from './helpers/config.mjs';

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function ()
    {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.myrpg = {
        myrpgActor,
    };

    
    if (game.world && game.world.id.toLowerCase() === "stellar") {
        game.i18n.translations.MY_RPG.Skill.Runnoy_iskusstvo = "Артефакторика";
        console.log("Локализация Runnoy_iskusstvo изменена на 'Артефакторика'");
    } else {
        console.log("ID кампании не совпадает с 'stellar'");
    }

    // Add custom constants for configuration.
    CONFIG.MY_RPG = MY_RPG;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: '1d20 + @abilities.wis.mod',
        decimals: 2,
    };

    // Define custom Document classes
    CONFIG.Actor.documentClass = myrpgActor;

    // --- Добавляем регистрацию хелперов Handlebars ---
    Handlebars.registerHelper('concat', (...args) => {
        // Последний аргумент — объект опций, его удаляем
        args.pop();
        return args.join('');
    });

    Handlebars.registerHelper('toPascalCase', (str) => {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    });
    // --- Конец регистрации хелперов ---

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('myrpg', myrpgActorSheet, {
        makeDefault: true,
        label: 'MY_RPG.SheetLabels.Actor',
    });

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});


/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});