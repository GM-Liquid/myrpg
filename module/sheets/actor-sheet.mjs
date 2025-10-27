/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */

import { debugLog } from '../config.mjs';
import { getColorRank } from '../helpers/utils.mjs';


const ITEM_GROUP_CONFIG = [
  {
    key: 'abilities',
    type: 'ability',
    tab: 'abilities',
    icon: 'fas fa-magic',
    labelKey: 'MY_RPG.ItemGroups.Abilities',
    emptyKey: 'MY_RPG.ItemGroups.EmptyAbilities',
    createKey: 'MY_RPG.ItemGroups.CreateAbility',
    newNameKey: 'MY_RPG.ItemGroups.NewAbility',
    showQuantity: false,
    allowEquip: false,
    exclusive: false
  },
  {
    key: 'mods',
    type: 'mod',
    tab: 'abilities',
    icon: 'fas fa-cogs',
    labelKey: 'MY_RPG.ItemGroups.Mods',
    emptyKey: 'MY_RPG.ItemGroups.EmptyMods',
    createKey: 'MY_RPG.ItemGroups.CreateMod',
    newNameKey: 'MY_RPG.ItemGroups.NewMod',
    showQuantity: false,
    allowEquip: false,
    exclusive: false
  },
  {
    key: 'weapons',
    type: 'weapon',
    tab: 'inventory',
    icon: 'fas fa-crosshairs',
    labelKey: 'MY_RPG.ItemGroups.Weapons',
    emptyKey: 'MY_RPG.ItemGroups.EmptyWeapons',
    createKey: 'MY_RPG.ItemGroups.CreateWeapon',
    newNameKey: 'MY_RPG.ItemGroups.NewWeapon',
    showQuantity: true,
    allowEquip: true,
    exclusive: false
  },
  {
    key: 'armor',
    type: 'armor',
    tab: 'inventory',
    icon: 'fas fa-shield-alt',
    labelKey: 'MY_RPG.ItemGroups.Armor',
    emptyKey: 'MY_RPG.ItemGroups.EmptyArmor',
    createKey: 'MY_RPG.ItemGroups.CreateArmor',
    newNameKey: 'MY_RPG.ItemGroups.NewArmor',
    showQuantity: true,
    allowEquip: true,
    exclusive: true
  },
  {
    key: 'gear',
    type: 'gear',
    tab: 'inventory',
    icon: 'fas fa-toolbox',
    labelKey: 'MY_RPG.ItemGroups.Gear',
    emptyKey: 'MY_RPG.ItemGroups.EmptyGear',
    createKey: 'MY_RPG.ItemGroups.CreateGear',
    newNameKey: 'MY_RPG.ItemGroups.NewGear',
    showQuantity: true,
    allowEquip: false,
    exclusive: false
  }
];

const ITEM_GROUP_CONFIG_BY_KEY = ITEM_GROUP_CONFIG.reduce((acc, config) => {
  acc[config.key] = config;
  return acc;
}, {});
function getRankLabel(rank) {
  const mode = game.settings.get('myrpg', 'worldType');
  const base = mode === 'stellar' ? 'MY_RPG.RankNumeric' : 'MY_RPG.RankGradient';
  return game.i18n.localize(`${base}.Rank${rank}`);
}

export class myrpgActorSheet extends ActorSheet {
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
    const $html = html instanceof jQuery ? html : $(html);
    $html.find('textarea.rich-editor').each((i, el) => this.initializeRichEditor(el));
    $html.find('.stress-cell').on('click', this._onStressCellClick.bind(this));
    $html.find('.wound-cell').on('click', this._onWoundCellClick.bind(this));
    $html.find('.rollable').on('click', this._onRoll.bind(this));

    $html.on('click', '.item-create', this._onItemCreate.bind(this));
    $html.on('click', '.item-edit', this._onItemEdit.bind(this));
    $html.on('click', '.item-delete', this._onItemDelete.bind(this));
    $html.on('click', '.item-chat', this._onItemChat.bind(this));
    $html.on('click', '.item-quantity-step', this._onItemQuantityStep.bind(this));
    $html.on('change', '.item-equip-checkbox', this._onItemEquipChange.bind(this));

    $html
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
    context.isCharacter = actorData.type === 'character';
    context.isNpc = actorData.type === 'npc';

    if (context.isCharacter || context.isNpc) {
      this._prepareCharacterData(context);
    }

    const worldType = game.settings.get('myrpg', 'worldType');
    if (worldType === 'unity') {
      context.runeMax = (Number(context.system.abilities.int?.value || 0) * 2) + 5;
    }

    context.rollData = context.actor.getRollData();

    const itemGroups = this._buildItemGroups();
    const abilityGroup = itemGroups.find((group) => group.key === 'abilities');
    if (abilityGroup) {
      abilityGroup.capacity = worldType === 'unity'
        ? { value: abilityGroup.count, max: context.runeMax ?? 0 }
        : null;
      context.abilityCount = abilityGroup.count;
    } else {
      context.abilityCount = 0;
    }

    context.itemGroups = itemGroups.reduce((acc, group) => {
      (acc[group.tab] ??= []).push(group);
      return acc;
    }, {});
    context.itemControls = this._getItemControlLabels();

    return context;
  }


  _prepareCharacterData(context) {
    const isCharacter = Boolean(context.isCharacter);
    const isNpc = Boolean(context.isNpc);
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

    const stress = context.system.stress ?? { value: 0, max: 0 };
    const stressValue = Number(stress.value) || 0;
    const stressMax = Number(stress.max) || 0;
    context.system.stressTrack = Array.from({ length: Math.max(stressMax, 0) }, (_, index) => ({
      index,
      filled: index < stressValue,
      ariaLabel: game.i18n.format('MY_RPG.Stress.CellAria', { index: index + 1 })
    }));

    if (isCharacter) {
      const woundState = context.system.wounds ?? { minor: false, severe: false };
      const woundDefs = [
        {
          type: 'minor',
          labelKey: 'MY_RPG.Wounds.Minor',
          abbrKey: 'MY_RPG.Wounds.MinorAbbrev',
          ariaKey: 'MY_RPG.Wounds.MinorAria'
        },
        {
          type: 'severe',
          labelKey: 'MY_RPG.Wounds.Severe',
          abbrKey: 'MY_RPG.Wounds.SevereAbbrev',
          ariaKey: 'MY_RPG.Wounds.SevereAria'
        }
      ];
      context.system.woundTrack = woundDefs.map((def) => ({
        type: def.type,
        labelKey: def.labelKey,
        abbr: game.i18n.localize(def.abbrKey),
        ariaLabel: game.i18n.localize(def.ariaKey),
        filled: Boolean(woundState?.[def.type])
      }));
    } else if (isNpc) {
      context.system.woundTrack = [];
    }
  }

  /**
   * Toggle stress and wound cells without forcing a full sheet re-render.
   */
  async _onStressCellClick(event) {
    event.preventDefault();
    const index = Number(event.currentTarget.dataset.index) || 0;
    const stress = this.actor.system.stress || { value: 0, max: 0 };
    const max = Number(stress.max) || 0;
    const current = Number(stress.value) || 0;
    const next =
      index < current
        ? index
        : Math.min(index + 1, max);
    await this.actor.update({ 'system.stress.value': next }, { render: false });
    this._updateStressTrack(this.element, next);
  }

  async _onWoundCellClick(event) {
    event.preventDefault();
    const type = event.currentTarget.dataset.type;
    if (!type) return;
    const current = Boolean(this.actor.system.wounds?.[type]);
    const update = {};
    update['system.wounds.' + type] = !current;
    await this.actor.update(update, { render: false });
    this._updateWoundTrack(this.element);
  }

  _getWoundPenalty() {
    const wounds = this.actor.system.wounds || {};
    let penalty = 0;
    if (wounds.minor) penalty += 1;
    if (wounds.severe) penalty += 2;
    return penalty;
  }

  async _onRoll(event) {
    event.preventDefault();
    const el = event.currentTarget;
    const { skill, ability, label } = el.dataset;

    let bonus = 0;
    let abVal = 0;
    let minimal = false;

    if (skill) {
      const skillData = this.actor.system.skills?.[skill] || {};
      bonus = parseInt(skillData.value) || 0;
      const abKey = skillData.ability;
      if (abKey) {
        abVal = parseInt(this.actor.system.abilities[abKey]?.value) || 0;
      }
      bonus += this._getEquippedWeaponBonus(skill);

      // Minimum skill bonus from ability removed
    } else if (ability) {
      abVal = parseInt(this.actor.system.abilities[ability]?.value) || 0;
      bonus = abVal; // ��� ������ ����� ��������������
    }

    const woundPenalty = this._getWoundPenalty();
    if (woundPenalty) bonus -= woundPenalty;
    const roll = await new Roll('1d10 + @mod', { mod: bonus }).roll({ async: true });
    let flavor = label;
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor,
      rollMode: game.settings.get('core', 'rollMode')
    });
  }

  /**
   * Update derived fields on the sheet (speed, defenses, stress and wounds)
   * after an in-place change without re-rendering the sheet.
   */
  _refreshDerived(html) {
    const s = this.actor.system || {};
    const $root = html instanceof jQuery ? html : $(html ?? this.element);
    const setVal = (name, val) => {
      $root.find(`input[name="${name}"]`).val(val ?? 0);
    };

    // Speed
    setVal('system.speed.value', s?.speed?.value);
    // Defenses
    setVal('system.defenses.physical', s?.defenses?.physical);
    setVal('system.defenses.azure', s?.defenses?.azure);
    setVal('system.defenses.mental', s?.defenses?.mental);

    this._updateStressTrack($root);
    this._updateWoundTrack($root);
  }

  _updateStressTrack(root, explicitValue) {
    const $root = root instanceof jQuery ? root : $(root ?? this.element);
    const stress = this.actor.system.stress || { value: 0, max: 0 };
    const value =
      typeof explicitValue === 'number' ? explicitValue : Number(stress.value) || 0;
    const $track = $root.find('.stress-track');
    if (!$track.length) return;
    $track.find('.stress-cell').each((i, el) => {
      const filled = i < value;
      el.classList.toggle('filled', filled);
      el.setAttribute('aria-pressed', filled ? 'true' : 'false');
    });
  }

  _updateWoundTrack(root) {
    const $root = root instanceof jQuery ? root : $(root ?? this.element);
    const wounds = this.actor.system.wounds || { minor: false, severe: false };
    const $track = $root.find('.wound-track');
    if (!$track.length) return;
    $track.find('.wound-cell').each((_, el) => {
      const type = el.dataset.type;
      const filled = Boolean(wounds?.[type]);
      el.classList.toggle('filled', filled);
      el.setAttribute('aria-pressed', filled ? 'true' : 'false');
    });
  }

  _getItemControlLabels() {
    return {
      edit: game.i18n.localize('MY_RPG.ItemControls.Edit'),
      delete: game.i18n.localize('MY_RPG.ItemControls.Delete'),
      chat: game.i18n.localize('MY_RPG.ItemControls.Chat'),
      equip: game.i18n.localize('MY_RPG.ItemControls.Equip'),
      equipAria: game.i18n.localize('MY_RPG.ItemControls.EquipAria'),
      quantity: game.i18n.localize('MY_RPG.ItemControls.Quantity'),
      quantityIncrease: game.i18n.localize('MY_RPG.ItemControls.QuantityIncrease'),
      quantityDecrease: game.i18n.localize('MY_RPG.ItemControls.QuantityDecrease')
    };
  }

  _buildItemGroups() {
    return ITEM_GROUP_CONFIG.map((config) => {
      const items = this.actor.itemTypes?.[config.type] ?? [];
      const preparedItems = items.map((item) => this._prepareItemForDisplay(item, config));
      return {
        key: config.key,
        type: config.type,
        tab: config.tab,
        icon: config.icon,
        label: game.i18n.localize(config.labelKey),
        empty: game.i18n.localize(config.emptyKey),
        createLabel: game.i18n.localize(config.createKey),
        newNameKey: config.newNameKey,
        showQuantity: Boolean(config.showQuantity),
        allowEquip: Boolean(config.allowEquip),
        exclusive: Boolean(config.exclusive),
        items: preparedItems,
        count: preparedItems.length
      };
    });
  }

  _prepareItemForDisplay(item, config) {
    const system = item.system ?? {};
    const quantity = Math.max(Number(system.quantity) || 0, 0);
    const badges = this._getItemBadges(item, config);
    const summary = this._getItemSummary(item, config);
    return {
      id: item.id,
      uuid: item.uuid,
      name: item.name || game.i18n.localize('MY_RPG.ItemGroups.Unnamed'),
      img: item.img || 'icons/svg/item-bag.svg',
      groupKey: config.key,
      showQuantity: Boolean(config.showQuantity),
      quantity,
      showEquip: Boolean(config.allowEquip),
      exclusive: Boolean(config.exclusive),
      equipped: Boolean(system.equipped),
      badges,
      summary,
      hasBadges: badges.length > 0,
      hasSummary: Boolean(summary)
    };
  }

  _getItemBadges(item, config) {
    const system = item.system ?? {};
    const badges = [];
    const t = game.i18n;
    switch (config.key) {
      case 'abilities': {
        const rank = Number(system.rank) || 0;
        if (rank) {
          badges.push(`${t.localize('MY_RPG.AbilitiesTable.Rank')}: ${getRankLabel(rank)}`);
        }
        if (game.settings.get('myrpg', 'worldType') === 'unity' && system.runeType) {
          const runeKey = `MY_RPG.RuneTypes.${system.runeType}`;
          badges.push(`${t.localize('MY_RPG.RunesTable.RuneType')}: ${t.localize(runeKey)}`);
        }
        if (system.cost) {
          badges.push(`${t.localize('MY_RPG.AbilitiesTable.Cost')}: ${system.cost}`);
        }
        if (system.upgrade1 && system.upgrade1 !== 'None') {
          badges.push(`${t.localize('MY_RPG.AbilitiesTable.Upgrade1')}: ${t.localize('MY_RPG.AbilityUpgrades.' + system.upgrade1)}`);
        }
        if (system.upgrade2 && system.upgrade2 !== 'None') {
          badges.push(`${t.localize('MY_RPG.AbilitiesTable.Upgrade2')}: ${t.localize('MY_RPG.AbilityUpgrades.' + system.upgrade2)}`);
        }
        break;
      }
      case 'mods': {
        const rank = Number(system.rank) || 0;
        if (rank) {
          badges.push(`${t.localize('MY_RPG.ModsTable.Rank')}: ${getRankLabel(rank)}`);
        }
        if (system.cost) {
          badges.push(`${t.localize('MY_RPG.ModsTable.Cost')}: ${system.cost}`);
        }
        if (system.upgrade1 && system.upgrade1 !== 'None') {
          badges.push(`${t.localize('MY_RPG.ModsTable.Upgrade1')}: ${t.localize('MY_RPG.AbilityUpgrades.' + system.upgrade1)}`);
        }
        if (system.upgrade2 && system.upgrade2 !== 'None') {
          badges.push(`${t.localize('MY_RPG.ModsTable.Upgrade2')}: ${t.localize('MY_RPG.AbilityUpgrades.' + system.upgrade2)}`);
        }
        break;
      }
      case 'weapons': {
        badges.push(`${t.localize('MY_RPG.WeaponsTable.SkillLabel')}: ${this._weaponSkillLabel(system.skill)}`);
        badges.push(`${t.localize('MY_RPG.WeaponsTable.BonusLabel')}: ${this._formatWeaponBonus(system.skillBonus)}`);
        break;
      }
      case 'armor': {
        const phys = Number(system.itemPhys) || 0;
        const azure = Number(system.itemAzure) || 0;
        const mental = Number(system.itemMental) || 0;
        const shield = Number(system.itemShield) || 0;
        const speed = Number(system.itemSpeed) || 0;
        if (phys) badges.push(`${t.localize('MY_RPG.ArmorItem.BonusPhysicalLabel')}: ${phys}`);
        if (azure) badges.push(`${t.localize('MY_RPG.ArmorItem.BonusMagicalLabel')}: ${azure}`);
        if (mental) badges.push(`${t.localize('MY_RPG.ArmorItem.BonusPsychicLabel')}: ${mental}`);
        if (shield) badges.push(`${t.localize('MY_RPG.ArmorItem.ShieldLabel')}: ${shield}`);
        if (speed) badges.push(`${t.localize('MY_RPG.ArmorItem.BonusSpeedLabel')}: ${speed}`);
        break;
      }
      case 'gear': {
        if (system.source) {
          badges.push(`${t.localize('MY_RPG.ItemSheet.Fields.Source')}: ${system.source}`);
        }
        break;
      }
      default:
        break;
    }
    return badges;
  }

  _getItemSummary(item, config) {
    const system = item.system ?? {};
    switch (config.key) {
      case 'abilities':
        return system.effect || system.description || '';
      case 'mods':
        return system.effect || '';
      case 'weapons':
        return system.description || '';
      case 'armor':
        return system.description || '';
      case 'gear': {
        const parts = [];
        if (system.description) parts.push(system.description);
        if (system.notes) parts.push(system.notes);
        return parts.join('<br><br>');
      }
      default:
        return system.description || '';
    }
  }

  _getDefaultItemName(config) {
    if (config?.newNameKey) {
      return game.i18n.localize(config.newNameKey);
    }
    const typeLabel = config ? game.i18n.localize(`TYPES.Item.${config.type}`) : game.i18n.localize('MY_RPG.Inventory.Name');
    return game.i18n.format('MY_RPG.ItemControls.NewItemFallback', { type: typeLabel });
  }

  _getGroupConfig(groupKey) {
    if (!groupKey) return null;
    return ITEM_GROUP_CONFIG_BY_KEY[groupKey] ?? null;
  }

  _getItemContextFromEvent(event) {
    const $target = $(event.currentTarget);
    const $row = $target.closest('[data-item-id]');
    if (!$row.length) return {};
    const itemId = $row.data('itemId');
    const groupKey = $row.data('groupKey');
    const item = this.actor.items.get(itemId);
    const config = this._getGroupConfig(groupKey);
    return { item, $row, groupKey, config };
  }

  async _onItemCreate(event) {
    event.preventDefault();
    const $target = $(event.currentTarget);
    const groupKey = $target.data('groupKey') || $target.closest('[data-item-group]').data('itemGroup');
    const type = $target.data('type');
    let config = type ? ITEM_GROUP_CONFIG.find((c) => c.type === type) : null;
    if (!config) config = this._getGroupConfig(groupKey);
    if (!config) return;
    const name = this._getDefaultItemName(config);
    // DEBUG-LOG
    debugLog('Actor sheet item create', { actor: this.actor.uuid, type: config.type });
    await this.actor.createEmbeddedDocuments('Item', [
      { name, type: config.type, system: {} }
    ]);
  }

  async _onItemEdit(event) {
    event.preventDefault();
    const { item } = this._getItemContextFromEvent(event);
    if (!item) return;
    // DEBUG-LOG
    debugLog('Actor sheet item edit', { actor: this.actor.uuid, itemId: item.id });
    item.sheet?.render(true);
  }

  async _onItemDelete(event) {
    event.preventDefault();
    const { item } = this._getItemContextFromEvent(event);
    if (!item) return;
    const typeLabel = game.i18n.localize(`TYPES.Item.${item.type}`);
    const title = game.i18n.format('MY_RPG.ItemDialogs.DeleteTitle', { type: typeLabel });
    const safeName = TextEditor.encodeHTML(item.name || typeLabel);
    const content = `<p>${game.i18n.format('MY_RPG.ItemDialogs.DeleteContent', { name: safeName })}</p>`;
    const confirmed = await Dialog.confirm({ title, content });
    if (!confirmed) return;
    // DEBUG-LOG
    debugLog('Actor sheet item delete', { actor: this.actor.uuid, itemId: item.id, type: item.type });
    await item.delete();
  }

  async _onItemChat(event) {
    event.preventDefault();
    const { item, config } = this._getItemContextFromEvent(event);
    if (!item || !config) return;
    const content = this._buildItemChatContent(item, config);
    if (!content) return;
    // DEBUG-LOG
    debugLog('Actor sheet item chat', { actor: this.actor.uuid, itemId: item.id, type: item.type });
    await ChatMessage.create({
      content,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }

  _buildItemChatContent(item, config) {
    const system = item.system ?? {};
    const lines = [];
    const name = TextEditor.encodeHTML(item.name || game.i18n.localize(`TYPES.Item.${item.type}`));
    lines.push(`<strong>${name}</strong>`);
    const meta = [];
    if (config.showQuantity) {
      const quantity = Math.max(Number(system.quantity) || 0, 0);
      meta.push(`${game.i18n.localize('MY_RPG.Inventory.Quantity')}: ${quantity}`);
    }
    meta.push(...this._getItemBadges(item, config));
    if (config.allowEquip && system.equipped) {
      const equipKey = config.key === 'armor'
        ? 'MY_RPG.ArmorTable.EquippedLabel'
        : 'MY_RPG.WeaponsTable.EquippedLabel';
      meta.push(game.i18n.localize(equipKey));
    }
    if (meta.length) lines.push(meta.join('<br>'));
    const summary = this._getItemSummary(item, config);
    if (summary) lines.push(summary);
    return lines.filter(Boolean).join('<br><br>');
  }

  async _onItemQuantityStep(event) {
    event.preventDefault();
    const step = Number(event.currentTarget.dataset.step) || 0;
    if (!step) return;
    const { item, $row, config } = this._getItemContextFromEvent(event);
    if (!item || !$row) return;
    const system = item.system ?? {};
    const current = Math.max(Number(system.quantity) || 0, 0);
    const next = Math.max(current + step, 0);
    if (next === current) return;
    await item.update({ 'system.quantity': next }, { diff: false });
    // DEBUG-LOG
    debugLog('Actor sheet item quantity', { actor: this.actor.uuid, itemId: item.id, quantity: next });
    $row.find('.item-quantity-value').text(next);
    if (config && (config.key === 'armor' || config.key === 'weapons')) {
      this.actor.prepareData();
      this._refreshDerived(this.element);
    }
  }

  async _onItemEquipChange(event) {
    const checkbox = event.currentTarget;
    const { item, $row, groupKey, config } = this._getItemContextFromEvent(event);
    if (!item || !$row || !config?.allowEquip) return;
    const checked = Boolean(checkbox.checked);
    const updates = [{ _id: item.id, 'system.equipped': checked }];
    if (config.exclusive && checked) {
      const others = this.actor.itemTypes?.[config.type] ?? [];
      for (const other of others) {
        if (other.id === item.id) continue;
        if (other.system?.equipped) {
          updates.push({ _id: other.id, 'system.equipped': false });
        }
      }
    }
    await this.actor.updateEmbeddedDocuments('Item', updates, { render: false });
    // DEBUG-LOG
    debugLog('Actor sheet item equip', { actor: this.actor.uuid, itemId: item.id, group: groupKey, equipped: checked });
    this.actor.prepareData();
    this._refreshDerived(this.element);
    const $group = $row.closest('[data-item-group]');
    if (config.exclusive && $group.length) {
      $group.find('.item-row').each((_, el) => {
        const id = el.dataset.itemId;
        const doc = this.actor.items.get(id);
        const isEquipped = Boolean(doc?.system?.equipped);
        el.classList.toggle('item-row--equipped', isEquipped);
        const input = el.querySelector('.item-equip-checkbox');
        if (input) input.checked = isEquipped;
      });
    } else {
      $row.toggleClass('item-row--equipped', checked);
    }
  }

  _normalizeWeaponBonus(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  _formatWeaponBonus(value) {
    const bonus = this._normalizeWeaponBonus(value);
    if (bonus > 0) return `+${bonus}`;
    return `${bonus}`;
  }

  _getEquippedWeaponBonus(skillKey) {
    if (!skillKey) return 0;
    const bonuses =
      this.actor.system?.cache?.itemTotals?.weapons?.skillBonuses ?? {};
    const total = bonuses?.[skillKey];
    return this._normalizeWeaponBonus(total);
  }

  _weaponSkillLabel(skillKey) {
    if (!skillKey) return game.i18n.localize('MY_RPG.WeaponsTable.SkillNone');
    const configKey = CONFIG.MY_RPG.skills?.[skillKey];
    return configKey ? game.i18n.localize(configKey) : skillKey;
  }

  _weaponEffectHtml(item) {
    const source = item ?? {};
    const system = source.system ?? source;
    const lines = [
      `${game.i18n.localize('MY_RPG.WeaponsTable.SkillLabel')}: ${this._weaponSkillLabel(
        system.skill
      )}`,
      `${game.i18n.localize('MY_RPG.WeaponsTable.BonusLabel')}: ${this._formatWeaponBonus(
        system.skillBonus
      )}`
    ];
    if (system.equipped) {
      lines.push(game.i18n.localize('MY_RPG.WeaponsTable.EquippedLabel'));
    }
    let html = lines.join('<br>');
    const description = system.description ?? system.desc ?? '';
    if (description) html += `<br><br>${description}`;
    return html;
  }

  _armorEffectHtml(item) {
    const source = item ?? {};
    const system = source.system ?? source;
    const lines = [];
    const quantity = Number(system.quantity ?? source.quantity ?? 0);
    if (quantity)
      lines.push(
        `${game.i18n.localize('MY_RPG.Inventory.Quantity')}: ${quantity}`
      );
    const phys = Number(system.itemPhys) || 0;
    const azure = Number(system.itemAzure) || 0;
    const mental = Number(system.itemMental) || 0;
    const shield = Number(system.itemShield) || 0;
    const speed = Number(system.itemSpeed) || 0;
    if (phys)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusPhysicalLabel')}: ${phys}`
      );
    if (azure)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusMagicalLabel')}: ${azure}`
      );
    if (mental)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusPsychicLabel')}: ${mental}`
      );
    if (shield)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.ShieldLabel')}: ${shield}`
      );
    if (speed)
      lines.push(
        `${game.i18n.localize('MY_RPG.ArmorItem.BonusSpeedLabel')}: ${speed}`
      );
    let html = lines.join('<br>');
    const description = system.description ?? system.desc ?? '';
    if (description) html += `<br><br>${description}`;
    return html;
  }
}
