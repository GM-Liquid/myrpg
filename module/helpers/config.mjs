export const MY_RPG = {};

/**
 * The set of Ability Scores used within the system.
 * @type {Object}
 */
MY_RPG.abilities = {
  spi: 'MY_RPG.Ability.Spi.long', // �����/ Spirit�
  dex: 'MY_RPG.Ability.Dex.long',
  con: 'MY_RPG.Ability.Con.long',
  int: 'MY_RPG.Ability.Int.long'
};

MY_RPG.abilityAbbreviations = {
  spi: 'MY_RPG.Ability.Spi.abbr', // �����/ Spi�
  dex: 'MY_RPG.Ability.Dex.abbr',
  con: 'MY_RPG.Ability.Con.abbr',
  int: 'MY_RPG.Ability.Int.abbr'
};

MY_RPG.skills = {
  // Spirit-based
  liderstvo: 'MY_RPG.Skill.Liderstvo',
  obman: 'MY_RPG.Skill.Obman',
  diplomatiya: 'MY_RPG.Skill.Diplomatiya',
  stitiyannost: 'MY_RPG.Skill.Stitiyannost',
  psionika: 'MY_RPG.Skill.Psionika',
  predvidenie: 'MY_RPG.Skill.Predvidenie',

  // Dexterity-based
  akrobatika: 'MY_RPG.Skill.Akrobatika',
  skrytost: 'MY_RPG.Skill.Skrytost',
  vladeniye_takt_dalnim: 'MY_RPG.Skill.Vladeniye_takt_dalnim',
  vladeniye_tyazhelym_dalnim: 'MY_RPG.Skill.Vladeniye_tyazhelym_dalnim',
  lovkost_ruk: 'MY_RPG.Skill.Lovkost_ruk',
  blizhniy_boy: 'MY_RPG.Skill.Blizhniy_boy',
  upravlenie_transportom: 'MY_RPG.Skill.Upravlenie_transportom',
  kinetica: 'MY_RPG.Skill.Kinetica',

  // Constitution-based
  atletika: 'MY_RPG.Skill.Atletika',
  zapugivanie: 'MY_RPG.Skill.Zapugivanie',

  // Intellect-based
  analiz: 'MY_RPG.Skill.Analiz',
  tekhnika: 'MY_RPG.Skill.Tekhnika',
  priroda: 'MY_RPG.Skill.Priroda',
  kultura: 'MY_RPG.Skill.Kultura',
  vnimanie: 'MY_RPG.Skill.Vnimanie',
  meditsina: 'MY_RPG.Skill.Meditsina',
  oruzheynoe_delo: 'MY_RPG.Skill.Oruzheynoe_delo',
  znanie_azura: 'MY_RPG.Skill.Znanie_azura',
  manipulatsiya: 'MY_RPG.Skill.Manipulatsiya',
  artefaktorika: 'MY_RPG.Skill.Artefaktorika',
  biomantia: 'MY_RPG.Skill.Biomantia'
};

MY_RPG.skillAbbreviations = {};
