console.log("My RPG System | Загрузка системы");

Hooks.once('init', function () { });

class Character {
    prepareData() {
        super.prepareData();
    }

    prepareBaseData() {
        const
    }

    prepareDerivedData() {

    }
};


class ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["boilerplate", "sheet", "actor"],
            template: "systems/boilerplate/templates/actor/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
        });
    }
    get template() {
        return `systems/boilerplate/templates/actor/actor-${this.actor.type}-sheet.html`;
    }
}