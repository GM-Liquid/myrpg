/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { getRankAndDie } from '../helpers/utils.mjs';

export class myrpgActorSheet extends ActorSheet {
  /** @override */
  async _render(force = false, options = {}) {
    // ��������� ������� ��������� �������
    const scrollContainer = this.element.find('.sheet-scrollable');
    const scrollPos = scrollContainer.scrollTop();

    // �������� ������������ ���������� �������
    await super._render(force, options);

    // ��������������� ��������� �������
    this.element.find('.sheet-scrollable').scrollTop(scrollPos);
  }

  async close(options = {}) {
    // ������� ��� ���������� tooltip
    $('body').find('.ability-tooltip').remove();
    return super.close(options);
  }

  /**
   * ���������� �������� ���� � �����, ��������� � ���������������� � ��������.
   * ��� ��������� ��������� � �������������� ������� �����������.
   * @param {HTMLElement} input - DOM-������� input, ������� �������� ��������.
   * @returns {number} - ����������� �������� ��������.
   */
  validateNumericInput(input) {
    let val = parseInt(input.value, 10);
    const isAbility = input.name.includes('system.abilities.');
    // ���������� ����������� ��� �������� ���� ����:
    // �������� � ����������� ��������� �����:
    // "MY_RPG.NumericWarning.Attribute": "��������������" (ru) / "Attribute" (en)
    // "MY_RPG.NumericWarning.Skill": "�����" (ru) / "Skill" (en)
    const labelKey = isAbility ? 'MY_RPG.NumericWarning.Attribute' : 'MY_RPG.NumericWarning.Skill';
    const label = game.i18n.localize(labelKey);
    const minVal = isAbility ? 1 : 0;
    const actorRank = Number(this.actor.system.currentRank || 1);
    const maxVal = actorRank * 4; // 8, 12, 16, 20 и т.д.

    if (isNaN(val)) {
      val = minVal;
    }
    // ��� ���������� ������������ �������� � ������� ����������� � �������������� �������
    if (val < minVal) {
      // � ������������ �������� ���� "MY_RPG.NumericWarning.Min"
      // ��������: ru.json: "{{label}} �� ����� ���� ������ {{min}}"
      //              en.json: "{{label}} cannot be less than {{min}}"
      ui.notifications.warn(
        game.i18n.format('MY_RPG.NumericWarning.Min', {
          label: label,
          min: minVal
        })
      );
      val = minVal;
    } else if (val > maxVal) {
      ui.notifications.warn(
        game.i18n.format('MY_RPG.NumericWarning.RankLimit', {
          rank: actorRank,
          limit: maxVal
        })
      );
      val = maxVal;
    }
    input.value = val;
    return val;
  }

  /**
   * �������������� TinyMCE ��� ��������� ��������, ���� �� ��� �� ���������������.
   * @param {HTMLElement} element - DOM-������� textarea, ��� �������� ��������� TinyMCE.
   */
  initializeRichEditor(element) {
    if (!element._tinyMCEInitialized) {
      tinymce.init({
        target: element,
        inline: false,
        menubar: false,
        branding: false,
        statusbar: false,
        plugins: 'autoresize link lists',
        toolbar: false,
        content_style:
          'body, p { margin: 0; padding: 0; font-family: inherit; font-size: inherit; color: #1b1210; }',
        autoresize_min_height: 40,
        autoresize_bottom_margin: 0,
        width: '100%',
        setup: function (editor) {
          editor.on('init', function () {
            // �������������� ���������, ���� �����
          });
        }
      });
      element._tinyMCEInitialized = true;
    }
  }

  /**
   * ���������� tooltip ��� ������ �����������.
   * @param {jQuery} $row - jQuery ������ ������, ��� ������� ������������ tooltip.
   * @param {Object} abilityData - ������ ����������� ��� �����������.
   */
  showAbilityTooltip($row, abilityData) {
    const costValue = abilityData.cost;
    const costText = costValue ?? '';
    const $tooltip = $(`
    <div class="ability-tooltip">
      <strong>${abilityData.name || ''}</strong><br/>
      <strong>${game.i18n.localize('MY_RPG.AbilityConfig.Rank')}:</strong> ${abilityData.rank || ''}<br/>
      <strong>${game.i18n.localize('MY_RPG.AbilityConfig.Effect')}:</strong> ${abilityData.effect || ''}<br/>
      <strong>${game.i18n.localize('MY_RPG.AbilityConfig.Desc')}:</strong><br/>${abilityData.desc || ''}<br/>
      <strong>${game.i18n.localize('MY_RPG.AbilityConfig.Cost')}:</strong> ${costText}<br/>
    </div>
  `);
    $('body').append($tooltip);
    $tooltip.css({
      position: 'absolute',
      zIndex: 99999,
      backgroundColor: '#fff',
      border: '1px solid #ccc',
      padding: '5px',
      boxShadow: '0 0 5px rgba(0,0,0,0.2)',
      pointerEvents: 'none'
    });
    const rowOffset = $row.offset();
    const tooltipWidth = $tooltip.outerWidth();
    $tooltip.css({
      top: rowOffset.top + 'px',
      left: rowOffset.left - tooltipWidth - 10 + 'px'
    });
    $row.data('tooltip', $tooltip);
  }

  /**
   * ������� tooltip, ��������� � �������� �������.
   * @param {jQuery} $row - jQuery ������ ������, ��� ������� ��������� tooltip.
   */
  hideAbilityTooltip($row) {
    const $tooltip = $row.data('tooltip');
    if ($tooltip) {
      $tooltip.remove();
      $row.removeData('tooltip');
    }
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.wound-box').click(this._onToggleWound.bind(this));

    // ----------------------------------------------------------------------
    // Rollable �������� (������)
    // ----------------------------------------------------------------------
    html.find('.rollable').click(this._onRoll.bind(this));

    // ----------------------------------------------------------------------
    // ������� ������������
    // ----------------------------------------------------------------------
    const $table = html.find('.abilities-table');

    // ��� ����� ������� � ������� ������������ ������� tooltip
    $table.on('mouseleave', () => {
      $('body').find('.ability-tooltip').remove();
    });

    // ���������� tooltip ��� ��������� �� ������ �����������
    html.find('tr.ability-row').on('mouseenter', (event) => {
      const $row = $(event.currentTarget);
      const index = Number($row.data('index'));
      let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
      if (!Array.isArray(abilities)) abilities = Object.values(abilities);
      const abilityData = abilities[index] || {};
      this.showAbilityTooltip($row, abilityData);
    });

    // ������� tooltip, ����� ������ ������ �� ������
    html.find('tr.ability-row').on('mouseleave', (event) => {
      const $row = $(event.currentTarget);
      this.hideAbilityTooltip($row);
    });

    // ������ "������" (���� ���-�� ������������)
    html.find('.ability-cancel').click((ev) => {
      ev.preventDefault();
      this.close();
    });

    // �������� ����� ����������� (������)
    html.find('tr.add-row').click((ev) => {
      ev.preventDefault();
      let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
      if (!Array.isArray(abilities)) abilities = Object.values(abilities);

      abilities.push({
        name: '',
        rank: '',
        desc: '',
        effect: '',
        cost: ''
      });

      this.actor.update({ 'system.abilitiesList': abilities });
    });

    // ������� �����������
    html.find('.abilities-remove-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      new Dialog({
        title: game.i18n.localize('MY_RPG.Dialog.ConfirmDeleteTitle'),
        content: `<p>${game.i18n.localize('MY_RPG.Dialog.ConfirmDeleteMessage')}</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('MY_RPG.Dialog.Yes'),
            callback: () => {
              let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
              if (!Array.isArray(abilities)) {
                abilities = Object.values(abilities);
              }
              abilities.splice(index, 1);
              this.actor.update({ 'system.abilitiesList': abilities });
            }
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('MY_RPG.Dialog.No')
          }
        },
        default: 'no'
      }).render(true);
    });

    // �������������� ����������� (TinyMCE � ����������� ����)
    html.find('tr.ability-row').click((ev) => {
      if ($(ev.target).closest('.abilities-remove-row').length) return;
      if (this._editing) {
        ui.notifications.warn(game.i18n.localize('MY_RPG.AbilityConfig.AlreadyEditing'));
        return;
      }
      ev.preventDefault();
      this._editing = true;

      const index = Number(ev.currentTarget.dataset.index);
      let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
      if (!Array.isArray(abilities)) abilities = Object.values(abilities);
      const abilityData = abilities[index] || {};

      let diag = new Dialog({
        title: game.i18n.localize('MY_RPG.AbilityConfig.Title'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Name')}</label>
              <input type="text" name="name" value="${abilityData.name ?? ''}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Rank')}</label>
              <input type="text" name="rank" value="${abilityData.rank ?? ''}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Effect')}</label>
              <textarea name="effect" class="rich-editor">${abilityData.effect ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Desc')}</label>
              <textarea name="desc" class="rich-editor">${abilityData.desc ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Cost')}</label>
              <input type="number" name="cost" value="${abilityData.cost ?? ''}" />
            </div>
          </form>
        `,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('MY_RPG.AbilityConfig.Save'),
            callback: (htmlDialog) => {
              tinymce.triggerSave();
              const formEl = htmlDialog.find('form')[0];
              const fd = new FormData(formEl);
              let formData = {};
              for (let [k, v] of fd.entries()) {
                formData[k] = v;
              }
              abilities[index] = {
                name: formData.name ?? '',
                rank: formData.rank ?? '',
                effect: formData.effect ?? '',
                desc: formData.desc ?? '',
                cost: formData.cost ?? ''
              };
              this.actor.update({ 'system.abilitiesList': abilities });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('MY_RPG.AbilityConfig.Cancel')
          }
        },
        default: 'save',
        close: () => {
          this._editing = false;
        },
        render: (html) => {
          html.find('textarea.rich-editor').each((index, element) => {
            // �������� ����� ����� ������������� ���������
            this.initializeRichEditor(element);
          });
        }
      });
      diag.render(true);
    });

    // ----------------------------------------------------------------------
    // ������� ���������
    // ----------------------------------------------------------------------
    html.find('.inventory .add-row').click((ev) => {
      ev.preventDefault();
      let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
      if (!Array.isArray(inventory)) inventory = Object.values(inventory);
      inventory.push({
        name: '',
        desc: '',
        quantity: ''
      });
      this.actor.update({ 'system.inventoryList': inventory });
    });

    html.find('tr.inventory-row').click((ev) => {
      if ($(ev.target).closest('.inventory-remove-row').length) return;
      if (this._editing) {
        ui.notifications.warn(game.i18n.localize('MY_RPG.Inventory.AlreadyEditing'));
        return;
      }
      ev.preventDefault();
      this._editing = true;

      const index = Number(ev.currentTarget.dataset.index);
      let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
      if (!Array.isArray(inventory)) inventory = Object.values(inventory);
      const itemData = inventory[index] || {};

      let diag = new Dialog({
        title: game.i18n.localize('MY_RPG.Inventory.EditTitle'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.Inventory.Name')}</label>
              <input type="text" name="name" value="${itemData.name ?? ''}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.Inventory.Description')}</label>
              <textarea name="desc" class="rich-editor">${itemData.desc ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.Inventory.Quantity')}</label>
              <input type="number" name="quantity" value="${itemData.quantity ?? ''}" />
            </div>
          </form>
        `,
        buttons: {
          save: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('MY_RPG.Inventory.Save'),
            callback: (htmlDialog) => {
              tinymce.triggerSave();
              const formEl = htmlDialog.find('form')[0];
              const fd = new FormData(formEl);
              let formData = {};
              for (let [k, v] of fd.entries()) {
                formData[k] = v;
              }
              inventory[index] = {
                name: formData.name ?? '',
                desc: formData.desc ?? '',
                quantity: formData.quantity ?? ''
              };
              this.actor.update({ 'system.inventoryList': inventory });
            }
          },
          cancel: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('MY_RPG.Inventory.Cancel')
          }
        },
        default: 'save',
        close: () => {
          this._editing = false;
        },
        render: (html) => {
          html.find('textarea.rich-editor').each(function () {
            if (!this._tinyMCEInitialized) {
              tinymce.init({
                target: this,
                inline: false,
                menubar: false,
                branding: false,
                statusbar: false,
                plugins: 'autoresize link lists', // contextmenu �����
                toolbar: false, // ����� ������ ��� ��������
                // ���� ��� ��-���� ����� �����-���� ����������� ����, ������������ � ������������� TinyMCE 6
                content_style:
                  'body { margin: 0; padding: 0; font-family: inherit; font-size: inherit; color: #1b1210; }',
                autoresize_min_height: 40,
                autoresize_bottom_margin: 0,
                width: '100%',
                setup: function (editor) {
                  editor.on('init', function () {
                    // �������������� ���������, ���� �����
                  });
                }
              });
              this._tinyMCEInitialized = true;
            }
          });
        }
      });
      diag.render(true);
    });
    html.find('.inventory-remove-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      new Dialog({
        title: game.i18n.localize('MY_RPG.Inventory.ConfirmDeleteTitle'),
        content: `<p>${game.i18n.localize('MY_RPG.Inventory.ConfirmDeleteMessage')}</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('MY_RPG.Inventory.Yes'),
            callback: () => {
              let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
              if (!Array.isArray(inventory)) inventory = Object.values(inventory);
              inventory.splice(index, 1);
              this.actor.update({ 'system.inventoryList': inventory });
            }
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('MY_RPG.Inventory.No')
          }
        },
        default: 'no'
      }).render(true);
    });

    html
      .find('input[name^="system.abilities."], input[name^="system.skills."]')
      .on('change', (ev) => {
        const input = ev.currentTarget;
        // �������� ����� ������� ���������
        const validatedValue = this.validateNumericInput(input);
        // ��������� ������ ������ ��� ���������� �������
        this.actor.update({ [input.name]: validatedValue }, { render: false });
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
          controlSelector: 'a.hex-button'
        }
      ]
    });
  }

  /** @override */
  get template() {
    if (this.actor.type === 'npc') {
      return `systems/myrpg/templates/actor/actor-character-sheet.hbs`;
    }
    return `systems/myrpg/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  /** @override */
  getData() {
    const context = super.getData();
    const actorData = context.data;
    context.system = actorData.system;
    context.flags = actorData.flags;

    if (actorData.type === 'character' || actorData.type === 'npc') {
      this._prepareCharacterData(context);
    }

    context.rollData = context.actor.getRollData();
    return context;
  }

  _prepareCharacterData(context) {
    for (let [k, v] of Object.entries(context.system.abilities)) {
      v.label = game.i18n.localize(CONFIG.MY_RPG.abilities[k]) ?? k;
    }
    for (let [x, c] of Object.entries(context.system.skills)) {
      c.label = game.i18n.localize(CONFIG.MY_RPG.skills[x]) ?? x;
    }
  }

  /**
   * ��������� ����� �� rollable-���������
   */
  async _onToggleWound(event) {
    const idx = parseInt(event.currentTarget.dataset.idx);
    let wounds = this.actor.system.wounds || 0;
    // ���� ������� ���������� ������� ������ �������, ���������, ����� �����������
    wounds = wounds > idx ? idx : idx + 1;
    await this.actor.update({ 'system.wounds': wounds });
  }

  async _onRoll(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const { skill, ability, label } = el.dataset;

    let bonus = 0;
    let abVal = 0;

    if (skill) {
      bonus = parseInt(this.actor.system.skills[skill]?.value) || 0;
      const abKey = this.actor.system.skills[skill].ability;
      abVal = parseInt(this.actor.system.abilities[abKey]?.value) || 0;
    } else if (ability) {
      abVal = parseInt(this.actor.system.abilities[ability]?.value) || 0;
      bonus = abVal; // ��� ������ ����� ��������������
    }

    const { die } = getRankAndDie(abVal);
    const roll = await new Roll(`2d${die} + ${bonus}`).roll({ async: true });
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: label,
      rollMode: game.settings.get('core', 'rollMode')
    });
  }
}
