


/*
character: {
  id: characterId,
  name: 'character name',
  level: 1,
  experience: 0,
  class: 'warrior',
  talentPoints: 0,
  talents: {
    class: {
    },
    generic: {
    },
  },
  inventory: [
  { weapon: itemId },
  { armor: itemId },
  { trinket: itemId },
  { helmet: itemId },
  { inventory: [itemId, itemId, itemId, itemId, itemId, itemId, itemId, itemId, itemId, itemId]}
  ]
}

item: {
  id: itemId,
  name: 'item name',
  type: 'weapon',
  stats: {
    strength: 1,
    agility: 1,
    intellect: 1,
  },
  keywords: ['keyword1', 'keyword2'],
  combos: [{}];
}

users_table:{
  id: userId ,
  username: 'user name',
  password: 'password'
}

  "keywords" is a list of words that share a theme with the item name. For example, a sword might have the keywords "sword", "blade", "weapon", "metal", "sharp", etc. The keywords, when used in the word game, gain more powerful effects
  "combos" will remain a placeholder empty object for now. It will be used to store the word length combinations possible.
*/