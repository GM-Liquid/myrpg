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
// Функция для загрузки скрипта
function loadScript(url) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = url;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Функция для загрузки CSS
function loadCSS(url) {
    return new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.onload = resolve;
        document.head.appendChild(link);
    });
}

Hooks.once('init', async function () {
    // Загружаем Tippy.js и его зависимости
    await loadTippy();

    // Далее идет уже существующий код инициализации системы
    game.myrpg = {
        myrpgActor,
    };

    CONFIG.MY_RPG = MY_RPG;

    CONFIG.Combat.initiative = {
        formula: '1d20 + @abilities.wis.mod',
        decimals: 2,
    };

    CONFIG.Actor.documentClass = myrpgActor;

    Handlebars.registerHelper('concat', (...args) => {
        args.pop();
        return args.join('');
    });

    Handlebars.registerHelper('toPascalCase', (str) => {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('myrpg', myrpgActorSheet, {
        makeDefault: true,
        label: 'MY_RPG.SheetLabels.Actor',
    });

    return preloadHandlebarsTemplates();
});

