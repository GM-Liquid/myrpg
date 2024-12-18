console.log("My RPG System | Загрузка системы");


import { Character } from "templates/actors/actor-character.json";
import { Items } from "templates/actors/items.json";


Hooks.once('init', function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.myrpg = {
        Character,
        Items,
    };
},

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