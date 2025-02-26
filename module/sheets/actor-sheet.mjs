/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { MyAbilityConfig } from "../apps/ability-config.js";
export class myrpgActorSheet extends ActorSheet {
    /** @override */

    activateListeners(html) {
        // Вызов родительского метода
        super.activateListeners(html);
        console.log("myrpgActorSheet | activateListeners called");
        // Находим оба поля бонуса потока
        const fluxBonusInputs = html.find('input[name="system.flux.bonus"], input.flux-bonus-sync');

        // Обработчик событий, который срабатывает при изменении любого из полей
        fluxBonusInputs.on('input change', (e) => {
            const val = $(e.currentTarget).val();
            // Обновляем данные актёра
            this.actor.update({ "system.flux.bonus": Number(val) });
            // Обновляем значение во всех полях бонуса
            fluxBonusInputs.val(val);
        });

        html.find('.ability-edit').click(ev => {
            ev.preventDefault();
            const index = Number(ev.currentTarget.dataset.index);

            // Получаем список способностей
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
            if (!Array.isArray(abilities)) {
                abilities = Object.values(abilities);
            }

            // Данные конкретной способности
            const abilityData = abilities[index];

            // Открываем наше окошко
            new MyAbilityConfig(this.actor, index, abilityData).render(true);
        });

        html.find('.abilities-add-row').click(ev => {
            ev.preventDefault();

            // Шаг 1: Клонируем данные
            let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];

            // Шаг 2: Если это не массив (а объект), преобразуем в массив
            if (!Array.isArray(abilities)) {
                abilities = Object.values(abilities);
            }

            // Шаг 3: Теперь .push() будет работать
            abilities.push({ name: "", desc: "", effect: "", cost: 0 });

            // Шаг 4: Обновляем данные актёра
            this.actor.update({ "system.abilitiesList": abilities });
        });

        // Клик по иконке "Удалить строку"
        html.find('.abilities-remove-row').click(ev => {
            ev.preventDefault();

            // Считываем индекс строки
            const index = Number(ev.currentTarget.dataset.index);

            // Создаём диалог подтверждения
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
