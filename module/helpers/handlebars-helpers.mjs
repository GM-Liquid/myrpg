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
