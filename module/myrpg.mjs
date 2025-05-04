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

Hooks.once('init', function ()

{
    console.log("🛠 myrpg | init hook loaded");
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.myrpg = {
        myrpgActor,
    };

    // Add custom constants for configuration.
    CONFIG.MY_RPG = MY_RPG;

    // Define custom Document classes
    CONFIG.Actor.documentClass = myrpgActor;

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('myrpg', myrpgActorSheet, {
        makeDefault: true,
        label: 'MY_RPG.SheetLabels.Actor',
    });

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});


Hooks.once('setup', () =>
{
    console.log("🛠 myrpg | setup hook loaded");
    const initiativeLabel = game.i18n.localize("MY_RPG.Initiative");

    Combatant.prototype.rollInitiative = async function ({ } = {}) {
        const actor = this.actor;
        const value = parseInt(actor.system.abilities.dex.value) || 0;

        // Количество кубов и грань
        const count = value > 0 ? value : 1;
        let die;
        if (value <= 4) die = 4;
        else if (value <= 8) die = 6;
        else if (value <= 12) die = 8;
        else if (value <= 16) die = 10;
        else die = 12;

        // Строка броска
        let formulaStr = `${count}d${die}`;
        if (value === 0) formulaStr += "-1";

        // --- Отладка: в лог попадает то, что уйдёт в Roll

        console.log("Initiative formula:", formulaStr, this.actor.name);
        if (typeof formulaStr !== 'string' || !formulaStr.match(/^\d+d\d+/)) {
            console.warn("Bad initiative formula, fallback to 1d4:", formulaStr);
            formulaStr = "1d4";
        }

        // Выполняем бросок
        const roll = await new Roll(formulaStr, actor.getRollData()).roll({ async: true });
        await this.update({ initiative: roll.total }, { updateCombat: false });

        // Публикуем в чат
        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: initiativeLabel,
            rollMode: game.settings.get("core", "rollMode")
        });
        return roll;
    };
});
