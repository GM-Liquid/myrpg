/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { getColorRank } from '../helpers/utils.mjs';

function getRankLabel(rank) {
  const mode = game.settings.get('myrpg', 'worldType');
  const base = mode === 'stellar' ? 'MY_RPG.RankNumeric' : 'MY_RPG.RankGradient';
  return game.i18n.localize(`${base}.Rank${rank}`);
}

export class myrpgActorSheet extends ActorSheet {
  _editDialog = null;
  _scrollEffectRowIntoView($row, effectSelector) {
    const $container = this.element.find('.sheet-scrollable');
    if (!$container.length) return;
    const $effect = $row.next(effectSelector);
    if (!$effect.length) return;

    // Run after layout so the effect row has display: table-row
    const container = $container.get(0);
    const el = $effect.get(0);
    const doScroll = () => {
      try {
        const cRect = container.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        // If bottom overflows container, scroll down; if top is above, scroll up
        if (eRect.bottom > cRect.bottom) {
          container.scrollTop += eRect.bottom - cRect.bottom + 4;
        } else if (eRect.top < cRect.top) {
          container.scrollTop -= cRect.top - eRect.top + 4;
        }
      } catch (e) {}
    };
    if (window.requestAnimationFrame) requestAnimationFrame(doScroll);
    else setTimeout(doScroll, 0);
  }
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
        // Remove deprecated/absent plugins for TinyMCE 6 in Foundry v12
        plugins: 'autoresize',
        toolbar: false,
        // contextmenu plugin removed in TinyMCE 6
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

          // Keep plain-text paste without relying on removed paste plugin
          editor.on('paste', (e) => {
            try {
              const cd = e.clipboardData || window.clipboardData;
              if (!cd) return;
              const text = cd.getData('text/plain');
              if (!text) return;
              e.preventDefault();
              editor.insertContent(text.replace(/\n/g, '<br>'));
              dispatch();
            } catch (_) {
              // Fall back to default paste if anything goes wrong
            }
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
    html.find('tr.ability-row .col-name').click((ev) => {
      if (
        $(ev.target).closest('.abilities-remove-row, .abilities-edit-row').length
      )
        return;
      const $row = $(ev.currentTarget).closest('tr.ability-row');
      const expanding = !$row.hasClass('expanded');
      $row.toggleClass('expanded');
      // Explicitly toggle the effect row to avoid any edge-cases with CSS sibling rules
      const $effect = $row.next('.ability-effect-row');
      if ($effect.length) $effect.toggleClass('open', expanding ? true : false);
      if (expanding) this._scrollEffectRowIntoView($row, '.ability-effect-row');
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

      const abilityObj = {
        name: '',
        rank: '',
        effect: '',
        cost: '',
        upgrade1: 'None',
        upgrade2: 'None'
      };
      if (game.settings.get('myrpg', 'worldType') === 'unity') abilityObj.runeType = 'Spell';
      abilities.push(abilityObj);

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
      const isUnity = game.settings.get('myrpg', 'worldType') === 'unity';
      const upgradeValues = [
        'None',
        'Damage',
        'Area',
        'Cost',
        'Range',
        'Duration',
        'Activations',
        'Link'
      ];
      const runeTypes = ['Spell', 'Creature', 'Item', 'Portal', 'Domain', 'Saga'];
      const options1 = upgradeValues
        .map(
          (u) =>
            `<option value="${u}" ${(abilityData.upgrade1 || 'None') === u ? 'selected' : ''}>${game.i18n.localize(
              'MY_RPG.AbilityUpgrades.' + u
            )}</option>`
        )
        .join('');
      const options2 = upgradeValues
        .map(
          (u) =>
            `<option value="${u}" ${(abilityData.upgrade2 || 'None') === u ? 'selected' : ''}>${game.i18n.localize(
              'MY_RPG.AbilityUpgrades.' + u
            )}</option>`
        )
        .join('');
      const optionsType = runeTypes
        .map(
          (t) =>
            `<option value="${t}" ${(abilityData.runeType || 'Spell') === t ? 'selected' : ''}>${game.i18n.localize(
              'MY_RPG.RuneTypes.' + t
            )}</option>`
        )
        .join('');

      const baseRank =
        game.settings.get('myrpg', 'worldType') === 'stellar'
          ? 'MY_RPG.RankNumeric'
          : 'MY_RPG.RankGradient';
      const optionsRank = [
        `<option value="" ${!abilityData.rank ? 'selected' : ''}>${game.i18n.localize('MY_RPG.Rank.Unspecified')}</option>`,
        [1, 2, 3, 4, 5]
          .map(
            (r) =>
              `<option value="${r}" ${Number(abilityData.rank || 0) === r ? 'selected' : ''}>${game.i18n.localize(
                baseRank + '.Rank' + r
              )}</option>`
          )
          .join('')
      ].join('');

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
              <select name="rank">${optionsRank}</select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Effect')}</label>
              <textarea name="effect" class="rich-editor">${abilityData.effect ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Cost')}</label>
              <input type="number" name="cost" value="${abilityData.cost ?? ''}" />
            </div>
            ${isUnity ? `<div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.RuneType')}</label>
              <select name="runeType">${optionsType}</select>
            </div>` : ''}
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Upgrade1')}</label>
              <select name="upgrade1">${options1}</select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Upgrade2')}</label>
              <select name="upgrade2">${options2}</select>
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
            cost: formData.cost ?? '',
            upgrade1: formData.upgrade1 ?? '',
            upgrade2: formData.upgrade2 ?? ''
          };
          if (isUnity) abilities[index].runeType = formData.runeType ?? 'Spell';
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
              cost: formData.cost ?? '',
              upgrade1: formData.upgrade1 ?? '',
              upgrade2: formData.upgrade2 ?? ''
            };
            if (isUnity) abilities[index].runeType = formData.runeType ?? 'Spell';
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
            row
              .find('.col-rank')
              .text(
                formData.rank
                  ? getRankLabel(Number(formData.rank))
                  : game.i18n.localize('MY_RPG.Rank.Unspecified')
              );
            // update corresponding effect row (adjacent sibling)
            row
              .next('.ability-effect-row')
              .find('.col-effect .effect-wrapper')
              .html(formData.effect ?? '');
            row.find('.col-cost').text(formData.cost ?? '');
            if (isUnity)
              row
                .find('.col-type')
                .text(
                  game.i18n.localize(
                    'MY_RPG.RuneTypes.' + (formData.runeType || 'Spell')
                  )
                );
            row
              .find('.col-upg1')
              .text(
                game.i18n.localize(
                  'MY_RPG.AbilityUpgrades.' + (formData.upgrade1 || 'None')
                )
              );
            row
              .find('.col-upg2')
              .text(
                game.i18n.localize(
                  'MY_RPG.AbilityUpgrades.' + (formData.upgrade2 || 'None')
                )
              );
          });
        }
      });
      diag.render(true);
    this._editDialog = diag;
  });

    // ----------------------------------------------------------------------
    // Mods table actions
    // ----------------------------------------------------------------------
    html.find('.mods-section tr.mod-row .col-name').click((ev) => {
      if (
        $(ev.target).closest('.mods-remove-row, .mods-edit-row').length
      )
        return;
      const $row = $(ev.currentTarget).closest('tr.mod-row');
      const expanding = !$row.hasClass('expanded');
      $row.toggleClass('expanded');
      const $effect = $row.next('.mod-effect-row');
      if ($effect.length) $effect.toggleClass('open', expanding ? true : false);
      if (expanding) this._scrollEffectRowIntoView($row, '.mod-effect-row');
    });

    html.find('.mods-add-row').click((ev) => {
      ev.preventDefault();
      let mods = foundry.utils.deepClone(this.actor.system.modsList) || [];
      if (!Array.isArray(mods)) mods = Object.values(mods);
      mods.push({
        name: '',
        rank: '',
        effect: '',
        upgrade1: 'None',
        upgrade2: 'None'
      });
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
      const modOptions = [
        'None',
        'Damage',
        'Area',
        'Cost',
        'Range',
        'Duration',
        'Activations',
        'Link'
      ];
      const modOpts1 = modOptions
        .map(
          (u) =>
            `<option value="${u}" ${(modData.upgrade1 || 'None') === u ? 'selected' : ''}>${game.i18n.localize(
              'MY_RPG.AbilityUpgrades.' + u
            )}</option>`
        )
        .join('');
      const modOpts2 = modOptions
        .map(
          (u) =>
            `<option value="${u}" ${(modData.upgrade2 || 'None') === u ? 'selected' : ''}>${game.i18n.localize(
              'MY_RPG.AbilityUpgrades.' + u
            )}</option>`
        )
        .join('');

      const baseRank =
        game.settings.get('myrpg', 'worldType') === 'stellar'
          ? 'MY_RPG.RankNumeric'
          : 'MY_RPG.RankGradient';
      const optionsRank = [
        `<option value="" ${!modData.rank ? 'selected' : ''}>${game.i18n.localize('MY_RPG.Rank.Unspecified')}</option>`,
        [1, 2, 3, 4, 5]
          .map(
            (r) =>
              `<option value="${r}" ${Number(modData.rank || 0) === r ? 'selected' : ''}>${game.i18n.localize(
                baseRank + '.Rank' + r
              )}</option>`
          )
          .join('')
      ].join('');

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
              <select name="rank">${optionsRank}</select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Effect')}</label>
              <textarea name="effect" class="rich-editor">${modData.effect ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Upgrade1')}</label>
              <select name="upgrade1">${modOpts1}</select>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.AbilityConfig.Upgrade2')}</label>
              <select name="upgrade2">${modOpts2}</select>
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
            upgrade1: formData.upgrade1 ?? '',
            upgrade2: formData.upgrade2 ?? ''
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
              upgrade1: formData.upgrade1 ?? '',
              upgrade2: formData.upgrade2 ?? ''
            };
            this.actor.update(
              { 'system.modsList': mods },
              { render: false }
            );

            const row = this.element.find(
              `.mods-table tr.mod-row[data-index="${index}"]`
            );
            row.find('.col-name').html(formData.name ?? '');
            row
              .find('.col-rank')
              .text(
                formData.rank
                  ? getRankLabel(Number(formData.rank))
                  : game.i18n.localize('MY_RPG.Rank.Unspecified')
              );
            row
              .next('.mod-effect-row')
              .find('.col-effect .effect-wrapper')
              .html(formData.effect ?? '');
            row
              .find('.col-upg1')
              .text(
                game.i18n.localize(
                  'MY_RPG.AbilityUpgrades.' + (formData.upgrade1 || 'None')
                )
              );
            row
              .find('.col-upg2')
              .text(
                game.i18n.localize(
                  'MY_RPG.AbilityUpgrades.' + (formData.upgrade2 || 'None')
                )
              );
          });
        }
      });
      diag.render(true);
      this._editDialog = diag;
    });

    html.find('.inventory-chat-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      const item = this.actor.system.inventoryList[index] || {};
      const lines = [`<strong>${item.name ?? ''}</strong>`];
      if (item.quantity)
        lines.push(
          `${game.i18n.localize('MY_RPG.Inventory.Quantity')}: ${item.quantity}`
        );
      let content = lines.join('<br>');
      if (item.desc) content += `<br><br>${item.desc}`;
      ChatMessage.create({
        content,
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      });
    });

    html.find('.mods-chat-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      const mod = this.actor.system.modsList[index] || {};
      const lines = [`<strong>${mod.name ?? ''}</strong>`];
      if (mod.rank)
        lines.push(
          `${game.i18n.localize('MY_RPG.ModsTable.Rank')}: ${getRankLabel(mod.rank)}`
        );
      if (mod.upgrade1 && mod.upgrade1 !== 'None')
        lines.push(
          `${game.i18n.localize('MY_RPG.ModsTable.Upgrade1')}: ${game.i18n.localize(
            'MY_RPG.AbilityUpgrades.' + mod.upgrade1
          )}`
        );
      if (mod.upgrade2 && mod.upgrade2 !== 'None')
        lines.push(
          `${game.i18n.localize('MY_RPG.ModsTable.Upgrade2')}: ${game.i18n.localize(
            'MY_RPG.AbilityUpgrades.' + mod.upgrade2
          )}`
        );
      let content = lines.join('<br>');
      if (mod.effect) content += `<br><br>${mod.effect}`;
      ChatMessage.create({
        content,
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      });
    });

    html.find('.abilities-chat-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      const ability = this.actor.system.abilitiesList[index] || {};
      const lines = [`<strong>${ability.name ?? ''}</strong>`];
      if (ability.rank)
        lines.push(
          `${game.i18n.localize('MY_RPG.ModsTable.Rank')}: ${getRankLabel(
            ability.rank
          )}`
        );
      if (ability.cost)
        lines.push(
          `${game.i18n.localize('MY_RPG.AbilitiesTable.Cost')}: ${ability.cost}`
        );
      if (
        game.settings.get('myrpg', 'worldType') === 'unity' &&
        ability.runeType
      )
        lines.push(
          `${game.i18n.localize('MY_RPG.RunesTable.RuneType')}: ${game.i18n.localize(
            'MY_RPG.RuneTypes.' + ability.runeType
          )}`
        );
      if (ability.upgrade1 && ability.upgrade1 !== 'None')
        lines.push(
          `${game.i18n.localize('MY_RPG.AbilitiesTable.Upgrade1')}: ${game.i18n.localize(
            'MY_RPG.AbilityUpgrades.' + ability.upgrade1
          )}`
        );
      if (ability.upgrade2 && ability.upgrade2 !== 'None')
        lines.push(
          `${game.i18n.localize('MY_RPG.AbilitiesTable.Upgrade2')}: ${game.i18n.localize(
            'MY_RPG.AbilityUpgrades.' + ability.upgrade2
          )}`
        );
      let content = lines.join('<br>');
      if (ability.effect)
        content += `<br><br>${ability.effect}`;
      ChatMessage.create({
        content,
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      });
    });

    // ----------------------------------------------------------------------
    // Armor table actions
    // ----------------------------------------------------------------------
    html.find('.armor-add-row').click((ev) => {
      ev.preventDefault();
      let list = foundry.utils.deepClone(this.actor.system.armorList) || [];
      if (!Array.isArray(list)) list = Object.values(list);
      list.push({
        name: '',
        desc: '',
        itemPhys: 0,
        itemAzure: 0,
        itemMental: 0,
        itemShield: 0,
        itemSpeed: 0,
        quantity: 1,
        equipped: false
      });
      this.actor.update({ 'system.armorList': list });
    });

    html.find('tr.armor-row').click((ev) => {
      if (
        $(ev.target).closest('.armor-remove-row, .armor-edit-row, .armor-equip-checkbox, .armor-chat-row').length
      )
        return;
      const $row = $(ev.currentTarget);
      const expanding = !$row.hasClass('expanded');
      $row.toggleClass('expanded');
      const $effect = $row.next('.armor-effect-row');
      if ($effect.length) $effect.toggleClass('open', expanding ? true : false);
      if (expanding) this._scrollEffectRowIntoView($row, '.armor-effect-row');
    });

    html.find('.armor-edit-row').click((ev) => {
      ev.preventDefault();
      if (this._editDialog) this._editDialog.close();

      const index = Number(ev.currentTarget.dataset.index);
      let list = foundry.utils.deepClone(this.actor.system.armorList) || [];
      if (!Array.isArray(list)) list = Object.values(list);
      const itemData = list[index] || {};

      let diag = new Dialog({
        title: game.i18n.localize('MY_RPG.ArmorTable.EditTitle'),
        content: `
          <form>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.Inventory.Name')}</label>
              <input type="text" name="name" value="${itemData.name ?? ''}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.ArmorItem.DescriptionLabel')}</label>
              <textarea name="desc" class="rich-editor">${itemData.desc ?? ''}</textarea>
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.ArmorItem.BonusPhysicalLabel')}</label>
              <input type="number" name="itemPhys" value="${itemData.itemPhys ?? 0}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.ArmorItem.BonusMagicalLabel')}</label>
              <input type="number" name="itemAzure" value="${itemData.itemAzure ?? 0}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.ArmorItem.BonusPsychicLabel')}</label>
              <input type="number" name="itemMental" value="${itemData.itemMental ?? 0}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.ArmorItem.ShieldLabel')}</label>
              <input type="number" name="itemShield" value="${itemData.itemShield ?? 0}" />
            </div>
            <div class="form-group">
              <label>${game.i18n.localize('MY_RPG.ArmorItem.BonusSpeedLabel')}</label>
              <input type="number" name="itemSpeed" value="${itemData.itemSpeed ?? 0}" />
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
          list[index] = {
            name: formData.name ?? '',
            desc: formData.desc ?? '',
            itemPhys: formData.itemPhys ?? 0,
            itemAzure: formData.itemAzure ?? 0,
            itemMental: formData.itemMental ?? 0,
            itemShield: formData.itemShield ?? 0,
            itemSpeed: formData.itemSpeed ?? 0,
            quantity: itemData.quantity ?? 1,
            equipped: itemData.equipped ?? false
          };
          this.actor.update({ 'system.armorList': list }).then(() => {
            // force refresh of derived stats in case values didn't change
            this.render(false);
          });
          this._editDialog = null;
        },
        render: (html) => {
          html.find('textarea.rich-editor').each((i, el) => this.initializeRichEditor(el));

          const form = html.find('form');
          form.on('input', 'input, textarea', () => {
            tinymce.triggerSave();
            const formEl = form[0];
            const fd = new FormData(formEl);
            let formData = {};
            for (let [k, v] of fd.entries()) {
              formData[k] = v;
            }
              list[index] = {
                name: formData.name ?? '',
                desc: formData.desc ?? '',
                itemPhys: formData.itemPhys ?? 0,
                itemAzure: formData.itemAzure ?? 0,
                itemMental: formData.itemMental ?? 0,
                itemShield: formData.itemShield ?? 0,
                itemSpeed: formData.itemSpeed ?? 0,
                quantity: list[index].quantity ?? 1,
                equipped: list[index].equipped ?? false
              };
            this.actor.update({ 'system.armorList': list }, { render: false });

            const row = this.element.find(`.abilities-table tr.armor-row[data-index="${index}"]`);
            row.find('.col-name').html(formData.name ?? '');
            row
              .next('.armor-effect-row')
              .find('.col-effect .effect-wrapper')
              .html(this._armorEffectHtml(list[index]));
            row.find('.col-cost .quantity-value').text(list[index].quantity ?? '');
          });
        }
      });
      diag.render(true);
      this._editDialog = diag;
    });

    html.find('.armor-remove-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      new Dialog({
        title: game.i18n.localize('MY_RPG.ArmorTable.ConfirmDeleteTitle'),
        content: `<p>${game.i18n.localize('MY_RPG.ArmorTable.ConfirmDeleteMessage')}</p>`,
        buttons: {
          yes: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('MY_RPG.ArmorTable.Yes'),
            callback: () => {
              let list = foundry.utils.deepClone(this.actor.system.armorList) || [];
              if (!Array.isArray(list)) list = Object.values(list);
              list.splice(index, 1);
              this.actor.update({ 'system.armorList': list });
            }
          },
          no: {
            icon: '<i class="fas fa-times"></i>',
            label: game.i18n.localize('MY_RPG.ArmorTable.No')
          }
        },
        default: 'no'
      }).render(true);
    });

    html.find('.armor-chat-row').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      const item = this.actor.system.armorList[index] || {};
      const lines = [`<strong>${item.name ?? ''}</strong>`];
      if (item.quantity)
        lines.push(`${game.i18n.localize('MY_RPG.Inventory.Quantity')}: ${item.quantity}`);
      if (item.itemPhys)
        lines.push(`${game.i18n.localize('MY_RPG.ArmorItem.BonusPhysicalLabel')}: ${item.itemPhys}`);
      if (item.itemAzure)
        lines.push(`${game.i18n.localize('MY_RPG.ArmorItem.BonusMagicalLabel')}: ${item.itemAzure}`);
      if (item.itemMental)
        lines.push(`${game.i18n.localize('MY_RPG.ArmorItem.BonusPsychicLabel')}: ${item.itemMental}`);
      if (item.itemShield)
        lines.push(`${game.i18n.localize('MY_RPG.ArmorItem.ShieldLabel')}: ${item.itemShield}`);
      if (item.itemSpeed)
        lines.push(`${game.i18n.localize('MY_RPG.ArmorItem.BonusSpeedLabel')}: ${item.itemSpeed}`);
      let content = lines.join('<br>');
      if (item.desc) content += `<br><br>${item.desc}`;
      ChatMessage.create({
        content,
        speaker: ChatMessage.getSpeaker({ actor: this.actor })
      });
    });

    html.find('.armor-quantity-plus').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      let list = foundry.utils.deepClone(this.actor.system.armorList) || [];
      if (!Array.isArray(list)) list = Object.values(list);
      const cur = parseInt(list[index]?.quantity) || 0;
      list[index].quantity = cur + 1;
      this.actor
        .update({ 'system.armorList': list }, { render: false })
        .then(() => {
          const row = this.element.find(
            `.abilities-table tr.armor-row[data-index="${index}"]`
          );
          row.find('.col-cost .quantity-value').text(list[index].quantity);
          // Refresh derived fields affected by armor changes
          this._refreshDerived(html);
        });
    });

    html.find('.armor-quantity-minus').click((ev) => {
      ev.preventDefault();
      const index = Number(ev.currentTarget.dataset.index);
      let list = foundry.utils.deepClone(this.actor.system.armorList) || [];
      if (!Array.isArray(list)) list = Object.values(list);
      const cur = parseInt(list[index]?.quantity) || 0;
      list[index].quantity = Math.max(0, cur - 1);
      this.actor
        .update({ 'system.armorList': list }, { render: false })
        .then(() => {
          const row = this.element.find(
            `.abilities-table tr.armor-row[data-index="${index}"]`
          );
          row.find('.col-cost .quantity-value').text(list[index].quantity);
          // Refresh derived fields affected by armor changes
          this._refreshDerived(html);
        });
    });

    html.find('.armor-equip-checkbox').change((ev) => {
      const index = Number(ev.currentTarget.dataset.index);
      const checked = ev.currentTarget.checked;
      let list = foundry.utils.deepClone(this.actor.system.armorList) || [];
      if (!Array.isArray(list)) list = Object.values(list);
      list.forEach((item, i) => {
        item.equipped = checked && i === index;
      });
      this.actor
        .update({ 'system.armorList': list }, { render: false })
        .then(() => {
          // Sync checkboxes to reflect exclusivity
          html.find('.armor-equip-checkbox').each((i, el) => {
            $(el).prop('checked', list[i]?.equipped);
          });
          // Refresh derived fields affected by armor changes
          this._refreshDerived(html);
        });
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

    html.find('.inventory tr.inventory-row .col-name').click((ev) => {
      if (
        $(ev.target).closest('.inventory-remove-row, .inventory-edit-row').length
      )
        return;
      const $row = $(ev.currentTarget).closest('tr.inventory-row');
      const expanding = !$row.hasClass('expanded');
      $row.toggleClass('expanded');
      const $effect = $row.next('.inventory-effect-row');
      if ($effect.length) $effect.toggleClass('open', expanding ? true : false);
      if (expanding) this._scrollEffectRowIntoView($row, '.inventory-effect-row');
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
            quantity: itemData.quantity ?? ''
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
              quantity: itemData.quantity ?? ''
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
              .next('.inventory-effect-row')
              .find('.col-effect .effect-wrapper')
              .html(formData.desc ?? '');
            row
              .find('.col-cost .quantity-value')
              .text(inventory[index].quantity ?? '');
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

    if (game.settings.get('myrpg', 'worldType') === 'unity') {
      context.runeMax =
        (Number(context.system.abilities.int?.value || 0) * 2) + 5;
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

      // Minimum skill bonus from ability removed
    } else if (ability) {
      abVal = parseInt(this.actor.system.abilities[ability]?.value) || 0;
      bonus = abVal; // ��� ������ ����� ��������������
    }

    const roll = await new Roll(`1d10 + ${bonus}`).roll({ async: true });
    let flavor = label;
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      rollMode: game.settings.get('core', 'rollMode')
    });
  }

  /**
   * Update derived fields on the sheet (speed, defenses, health)
   * after an in-place armor change without re-rendering the sheet.
   */
  _refreshDerived(html) {
    const s = this.actor.system || {};
    const setVal = (name, val) => {
      html.find(`input[name="${name}"]`).val(val ?? 0);
    };

    // Speed
    setVal('system.speed.value', s?.speed?.value);
    // Defenses
    setVal('system.defenses.physical', s?.defenses?.physical);
    setVal('system.defenses.azure', s?.defenses?.azure);
    setVal('system.defenses.mental', s?.defenses?.mental);
    // Health
    setVal('system.health.max', s?.health?.max);
    setVal('system.health.value', s?.health?.value);
  }

  _armorEffectHtml(item) {
    const lines = [];
    if (item.quantity)
      lines.push(
        `${game.i18n.localize('MY_RPG.Inventory.Quantity')}: ${item.quantity}`
      );
    if (item.itemPhys)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusPhysicalLabel')}: ${item.itemPhys}`
      );
    if (item.itemAzure)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusMagicalLabel')}: ${item.itemAzure}`
      );
    if (item.itemMental)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusPsychicLabel')}: ${item.itemMental}`
      );
    if (item.itemShield)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.ShieldLabel')}: ${item.itemShield}`
      );
    if (item.itemSpeed)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusSpeedLabel')}: ${item.itemSpeed}`
      );
    let html = lines.join('<br>');
    if (item.desc) html += `<br><br>${item.desc}`;
    return html;
  }
}
