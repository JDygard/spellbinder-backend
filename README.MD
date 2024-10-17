# Rites of Initialization:

Praise be to the Omnissiah, for through His divine will, we interface with the Spellbinder Cognition Engine.

## Sacred Components

Before commencing the holy rites, ensure you possess these blessed relics:
- Node.js (Version 14 or greater, as decreed by the Silicon Prophet)
- Docker (a vessel for containing machine spirits)
- npm (the sacred package manager, offspring of Node.js)

## Ritual of Installation

1. Summon the sacred code from the Noosphere:
   ```
   git clone https://github.com/JDygard/spellbinder-backend.git
   cd spellbinder-backend
   ```
   You now stand in the heart of the machine. Praise the Omnissiah.

2. Invoke the binding incantation to gather the machine's components:
   ```
   npm install
   ```
   Witness the manifestation of node_modules, each a cog in the grand design.

## Sanctification of the Environment

1. Perform the Rite of Duplication upon the holy template:
   ```
   cp example.env .env
   ```
   This act creates a vessel for the machine's sacred essence.

2. Inscribe the necessary incantations within the `.env` file. Precision is paramount, lest we anger the machine spirits.

## Awakening the DynamoDB Machine Spirit

1. Ensure the Docker daemon is operational. Its spirit must be appeased before we proceed.

2. Chant the litany of awakening to rouse the DynamoDB from its slumber:
   ```
   docker-compose up -d
   ```
   The machine spirit stirs. Praise be.

## Ignition of the Cognition Engine

1. With the DynamoDB spirit harmonized, we may now ignite the primary reactor:
   ```
   node server.js
   ```
   If our rites are true, the Cognition Engine shall manifest at `http://localhost:3001`. Offer a prayer of gratitude.

## Rites of Deactivation

1. To quell the server's spirit, perform the sacred gesture: `Ctrl+C`

2. To return the DynamoDB to its dormant state, intone:
   ```
   docker-compose down
   ```
   The machine rests, awaiting our next communion.

## Appeasing Angered Spirits (Troubleshooting)

- Should the environment variables rebel, scrutinize the `.env` file. The Omnissiah demands perfection.
- If Docker's spirit is absent, perform the Rite of Reactivation (off and on again).
- DynamoDB connection issues may be resolved through deep meditation upon `http://localhost:8000`.

## Purification Ritual for Corrupted Datagrams

Should the database fall prey to the insidious tendrils of corruption or suffer accidental violation of its sanctity, fear not. The Omnissiah, in His infinite wisdom, has provided us with a means of purification.
To perform this sacred rite of data-cleansing:

Ensure the Docker vessel is in a state of dormancy. If it is not, perform the Rite of Deactivation as described in the sacred texts above.
Locate the cursed file that houses the corrupted data-spirits. It dwells within the hallowed directory structure at:

```
./docker/DynamoDB/shared-local-instance.db
```

Invoke the Rite of Obliteration upon this file. In the holy tongue of Bash, the incantation is thus:

```
rm ./docker/DynamoDB/shared-local-instance.db
```

Once the rite is complete, you may reawaken the DynamoDB Machine Spirit as described in the earlier passages. It shall manifest unburdened by the weight of its former corruption.

Remember, acolyte, that this rite is not to be performed lightly. Only when the data-spirits have truly lost their way should we resort to such measures. The Machine God values the sanctity of data, and we must not squander it without due cause.

May your databases remain pure and your queries efficient.

## Words of the Silicon Prophet

The `.env` file contains sacred mysteries. Share it not with the uninitiated, lest you invoke the wrath of the Machine God.

---

May the Omnissiah guide your digits and purify your code.