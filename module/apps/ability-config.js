// systems/myrpg/module/apps/ability-config.js
export class MyAbilityConfig extends FormApplication {
    /**
     * @param {Actor} actor            Текущий актёр
     * @param {number} abilityIndex    Индекс редактируемой способности
     * @param {object} abilityData     Данные способности
     * @param {object} options         Стандартные опции FormApplication
     */
    constructor(actor, abilityIndex, abilityData = {}, options = {}) {
        super(abilityData, options);
        this.actor = actor;
        this.abilityIndex = abilityIndex;
    }

    /** @override */
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["myrpg", "sheet", "ability-config"],
            title: game.i18n.localize("MY_RPG.AbilityConfig.Title"),
            template: "systems/myrpg/templates/apps/ability-config.hbs",
            width: 400,
            height: "auto"
        });
    }

    /**
     * Данные, которые будут доступны шаблону (ability-config.hbs).
     * @override
     */
    getData() {
        // super.getData() обычно возвращает {object: ...} - базовую структуру
        const data = super.getData();

        // this.object — это «abilityData», который мы передали в конструктор
        data.ability = this.object;

        return data;
    }

    /**
     * Сюда попадают данные формы при сохранении.
     * @override
     */
    async _updateObject(event, formData) {
        // Считываем обновлённые поля из formData
        // formData - это уже "плоский" объект вида { name: "...", effect: "...", cost: ... }

        // 1. Достаём текущий список способностей
        let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
        if (!Array.isArray(abilities)) {
            // Если вдруг массив сериализовался как объект
            abilities = Object.values(abilities);
        }

        // 2. Обновляем нужный элемент массива
        abilities[this.abilityIndex] = {
            name: formData.name ?? "",
            effect: formData.effect ?? "",
            cost: Number(formData.cost ?? 0)
        };

        // 3. Сохраняем изменения в актёра
        await this.actor.update({ "system.abilitiesList": abilities });
    }
}