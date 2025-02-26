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
            title: "Редактирование способности",
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
        // Считываем поля формы
        // formData = { name: "...", effect: "...", cost: "5" }
        let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
        if (!Array.isArray(abilities)) abilities = Object.values(abilities);

        // Обновляем конкретный элемент массива
        abilities[this.abilityIndex] = {
            name: formData.name ?? "",
            effect: formData.effect ?? "",
            cost: Number(formData.cost ?? 0)
        };

        // Сохраняем
        await this.actor.update({ "system.abilitiesList": abilities });
    }
}