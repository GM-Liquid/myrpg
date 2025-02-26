// systems/myrpg/module/apps/ability-config.js
export class MyAbilityConfig extends FormApplication {
    /**
     * @param {Actor} actor            ������� ����
     * @param {number} abilityIndex    ������ ������������� �����������
     * @param {object} abilityData     ������ �����������
     * @param {object} options         ����������� ����� FormApplication
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
     * ������, ������� ����� �������� ������� (ability-config.hbs).
     * @override
     */
    getData() {
        // super.getData() ������ ���������� {object: ...} - ������� ���������
        const data = super.getData();

        // this.object � ��� �abilityData�, ������� �� �������� � �����������
        data.ability = this.object;

        return data;
    }

    /**
     * ���� �������� ������ ����� ��� ����������.
     * @override
     */
    async _updateObject(event, formData) {
        // ��������� ���������� ���� �� formData
        // formData - ��� ��� "�������" ������ ���� { name: "...", effect: "...", cost: ... }

        // 1. ������ ������� ������ ������������
        let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
        if (!Array.isArray(abilities)) {
            // ���� ����� ������ �������������� ��� ������
            abilities = Object.values(abilities);
        }

        // 2. ��������� ������ ������� �������
        abilities[this.abilityIndex] = {
            name: formData.name ?? "",
            effect: formData.effect ?? "",
            cost: Number(formData.cost ?? 0)
        };

        // 3. ��������� ��������� � �����
        await this.actor.update({ "system.abilitiesList": abilities });
    }
}