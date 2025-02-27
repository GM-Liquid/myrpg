export class MyAbilityConfig extends FormApplication {
    /**
     * @param {Actor} actor           Текущий актёр
     * @param {number} abilityIndex   Индекс способности в массиве
     * @param {object} abilityData    Текущие поля { name, effect, cost, ... }
     * @param {object} options        Опции FormApplication
     */
    constructor(actor, abilityIndex, abilityData = {}, options = {}) {
        super(abilityData, options);
        this.actor = actor;
        this.abilityIndex = abilityIndex;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["myrpg", "sheet", "ability-config"],
            title: game.i18n.localize("MY_RPG.AbilityConfig.Title"),
            template: "systems/myrpg/templates/apps/ability-config.hbs",
            width: 400,
            height: "auto"
        });
    }

    getData(options) {
        const data = super.getData(options);
        data.ability = this.object; // object = данные о способности
        return data;
    }

    /**
     * Сюда попадают данные формы при сохранении
     * (кнопка "Сохранить" в диалоге).
     */
    async _updateObject(event, formData) {
        // Копируем массив способностей
        let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
        if (!Array.isArray(abilities)) abilities = Object.values(abilities);

        let parsedCost = "";
        if (formData.cost !== "") {
            parsedCost = Number(formData.cost); // превращаем в число
        }

        // Обновляем выбранную способность
        abilities[this.abilityIndex] = {
            name: formData.name ?? "",
            rank: formData.rank ?? "",
            desc: formData.desc ?? "",
            effect: formData.effect ?? "",
            cost: Number(formData.cost ?? 0)
        };

        // Сохраняем обновлённый массив в актёре
        await this.actor.update({ "system.abilitiesList": abilities });
    }
}