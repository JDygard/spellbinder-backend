const monsters = require("./data/monsters");

function callCreatures(challenge) {
    let current = challenge.tree;
    while (current) {
        switch (current.type) {
            case "healing":
                console.log("Call healing here");
                break;
            case "normal":
                console.log("Call normal creature here");
                break;
            case "strong":
                console.log("Call strong creature here");
                break;
            case "boss":
                console.log("Call boss creature here");
                break;
            default:
                console.log("Unknown creature type");
                break;
        }
        current = current.next;
    }
}

function getChallengeSummary(challenges) {
    return challenges.map((challenge) => {
        const { id, name, reward } = challenge;
        return { id, name, reward };
    });
}

function getFirstMonsterInChallenge(challenge) {
    const monster = monsters.find((m) => m.type === challenge.tree.type);
    return { ...monster };
}

const monsterAttack = (user, monster) => {
    // Choose a random ability from the monster's abilities
    const ability = monster.abilities[Math.floor(Math.random() * monster.abilities.length)];

    // Calculate the damage dealt
    const damage = ability.damage;

    // Update the player's HP
    user.gameState.playerHp -= damage;

    // Add the monster's ability effects to the gameState.tileEffects array
    for (const effect in ability.effects) {
        user.gameState.tileEffects.push(ability.effects[effect]);
    }

    // Update the game log
    user.gameState.gameLog.push({
        type: "monsterAttack",
        abilityName: ability.name,
        damage: damage,
        color: "monster"
    });

    // Emit the updated game state
    user.socket.emit("gameStateUpdate", user.gameState);

    // Check if the player has lost
    if (user.gameState.playerHp <= 0) {
        user.socket.emit("fightOver", { result: "lost" });
    }
    if (user.gameState.monsterHp <= 0) {
        user.socket.emit("fightOver", { result: "won" });
    }
};


const attackInterval = 5000; // The interval between monster attacks in milliseconds

function startMonsterAttacks(user, monster) {
    const attackTimer = setInterval(() => {
        // Perform the monster attack
        monsterAttack(user, monster);

        // Check if the player is dead and stop the timer
        if (user.gameState.playerHp <= 0) {
            clearInterval(attackTimer);
        }
        if (user.gameState.monsterHp <= 0) {
            clearInterval(attackTimer);
        }
    }, attackInterval);
}

module.exports = { startMonsterAttacks, callCreatures, getChallengeSummary, getFirstMonsterInChallenge, monsterAttack };
