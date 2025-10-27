/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
  const paths = [
    'systems/myrpg/templates/actor/actor-character-sheet.hbs',
    'systems/myrpg/templates/actor/actor-npc-sheet.hbs',
    'systems/myrpg/templates/item/ability-sheet.hbs',
    'systems/myrpg/templates/item/mod-sheet.hbs',
    'systems/myrpg/templates/item/armor-sheet.hbs',
    'systems/myrpg/templates/item/weapon-sheet.hbs',
    'systems/myrpg/templates/item/gear-sheet.hbs'
  ];
  return loadTemplates(paths);
};
