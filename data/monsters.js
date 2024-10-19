const monsters = [
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
            "damage": 0,
            "effects": [
              {
                "type": "stun",
                "duration": 2,
                "damage": 0
              }
            ]
          },
          // {
          //   "name": "Smoke Bomb",
          //   "damage": 5,
          //   "effects": [
          //     {
          //       "type": "blind",
          //       "duration": 6,
          //       "damage": 0
          //     }
          //   ]
          // },
          // {
          //   "name": "Fiery Arrow",
          //   "damage": 20,
          //   "effects": [
          //     {
          //       "type": "burn",
          //       "duration": 10,
          //       "damage": 5
          //     }
          //   ]
          // },
          // {
          //   "name": "Bomb",
          //   "damage": 0,
          //   "effects": [
          //     {
          //       "type": "bomb",
          //       "duration": 2,
          //       "damage": 20
          //     }
          //   ]
          // }
        ]
    }
  ];
  

module.exports = monsters;