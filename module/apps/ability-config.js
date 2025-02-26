export class MyAbilityConfig extends FormApplication {
    /**
     * @param {Actor} actor           ������� ����
     * @param {number} abilityIndex   ������ ����������� � �������
     * @param {object} abilityData    ������� ���� { name, effect, cost }
     * @param {object} options        ����� FormApplication
     */
    constructor(actor, abilityIndex, abilityData = {}, options = {}) {
        super(abilityData, options);
        this.actor = actor;
        this.abilityIndex = abilityIndex;
    }

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["myrpg", "sheet", "ability-config"],
            title: "�������������� �����������",
            template: "systems/myrpg/templates/apps/ability-config.hbs",
            width: 400,
            height: "auto"
        });
    }

    getData(options) {
        // super.getData() ������ ���������� {object: this.object}
        const data = super.getData(options);
        // ����������� ��� ��������
        data.ability = this.object;
        return data;
    }

    /**
     * ���� �������� ������ ����� ��� ����������
     * (������ "��" ��� "���������" � �������).
     */
    async _updateObject(event, formData) {
        // ��������� ���� �����
        // formData = { name: "...", effect: "...", cost: "5" }
        let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
        if (!Array.isArray(abilities)) abilities = Object.values(abilities);

        // ��������� ���������� ������� �������
        abilities[this.abilityIndex] = {
            name: formData.name ?? "",
            effect: formData.effect ?? "",
            cost: Number(formData.cost ?? 0)
        };

        // ���������
        await this.actor.update({ "system.abilitiesList": abilities });
    }
}