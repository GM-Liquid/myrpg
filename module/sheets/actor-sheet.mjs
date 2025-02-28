/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

export class myrpgActorSheet extends ActorSheet {
    /** @override */

    async close(options = {}) {
        // ������� ��� ���������� tooltip
        $("body").find(".ability-tooltip").remove();
        return super.close(options);
    }

    activateListeners(html) {

        const $table = html.find(".abilities-table");
        $table.on("mouseleave", () => {
            // ��� ����� ������� � ������� � ������� ��� tooltip
            $("body").find(".ability-tooltip").remove();
        });


        super.activateListeners(html);
        // ��������� ���� (mouseenter)
        html.find("tr.ability-row").on("mouseenter", event => {
            const $row = $(event.currentTarget);

            // �������� ������ �����������
            const index = Number($row.data("index"));

            // ���� ������ ������������
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            const abilityData = abilities[index] || {};
            const costValue = abilityData.cost; 
            const costText = (costValue === "" || costValue === null || costValue === undefined)
                ? ""
                : costValue;

            // ������ DOM-������� tooltip
            const $tooltip = $(`
    <div class="ability-tooltip">
      <strong>${abilityData.name || ""}</strong><br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Rank")}:</strong> ${abilityData.rank || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Effect")}:</strong> ${abilityData.effect || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Desc")}:</strong><br/>${abilityData.desc || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Cost")}:</strong> ${costText}<br/>
    </div>
  `);

            // ��������� tooltip � <body>
            $("body").append($tooltip);

            // ����� � ������� ��������
            $tooltip.css({
                position: "absolute",
                zIndex: 99999,
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                padding: "5px",
                boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                pointerEvents: "none"
            });

            // ���������� ������
            // offset() ���������� { top, left } ��� �������� ������������ ���������
            const rowOffset = $row.offset();
            const tooltipWidth = $tooltip.outerWidth();

            // ������������� tooltip ����� �� ������ (�� ��� �� ������ �� ���������)
            $tooltip.css({
                top: rowOffset.top + "px",
                left: (rowOffset.left - tooltipWidth - 10) + "px" // "10" - ������
            });

            // ��������� ������, ����� ������� ��� mouseleave
            $row.data("tooltip", $tooltip);
        });

        // ���� ������� (mouseleave)
        html.find("tr.ability-row").on("mouseleave", event => {
            const $row = $(event.currentTarget);
            const $tooltip = $row.data("tooltip");
            if ($tooltip) {
                $tooltip.remove();
                $row.removeData("tooltip");
            }
        });


         // ���� �� "������" � ������ ��������� ����
        html.find(".ability-cancel").click(ev => {
            ev.preventDefault();
            this.close();
        });
        // �������� ������
        html.find("tr.add-row").click(ev => {
            ev.preventDefault();
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            // ��������� ����� ������
            abilities.push({
                name: "",
                rank: "",
                desc: "",
                effect: "",
                cost: ""
            });

            this.actor.update({ "system.abilitiesList": abilities });
        });

        // ������� ������
        html.find('.abilities-remove-row').click(ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);

            // ������ ������� �������������
            new Dialog({
                title: game.i18n.localize("MY_RPG.Dialog.ConfirmDeleteTitle"),
                content: `<p>${game.i18n.localize("MY_RPG.Dialog.ConfirmDeleteMessage")}</p>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.Dialog.Yes"),
                        callback: () => {
                            // ���� ������������ ���������� ��������:
                            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];

                            // �� ������, ���� ������ �������������� ��� ������:
                            if (!Array.isArray(abilities)) {
                                abilities = Object.values(abilities);
                            }

                            abilities.splice(index, 1);
                            this.actor.update({ "system.abilitiesList": abilities });
                        }
                    },
                    no: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("MY_RPG.Dialog.No")
                    }
                },
                default: "no"
            }).render(true);
        });


        html.find('tr.ability-row').click(ev => {

            // ���� ���� �� ������ �������� � ������ �� ������
            if ($(ev.target).closest('.abilities-remove-row').length) return;

            // ���� ��� ������ ������ � ��������� ��������� �����
            if (this._editing) {
                ui.notifications.warn(game.i18n.localize("MY_RPG.AbilityConfig.AlreadyEditing"));
                return;
            }

            ev.preventDefault();
            this._editing = true; // ������ ���� "��� ��������������"

            const index = Number(ev.currentTarget.dataset.index);
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);
            const abilityData = abilities[index] || {};

            // ������ ��������� ������ (��� � ���� ����)
            let diag = new Dialog({

                title: game.i18n.localize("MY_RPG.AbilityConfig.Title"),
                content: `
        <form>
          <div class="form-group">
            <label>${game.i18n.localize("MY_RPG.AbilityConfig.Name")}</label>
            <input type="text" name="name" value="${abilityData.name ?? ""}" />
          </div>
          <div class="form-group">
            <label>${game.i18n.localize("MY_RPG.AbilityConfig.Rank")}</label>
            <input type="text" name="rank" value="${abilityData.rank ?? ""}" />
          </div>
          <div class="form-group">
            <label>${game.i18n.localize("MY_RPG.AbilityConfig.Effect")}</label>
            <textarea name="effect" class="auto-expand">${abilityData.effect ?? ""}</textarea>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize("MY_RPG.AbilityConfig.Desc")}</label>
            <textarea name="desc" class="auto-expand">${abilityData.desc ?? ""}</textarea>
          </div>
          <div class="form-group">
            <label>${game.i18n.localize("MY_RPG.AbilityConfig.Cost")}</label>
            <input type="number" name="cost" value="${abilityData.cost ?? ""}" />
          </div>
        </form>
    `,
                buttons: {
                    save: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.AbilityConfig.Save"),
                        callback: (htmlDialog) => {
                            console.log(">>> Saved");

                            const formEl = htmlDialog.find("form")[0];
                            const fd = new FormData(formEl);

                            let formData = {};
                            for (let [k, v] of fd.entries()) {
                                formData[k] = v;
                            }

                            abilities[index] = {
                                name: formData.name ?? "",
                                rank: formData.rank ?? "",
                                effect: formData.effect ?? "",
                                desc: formData.desc ?? "",
                                cost: formData.cost ?? ""
                            };

                            this.actor.update({ "system.abilitiesList": abilities });
                        }
                    },
                    cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: game.i18n.localize("MY_RPG.AbilityConfig.Cancel")
                    }
                },
                default: "save",
                close: () => {
                    this._editing = false; // ���������� ���� ����� �������� �������
                    console.log(">>> Dialog closed");
                },
                render: (html) => {
                    html.find(".auto-expand").each(function () {
                        this.style.height = "auto";
                        this.style.height = (this.scrollHeight) + "px";
                    }).on("input", function () {
                        this.style.height = "auto";
                        this.style.height = (this.scrollHeight) + "px";
                    });
                }
            });

            diag.render(true);
        });




        html.find('input[name^="system.abilities."], input[name^="system.skills."]').on("change", ev => {
            const input = ev.currentTarget;
            let val = parseInt(input.value, 10);

            // ���� ������������ ��� �� ����� (NaN), �� ��������� ������ 1
            if (isNaN(val)) val = 1;

            // ����������, ��� "��������������" ��� "�����"
            const isAbility = input.name.includes("system.abilities.");
            const label = isAbility ? "��������������" : "�����";

            // ��������� �������
            if (val < 1) {
                ui.notifications.warn(`${label} �� ����� ���� ������ 1`);
                val = 1;
            } else if (val > 20) {
                ui.notifications.warn(`${label} �� ����� ���� ������ 20`);
                val = 20;
            }

            // ��������� �������� � ���� � � ������ �����
            input.value = val;
            this.actor.update({ [input.name]: val });
        });
    }
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ['myrpg', 'sheet', 'actor', 'myrpg-hex-tabs'],
            width: 800,
            height: 1000,
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
