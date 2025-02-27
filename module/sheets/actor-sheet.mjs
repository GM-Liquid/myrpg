/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { MyAbilityConfig } from "../apps/ability-config.js";
export class myrpgActorSheet extends ActorSheet {
    /** @override */

    activateListeners(html) {
        super.activateListeners(html);
        // Наведение мыши (mouseenter)
        html.find("tr.ability-row").on("mouseenter", event => {
            const $row = $(event.currentTarget);

            // Получаем индекс способности
            const index = Number($row.data("index"));

            // Берём массив способностей
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            const abilityData = abilities[index] || {};
            const costText = (abilityData.cost == null || abilityData.cost === "") ? "" : abilityData.cost;

            // Создаём DOM-элемент tooltip
            const $tooltip = $(`
    <div class="ability-tooltip">
      <strong>${abilityData.name || ""}</strong><br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Rank")}:</strong> ${abilityData.rank || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Effect")}:</strong> ${abilityData.effect || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Desc")}:</strong><br/>${abilityData.desc || ""}<br/>
      <strong>${game.i18n.localize("MY_RPG.AbilityConfig.Cost")}:</strong> ${costText}<br/>
    </div>
  `);

            // Добавляем tooltip в <body>
            $("body").append($tooltip);

            // Стили и базовые свойства
            $tooltip.css({
                position: "absolute",
                zIndex: 99999,
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                padding: "5px",
                boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                pointerEvents: "none"
            });

            // Координаты строки
            // offset() возвращает { top, left } для элемента относительно документа
            const rowOffset = $row.offset();
            const tooltipWidth = $tooltip.outerWidth();

            // Позиционируем tooltip слева от строки (на том же уровне по вертикали)
            $tooltip.css({
                top: rowOffset.top + "px",
                left: (rowOffset.left - tooltipWidth - 10) + "px" // "10" - отступ
            });

            // Сохраняем ссылку, чтобы удалить при mouseleave
            $row.data("tooltip", $tooltip);
        });

        // Уход курсора (mouseleave)
        html.find("tr.ability-row").on("mouseleave", event => {
            const $row = $(event.currentTarget);
            const $tooltip = $row.data("tooltip");
            if ($tooltip) {
                $tooltip.remove();
                $row.removeData("tooltip");
            }
        });


         // Клик по "Отмена" — просто закрываем окно
        html.find(".ability-cancel").click(ev => {
            ev.preventDefault();
            this.close();
        });
        // Добавить строку
        html.find("tr.add-row").click(ev => {
            ev.preventDefault();
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            // Добавляем новую запись
            abilities.push({
                name: "",
                rank: "",
                desc: "",
                effect: "",
                cost: 0
            });

            this.actor.update({ "system.abilitiesList": abilities });
        });

        // Удалить строку
        html.find('.abilities-remove-row').click(ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);

            // Пример диалога подтверждения
            new Dialog({
                title: game.i18n.localize("MY_RPG.Dialog.ConfirmDeleteTitle"),
                content: `<p>${game.i18n.localize("MY_RPG.Dialog.ConfirmDeleteMessage")}</p>`,
                buttons: {
                    yes: {
                        icon: '<i class="fas fa-check"></i>',
                        label: game.i18n.localize("MY_RPG.Dialog.Yes"),
                        callback: () => {
                            // Если пользователь подтвердил удаление:
                            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];

                            // На случай, если массив сериализовался как объект:
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

        // Редактировать строку — клик по всей строке, кроме иконки удаления
        html.find('tr.ability-row').click(ev => {
            // Если клик был на иконке удаления — пропускаем
            if ($(ev.target).closest('.abilities-remove-row').length) return;

            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);

            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            // Текущие данные способности
            const abilityData = abilities[index] || {};

            // Открываем отдельное окошко (FormApplication) для редактирования
            new MyAbilityConfig(this.actor, index, abilityData).render(true);
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
                    controlSelector: 'a.hex-button' // <-- Добавляем!
                },
            ],
        });
    }
  /** @override */
    get template() {
        if (this.actor.type === "npc") {
            // Для NPC используем шаблон листа персонажа
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
