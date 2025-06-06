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
