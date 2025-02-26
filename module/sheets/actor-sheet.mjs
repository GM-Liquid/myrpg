/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class myrpgActorSheet extends ActorSheet {
    /** @override */

    activateListeners(html) {
        // ����� ������������� ������
        super.activateListeners(html);

        // ������� ��� ���� ������ ������
        const fluxBonusInputs = html.find('input[name="system.flux.bonus"], input.flux-bonus-sync');

        // ���������� �������, ������� ����������� ��� ��������� ������ �� �����
        fluxBonusInputs.on('input change', (e) => {
            const val = $(e.currentTarget).val();
            // ��������� ������ �����
            this.actor.update({ "system.flux.bonus": Number(val) });
            // ��������� �������� �� ���� ����� ������
            fluxBonusInputs.val(val);
        });


        html.on('click', '.abilities-add-row', ev => {
            ev.preventDefault();
            console.log("Add row clicked");
            const abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            abilities.push({ name: "", desc: "", effect: "", cost: 0 });
            this.actor.update({ "system.abilitiesList": abilities });
        });

        // ���� �� ������ "������� ������"
        html.on('click', '.abilities-remove-row', ev => {
            ev.preventDefault();
            console.log("Remove row clicked");
            const index = Number(ev.currentTarget.dataset.index);
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            abilities.splice(index, 1);
            this.actor.update({ "system.abilitiesList": abilities });
        });
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['myrpg', 'sheet', 'actor', 'myrpg-hex-tabs'],
            width: 600,
            height: 900,
            resizable: false,
            tabs: [
                {
                    navSelector: '.sheet-tabs-hex',
                    contentSelector: '.sheet-body',
                    initial: 'features',
                    controlSelector: 'a.hex-button' // <-- ���������!
                },
            ],
        });
    }
  /** @override */
    get template() {
        if (this.actor.type === "npc") {
            // ��� NPC ���������� ������ ����� ���������
            return `systems/myrpg/templates/actor/actor-character-sheet.hbs`;
        }
        return `systems/myrpg/templates/actor/actor-${this.actor.type}-sheet.hbs`;
    }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
      if (actorData.type === 'character' || actorData.type === 'npc') {
          this._prepareCharacterData(context);
      }


    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData()

    return context;
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.MY_RPG.abilities[k]) ?? k;
      }
    // Handle skill scores.
    for (let [x, c] of Object.entries(context.system.skills)) {
      c.label = game.i18n.localize(CONFIG.MY_RPG.skills[x]) ?? x;
      }

  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
      }
      if (dataset.roll) {
          let label = dataset.label ? `[skill] ${dataset.label}` : '';
          let roll = new Roll(dataset.roll, this.actor.getRollData());
          roll.toMessage({
              speaker: ChatMessage.getSpeaker({ actor: this.actor }),
              flavor: label,
              rollMode: game.settings.get('core', 'rollMode'),
          });
          return roll;
      }
  }
}
