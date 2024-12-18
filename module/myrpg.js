console.log("My RPG System | Загрузка системы");


import { Character } from "templates/actors/actor-character.json";
import { Items } from "templates/actors/items.json";


Hooks.once('init', function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.boilerplate = {
        BoilerplateActor,
        BoilerplateItem,
        rollItemMacro,
    };

class MyRPGActor extends Actor {
    prepareData() {
        super.prepareData();
        const actorData = this.system;

        // Создаем базовые аттрибуты
        if (!actorData.attributes) {
            actorData.attributes = {
                body: { value: 10, label: "Телосложение" },
                perception: { value: 10, label: "Восприятие" },
                intellect: { value: 10, label: "Интеллект" },
                reflexes: { value: 10, label: "Рефлексы" },
                conductivity: { value: 10, label: "Проводимость" },
                willpower: { value: 10, label: "Сила воли" }
            };
        }

        // Навыки (пока пустые, но структура готова)
        // В будущем: actorData.skills = { athletics: {value: 2, attribute: "body"} }
        if (!actorData.skills) {
            actorData.skills = {};
        }
    }
}

class MyRPGActorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["my-rpg", "sheet", "actor"],
            template: "systems/my-rpg/templates/actors/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    getData(options) {
        const context = super.getData(options);
        const actorData = context.actor.system;

        context.attributes = actorData.attributes;
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // При изменении значения атрибута:
        html.find('.attribute-input').change(ev => {
            const input = ev.currentTarget;
            const attributeKey = input.dataset.key;
            const newValue = Number(input.value);
            if (!Number.isNaN(newValue)) {
                // Обновляем данные актёра через update
                this.actor.update({ [`system.attributes.${attributeKey}.value`]: newValue });
            }
        });
    }
}

class MyRPGActorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["my-rpg", "sheet", "actor"],
            template: "systems/my-rpg/templates/actors/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    getData(options) {
        const context = super.getData(options);
        const actorData = context.actor.system; // В v10+ данные лежат в actor.system

        // Передадим в шаблон атрибуты
        context.attributes = actorData.attributes;
        // В будущем добавим навыки

        return context;
    }
}

class MyRPGItem extends Item {
    prepareData() {
        super.prepareData();
        // Аналогично, здесь в будущем логика предметов.
    }
}

class MyRPGActorSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["my-rpg", "sheet", "actor"],
            template: "systems/my-rpg/templates/actors/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "main" }]
        });
    }

    getData(options) {
        const data = super.getData(options);
        // data.actor представляет данные актёра.
        // Позже можно будет добавить атрибуты, навыки и т.д.
        return data;
    }
}

class MyRPGItemSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["my-rpg", "sheet", "item"],
            template: "systems/my-rpg/templates/items/item-sheet.html",
            width: 400,
            height: 300
        });
    }

    getData(options) {
        const data = super.getData(options);
        // data.item - данные предмета.
        return data;
    }
}

// Предзагрузка шаблонов
async function preloadHandlebarsTemplates() {
    const templatePaths = [
        "systems/my-rpg/templates/actors/actor-sheet.html",
        "systems/my-rpg/templates/items/item-sheet.html"
    ];
    return loadTemplates(templatePaths);
}

Hooks.once("init", () => {
    console.log("My RPG System | Инициализация...");

    // Регистрируем классы документов
    CONFIG.Actor.documentClass = MyRPGActor;
    CONFIG.Item.documentClass = MyRPGItem;

    // Убираем стандартные листы
    Actors.unregisterSheet("core", ActorSheet);
    Items.unregisterSheet("core", ItemSheet);

    // Регистрируем наши листы
    Actors.registerSheet("my-rpg", MyRPGActorSheet, { makeDefault: true });
    Items.registerSheet("my-rpg", MyRPGItemSheet, { makeDefault: true });

    // Предзагружаем шаблоны
    preloadHandlebarsTemplates();
});
