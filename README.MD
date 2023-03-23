Let's start at the beginning, with #1: "Define challenge structure"

The PvE window is a "tree of choices" style popularized in indie roguelike games similar to "slay the spire." Each "room" on the tree has a random encounter based on which room type it is: healing room, normal monster, strong monster.

The healing room always provides a boost to the player's remaining hp.

The normal monster room should pull from a list of normal monsters.

The strong monster room should pull from another list of stronger monsters.

The tree culminates in a final boss monster.

The monsters attack the player using a list of abilities, inflicting damage or causing negative tile effects or both.

There should be a list of challenges, each with a name, tree structure, and enemy list.
The first challenge might look like this:
{
    name: "challenge 1",
    tree: {
        id: 1,
        type: "healing",
        next: {
            id: 2,
            type: "normal",
            next: {
                id: 3,
                type: "strong",
                next: {
                    id: 4,
                    type: "boss",
                    next: null
                }// I would prefer a structure that lets the tree branch
            }
        }
    },
    enemies: {
        normal: [
            {
                id: 1,
                name: "goblin",
                hp: 10,
                abilities: [1, 2, 3]
            },
            {
                id: 2,
                name: "orc",
                hp: 15,
                abilities: [1, 2, 3]
            },
            {
                id: 3,
                name: "troll",
                hp: 20,
                abilities: [1, 2, 3]
            }
        ],
        strong: [
            {
                id: 1,
                name: "goblin chief",
                hp: 20,
                abilities: [1, 2, 3]
            },
            {
                id: 2,
                name: "orc chief",
                hp: 25,
                abilities: [1, 2, 3]
            },
            {
                id: 3,
                name: "troll chief",
                hp: 30,
                abilities: [1, 2, 3]
            }
        ],
        boss: [
            {
                id: 1,
                name: "goblin king",
                hp: 30,
                abilities: [1, 2, 3]
            },
            {
                id: 2,
                name: "orc king",
                hp: 35,
                abilities: [1, 2, 3]
            },
            {
                id: 3,
                name: "troll king",
                hp: 40,
                abilities: [1, 2, 3]
            }
        ]
    }
}

The master list of abilities can be kept in a single array of objects. The object structure should look like:
{
    id: 1,
    name: "fireball",
    damage: 30,
    effects: {
        fire: 2,
        broken: 2,
    }
}

There should be a helper function that takes an ability id and returns the ability object.

The list of normal monsters should be a list of objects, each with a name, hp, and a list of abilities.

The list of strong monsters should be a list of objects, each with a name, hp, and a list of abilities.

there should be a helper function that takes a monster id and returns the monster object. 

Steps:
    Define the abilities data structure and implement the helper function.
    Design the tree structure for branching paths.
    Define room types and their corresponding actions.
    Create the data structures for normal, strong, and boss monsters.
    Implement the helper function for monsters.
    Create a list of challenge objects with the required structure.
    Test the challenge structure by creating a few sample challenges.
    Integrate the challenge structure into the PvE menu, allowing players to select a challenge and start the encounter.
    Build the user interface for the encounter, showing the player's progress through the challenge tree and the current room type.
    Implement the logic for each room type, including healing, normal monster, strong monster, and boss encounters.
    Test and refine the challenge structure and encounters, ensuring that players can successfully complete the challenges and receive appropriate rewards.

 [
  {
    "id": 1,
    "type": "boss",
    "name": "Baroness Vexia",
    "hp": 100,
    "abilities": [
      {
        "name": "Shadow Bolt",
        "damage": 50,
        "effects": {
          "shadow": 3,
          "frost": 1
        }
      },
      {
        "name": "Blood Boil",
        "damage": 70,
        "effects": {
          "bleed": 4
        }
      },
      {
        "name": "Curse of Darkness",
        "damage": 90,
        "effects": {
          "shadow": 2,
          "blind": 2
        }
      }
    ]
  },
  {
    "id": 2,
    "type": "strong",
    "name": "Orc Warlord",
    "hp": 60,
    "abilities": [
      {
        "name": "Savage Strike",
        "damage": 30,
        "effects": {
          "knockback": 2,
          "bleed": 1
        }
      },
      {
        "name": "Thunderclap",
        "damage": 40,
        "effects": {
          "shock": 2,
          "knockback": 1
        }
      },
      {
        "name": "Whirlwind",
        "damage": 50,
        "effects": {
          "knockback": 1,
          "bleed": 3
        }
      }
    ]
  },
 {
    "id": 3,
    "type": "normal",
    "name": "Goblin Raider",
    "hp": 30,
    "abilities": [
      {
        "name": "Gouging Stab",
        "damage": 15,
        "effects": {
          "bleed": 2,
          "poison": 1
        }
      },
      {
        "name": "Smoke Bomb",
        "damage": 5,
        "effects": {
          "blind": 3
        }
      },
      {
        "name": "Fiery Arrow",
        "damage": 20,
        "effects": {
          "fire": 2,
          "burn": 1
        }
      }
    ]
  }
]