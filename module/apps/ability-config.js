export class MyAbilityConfig extends FormApplication {
    /**
     * @param {Actor} actor           Текущий актёр
     * @param {number} abilityIndex   Индекс способности в массиве
     * @param {object} abilityData    Текущие поля { name, effect, cost }
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
        // super.getData() обычно возвращает {object: this.object}
        const data = super.getData(options);
        // Переименуем для удобства
        data.ability = this.object;
        return data;
    }

    /**
     * Сюда попадают данные формы при сохранении
     * (кнопка "ОК" или "Сохранить" в диалоге).
     */
    async _updateObject(event, formData) {
        let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
        if (!Array.isArray(abilities)) abilities = Object.values(abilities);

        // Обновляем нужную запись
        abilities[this.abilityIndex] = {
            name: formData.name ?? "",
            rank: formData.rank ?? "",
            effect: formData.effect ?? "",
            cost: Number(formData.cost ?? 0),
            desc: formData.desc ?? ""
        };

        await this.actor.update({ "system.abilitiesList": abilities });
    }
}