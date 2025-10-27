export class myrpgItemSheet extends ItemSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['myrpg', 'sheet', 'item'],
      width: 520,
      height: 'auto'
    });
  }

  get itemDocument() {
    return this.item ?? this.document;
  }

  get template() {
    return `systems/myrpg/templates/item/${this.itemDocument.type}-sheet.hbs`;
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    const item = this.itemDocument;
    context.item = item;
    context.config = CONFIG.MY_RPG ?? {};
    context.system = item.system ?? {};
    context.sheetTitle = game.i18n.localize(`MY_RPG.Item.SheetTitle.${item.type}`);
    context.myrpg = {
      bonuses: context.system.bonuses ?? {}
    };
    return context;
  }
}
