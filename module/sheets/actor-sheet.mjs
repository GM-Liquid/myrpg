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
        html.find('tr.ability-row').on('mouseenter', event => {
            console.log(">>> Debug: mouseenter on ability-row");
            const $row = $(event.currentTarget);

            // Убедимся, что строка имеет position: relative,
            // чтобы "absolute" tooltip позиционировался относительно неё.
            $row.css("position", "relative");

            // Получаем индекс способности из data-атрибута
            const index = Number($row.data('index'));

            // Достаём массив способностей
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);
            const abilityData = abilities[index] || {};

            // Создаём DOM-элемент tooltip
            const $tooltip = $(`
      <div class="ability-tooltip">
        <strong>${abilityData.name || "Без названия"}</strong><br/>
        ${abilityData.desc || "Нет описания"}<br/>
        <em>Эффект:</em> ${abilityData.effect || "-"}<br/>
        <em>Стоимость:</em> ${abilityData.cost || 0}
      </div>
    `);

            // Добавляем tooltip как "дочерний" элемент строки
            $row.append($tooltip);

            // Настраиваем стили, чтобы он показывался слева
            $tooltip.css({
                position: "absolute",
                top: "0",
                right: "100%",     // Позиционируем tooltip слева от строки
                marginRight: "10px", // Отступ, чтобы не прилипал к строке
                zIndex: 99999,
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                padding: "5px",
                boxShadow: "0 0 5px rgba(0,0,0,0.2)",
                pointerEvents: "none" // чтобы tooltip не перехватывал события мыши
            });

            // Сохраняем ссылку на tooltip, чтобы удалить при mouseleave
            $row.data("tooltip", $tooltip);
        });

        // Уход мыши (mouseleave)
        html.find('tr.ability-row').on('mouseleave', event => {
            console.log(">>> Debug: mouseleave from ability-row");
            const $row = $(event.currentTarget);
            const $tooltip = $row.data("tooltip");
            if ($tooltip) {
                $tooltip.remove();          // удаляем элемент
                $row.removeData("tooltip"); // чистим data
            }
        });


         // Клик по "Отмена" — просто закрываем окно
        html.find(".ability-cancel").click(ev => {
            ev.preventDefault();
            this.close();
        });
        // Добавить строку
        html.find('.abilities-add-row').click(ev => {
            ev.preventDefault();
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) abilities = Object.values(abilities);

            abilities.push({ name: "", effect: "", cost: 0 });
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
