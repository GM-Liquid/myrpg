/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    return loadTemplates([
        'systems/myrpg/templates/actor/parts/actor-features.hbs',
        'systems/myrpg/templates/item/parts/item-effects.hbs', // если этот шаблон используется в других местах, его можно оставить
    ]);
};
