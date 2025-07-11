// systems/myrpg/helpers/handlebars-helpers.mjs

/**
 * ����������� �������������� �������� ��� Handlebars.
 * ��� ������� �������� �� ���� �������� ����� �������� �������.
 */

// ������ ��� ������������ �����
Handlebars.registerHelper('concat', (...args) => {
  // ������� ��������� �������� � ������ �����
  args.pop();
  return args.join('');
});

// ������ ��� �������������� ������ � PascalCase
Handlebars.registerHelper('toPascalCase', (str) => {
  if (typeof str !== 'string') return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
});

// ������ ��� �������������� ������ � ������ �������
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});
// ��������� ���� N ���, ��������� @index
Handlebars.registerHelper('times', function (n, options) {
  let accum = '';
  for (let i = 0; i < n; i++) {
    // ������� ������ � data, ����� � ������� ������� {{@index}}
    accum += options.fn(this, { data: { index: i } });
  }
  return accum;
});

// ������� ��� ����� ��� �������� ������ {{#lte a b}}�{{else}}�{{/lte}}
Handlebars.registerHelper('lte', function (a, b, options) {
  return a <= b ? options.fn(this) : options.inverse(this);
});

// Return the rank label based on current world mode
Handlebars.registerHelper('rankLabel', function (rankNum) {
  const mode = game.settings.get('myrpg', 'worldType');
  const base = mode === 'stellar' ? 'MY_RPG.RankNumeric' : 'MY_RPG.RankGradient';
  return game.i18n.localize(`${base}.Rank${rankNum}`);
});

// Create HTML block for armor item details without the item name
Handlebars.registerHelper('armorEffect', function (item) {
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
  return new Handlebars.SafeString(html);
});
