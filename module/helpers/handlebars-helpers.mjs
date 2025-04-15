// systems/myrpg/helpers/handlebars-helpers.mjs

/**
 * Регистрация дополнительных хелперов для Handlebars.
 * Эти хелперы доступны во всех шаблонах после загрузки системы.
 */

// Хелпер для конкатенации строк
Handlebars.registerHelper('concat', (...args) => {
    // Удаляем последний аргумент — объект опций
    args.pop();
    return args.join('');
});

// Хелпер для преобразования строки в PascalCase
Handlebars.registerHelper('toPascalCase', (str) => {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
});

// Хелпер для преобразования строки в нижний регистр
Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});
