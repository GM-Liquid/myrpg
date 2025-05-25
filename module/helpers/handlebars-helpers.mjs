// systems/myrpg/helpers/handlebars-helpers.mjs

/**
 * –егистраци€ дополнительных хелперов дл€ Handlebars.
 * Ёти хелперы доступны во всех шаблонах после загрузки системы.
 */

// ’елпер дл€ конкатенации строк
Handlebars.registerHelper('concat', (...args) => {
    // ”дал€ем последний аргумент Ч объект опций
    args.pop();
    return args.join('');
});

// ’елпер дл€ преобразовани€ строки в PascalCase
Handlebars.registerHelper('toPascalCase', (str) => {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
});

// ’елпер дл€ преобразовани€ строки в нижний регистр
Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});
// ѕовторить блок N раз, передава€ @index
Handlebars.registerHelper('times', function (n, options) {
    let accum = '';
    for (let i = 0; i < n; i++) {
        // передаЄм индекс в data, чтобы в шаблоне работал {{@index}}
        accum += options.fn(this, { data: { index: i } });
    }
    return accum;
});

// Ђменьше или равної дл€ условных блоков {{#lte a b}}Е{{else}}Е{{/lte}}
Handlebars.registerHelper('lte', function (a, b, options) {
    return (a <= b) ? options.fn(this) : options.inverse(this);
});