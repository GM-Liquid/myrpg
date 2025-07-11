/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { getColorRank } from '../helpers/utils.mjs';

export class myrpgActorSheet extends ActorSheet {
  _editDialog = null;
  /** @override */
  async _render(force = false, options = {}) {
    const scrollContainer = this.element.find('.sheet-scrollable');
    const scrollPos = scrollContainer.scrollTop();
    await super._render(force, options);

    this.element.find('.sheet-scrollable').scrollTop(scrollPos);
  }

  async close(options = {}) {
    return super.close(options);
  }

  validateNumericInput(input) {
    let val = parseInt(input.value, 10);
    const isAbility = input.name.includes('system.abilities.');
    const labelKey = isAbility ? 'MY_RPG.NumericWarning.Attribute' : 'MY_RPG.NumericWarning.Skill';
    const label = game.i18n.localize(labelKey);
    const minVal = 0;

    if (isNaN(val)) {
      val = minVal;
    }
    if (val < minVal) {
      ui.notifications.warn(
        game.i18n.format('MY_RPG.NumericWarning.Min', {
          label: label,
          min: minVal
        })
      );
      val = minVal;
    }
    input.value = val;
    return val;
  }

  initializeRichEditor(element) {
    if (!element._tinyMCEInitialized) {
      tinymce.init({
        target: element,
        inline: false,
        menubar: false,
        branding: false,
        statusbar: false,
        plugins: 'autoresize contextmenu paste',
        toolbar: false,
        contextmenu: 'bold italic strikethrough',
        valid_elements: 'p,strong/b,em/i,strike/s,br',
        content_style:
          'body { margin: 0; padding: 5px; font-family: inherit; font-size: inherit; color: #1b1210; } p { margin: 0; }',
        autoresize_min_height: 40,
        autoresize_bottom_margin: 0,
        width: '100%',
        setup: (editor) => {
          const dispatch = () => {
            editor.save();
            element.dispatchEvent(new Event('input', { bubbles: true }));
          };

          editor.on('Paste', (e) => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            editor.insertContent(text.replace(/\n/g, '<br>'));
            dispatch();
          });

          editor.on('KeyUp', dispatch);
          editor.on('Change', dispatch);
        }
      });
      element._tinyMCEInitialized = true;
    }
  }


  activateListeners(html) {
    super.activateListeners(html);
    html
      .find('textarea.rich-editor')
      .each((i, el) => this.initializeRichEditor(el));
    html.find('.wound-box').click(this._onToggleWound.bind(this));

    // ----------------------------------------------------------------------
    // Rollable �������� (������)
    // ----------------------------------------------------------------------
    html.find('.rollable').click(this._onRoll.bind(this));

    // ----------------------------------------------------------------------
    // ������� ������������
    // ----------------------------------------------------------------------
    const $table = html.find('.abilities-table');

    // toggle expanded ability description
    html.find('tr.ability-row').click((ev) => {
      if ($(ev.target).closest('.abilities-remove-row, .abilities-edit-row').length) return;
      $(ev.currentTarget).toggleClass('expanded');
    });

    // ������ "������" (���� ���-�� ������������)
    html.find('.ability-cancel').click((ev) => {
      ev.preventDefault();
      this.close();
    });

    // �������� ����� ����������� (������)
    html.find('.abilities-section .abilities-add-row').click((ev) => {
      ev.preventDefault();
      let abilities = foundry.utils.deepClone(this.actor.system.abilitiesList) || [];
      if (!Array.isArray(abilities)) abilities = Object.values(abilities);

      abilities.push({
        name: '',
        rank: '',
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

    // open ability edit dialog
    html.find('.abilities-edit-row').click((ev) => {
      ev.preventDefault();
      if (this._editDialog) {
        this._editDialog.close();
      }

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
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Cost')}</label>
              <input type="number" name="cost" value="${abilityData.cost ?? ''}" />
            </div>
          </form>
        `,
        buttons: {},
        close: (htmlDialog) => {
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
            cost: formData.cost ?? ''
          };
          this.actor.update({ 'system.abilitiesList': abilities });
          this._editDialog = null;
        },
        render: (html) => {
          html.find('textarea.rich-editor').each((i, element) => {
            // ensure TinyMCE editors are created
            this.initializeRichEditor(element);
          });

          const form = html.find('form');
          form.on('input', 'input, textarea', () => {
            tinymce.triggerSave();
            const formEl = form[0];
            const fd = new FormData(formEl);
            let formData = {};
            for (let [k, v] of fd.entries()) {
              formData[k] = v;
            }
            abilities[index] = {
              name: formData.name ?? '',
              rank: formData.rank ?? '',
              effect: formData.effect ?? '',
              cost: formData.cost ?? ''
            };
            // update actor data without re-render to prevent flicker
            this.actor.update(
              { 'system.abilitiesList': abilities },
              { render: false }
            );

            // update the table row manually
            const row = this.element.find(
              `.abilities-table tr.ability-row[data-index="${index}"]`
            );
            row.find('.col-name').html(formData.name ?? '');
            row.find('.col-rank').text(formData.rank ?? '');
            row.find('.col-effect .effect-wrapper').html(formData.effect ?? '');
            row.find('.col-cost').text(formData.cost ?? '');
          });
        }
      });
      diag.render(true);
    this._editDialog = diag;
  });

    // ----------------------------------------------------------------------
    // Mods table actions
    // ----------------------------------------------------------------------
    html.find('.mods-section tr.mod-row').click((ev) => {
      if ($(ev.target).closest('.mods-remove-row, .mods-edit-row').length) return;
      $(ev.currentTarget).toggleClass('expanded');
    });

    html.find('.mods-add-row').click((ev) => {
      ev.preventDefault();
      let mods = foundry.utils.deepClone(this.actor.system.modsList) || [];
      if (!Array.isArray(mods)) mods = Object.values(mods);
      mods.push({ name: '', rank: '', effect: '', cost: '' });
      this.actor.update({ 'system.modsList': mods });
    });

    html.find('.mods-remove-row').click((ev) => {
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
              let mods = foundry.utils.deepClone(this.actor.system.modsList) || [];
              if (!Array.isArray(mods)) mods = Object.values(mods);
              mods.splice(index, 1);
              this.actor.update({ 'system.modsList': mods });
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

    html.find('.mods-edit-row').click((ev) => {
      ev.preventDefault();
      if (this._editDialog) {
        this._editDialog.close();
      }

      const index = Number(ev.currentTarget.dataset.index);
      let mods = foundry.utils.deepClone(this.actor.system.modsList) || [];
      if (!Array.isArray(mods)) mods = Object.values(mods);
      const modData = mods[index] || {};

      let diag = new Dialog({
        title: game.i18n.localize('MY_RPG.AbilityConfig.Title'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Name')}</label>
              <input type="text" name="name" value="${modData.name ?? ''}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Rank')}</label>
              <input type="text" name="rank" value="${modData.rank ?? ''}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Effect')}</label>
              <textarea name="effect" class="rich-editor">${modData.effect ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Cost')}</label>
              <input type="number" name="cost" value="${modData.cost ?? ''}" />
            </div>
          </form>
        `,
        buttons: {},
        close: (htmlDialog) => {
          tinymce.triggerSave();
          const formEl = htmlDialog.find('form')[0];
          const fd = new FormData(formEl);
          let formData = {};
          for (let [k, v] of fd.entries()) {
            formData[k] = v;
          }
          mods[index] = {
            name: formData.name ?? '',
            rank: formData.rank ?? '',
            effect: formData.effect ?? '',
            cost: formData.cost ?? ''
          };
          this.actor.update({ 'system.modsList': mods });
          this._editDialog = null;
        },
        render: (html) => {
          html.find('textarea.rich-editor').each((i, element) => {
            this.initializeRichEditor(element);
          });

          const form = html.find('form');
          form.on('input', 'input, textarea', () => {
            tinymce.triggerSave();
            const formEl = form[0];
            const fd = new FormData(formEl);
            let formData = {};
            for (let [k, v] of fd.entries()) {
              formData[k] = v;
            }
            mods[index] = {
              name: formData.name ?? '',
              rank: formData.rank ?? '',
              effect: formData.effect ?? '',
              cost: formData.cost ?? ''
            };
            this.actor.update(
              { 'system.modsList': mods },
              { render: false }
            );

            const row = this.element.find(
              `.mods-table tr.mod-row[data-index="${index}"]`
            );
            row.find('.col-name').html(formData.name ?? '');
            row.find('.col-rank').text(formData.rank ?? '');
            row.find('.col-effect .effect-wrapper').html(formData.effect ?? '');
            row.find('.col-cost').text(formData.cost ?? '');
          });
        }
      });
      diag.render(true);
      this._editDialog = diag;
    });

    // ----------------------------------------------------------------------
    // ������� ���������
    // ----------------------------------------------------------------------
    html.find('.inventory-add-row').click((ev) => {
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

    html.find('.inventory tr.inventory-row').click((ev) => {
      if ($(ev.target).closest('.inventory-remove-row, .inventory-edit-row').length) return;
      $(ev.currentTarget).toggleClass('expanded');
    });

    html.find('.inventory-edit-row').click((ev) => {
      ev.preventDefault();
      if (this._editDialog) {
        this._editDialog.close();
      }

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
        buttons: {},
        close: (htmlDialog) => {
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
          this._editDialog = null;
        },
        render: (html) => {
          html
            .find('textarea.rich-editor')
            .each((i, el) => this.initializeRichEditor(el));

          const form = html.find('form');
          form.on('input', 'input, textarea', () => {
            tinymce.triggerSave();
            const formEl = form[0];
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
            // update actor data without re-render
            this.actor.update(
              { 'system.inventoryList': inventory },
              { render: false }
            );

            // update the table row manually
            const row = this.element.find(
              `.abilities-table tr.inventory-row[data-index="${index}"]`
            );
            row.find('.col-name').html(formData.name ?? '');
            row
              .find('.col-effect .effect-wrapper')
              .html(formData.desc ?? '');
            row
              .find('.col-cost .quantity-value')
              .text(formData.quantity ?? '');
          });
        }
      });
      diag.render(true);
      this._editDialog = diag;
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

    html.find('.inventory-quantity-plus').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
      if (!Array.isArray(inventory)) inventory = Object.values(inventory);
      const current = parseInt(inventory[index]?.quantity) || 0;
      inventory[index].quantity = current + 1;
      this.actor.update({ 'system.inventoryList': inventory }, { render: false });
      const row = this.element.find(
        `.abilities-table tr.inventory-row[data-index="${index}"]`
      );
      row.find('.col-cost .quantity-value').text(inventory[index].quantity);
    });

    html.find('.inventory-quantity-minus').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      let inventory = foundry.utils.deepClone(this.actor.system.inventoryList) || [];
      if (!Array.isArray(inventory)) inventory = Object.values(inventory);
      const current = parseInt(inventory[index]?.quantity) || 0;
      inventory[index].quantity = Math.max(0, current - 1);
      this.actor.update({ 'system.inventoryList': inventory }, { render: false });
      const row = this.element.find(
        `.abilities-table tr.inventory-row[data-index="${index}"]`
      );
      row.find('.col-cost .quantity-value').text(inventory[index].quantity);
    });

    html
      .find('input[name^="system.abilities."], input[name^="system.skills."]')
      .on('change', (ev) => {
        const input = ev.currentTarget;
        const validatedValue = this.validateNumericInput(input);
        this.actor.update({ [input.name]: validatedValue }).then(() => {
          this.render(false);
        });
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
      v.rankClass = 'rank' + getColorRank(v.value);
    }
    const order = [
      'liderstvo',
      'obman',
      'diplomatiya',
      'stitiyannost',
      'psionika',
      'predvidenie',
      'biomantia',
      'kinetica',
      'atletika',
      'zapugivanie',
      'akrobatika',
      'skrytost',
      'strelba',
      'upravlenie_transportom',
      'lovkost_ruk',
      'blizhniy_boy',
      'analiz',
      'tekhnika',
      'priroda',
      'kultura',
      'vnimanie',
      'meditsina',
      'oruzheynoe_delo',
      'znanie_azura',
      'artefaktorika',
      'manipulatsiya'
    ];
    const sorted = {};
    for (let key of order) {
      if (context.system.skills[key]) {
        const c = context.system.skills[key];
        c.label = game.i18n.localize(CONFIG.MY_RPG.skills[key]) ?? key;
        c.rankClass = 'rank' + getColorRank(c.value);
        sorted[key] = c;
      }
    }
    context.system.skills = sorted;
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
    let minimal = false;

    if (skill) {
      bonus = parseInt(this.actor.system.skills[skill]?.value) || 0;
      const abKey = this.actor.system.skills[skill].ability;
      abVal = parseInt(this.actor.system.abilities[abKey]?.value) || 0;

      const minBonus = Math.ceil(abVal / 2);
      if (bonus < minBonus) {
        bonus = minBonus;
        minimal = true;
      }
    } else if (ability) {
      abVal = parseInt(this.actor.system.abilities[ability]?.value) || 0;
      bonus = abVal; // ��� ������ ����� ��������������
    }

    const roll = await new Roll(`1d10 + ${bonus}`).roll({ async: true });
    let flavor = label;
    if (minimal) flavor += `: ${game.i18n.localize('MY_RPG.MinimalBonus')}`;
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      rollMode: game.settings.get('core', 'rollMode')
    });
  }
}
