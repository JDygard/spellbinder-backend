const { generateBoard, randomLetter, validateWord, letterRarity } = require('./game-utils');
const { getCharactersByUsername, createCharacter } = require('./dynamo-db');
const { authenticateSocket } = require('./auth');
const { callCreatures, getChallengeSummary, getFirstMonsterInChallenge, startMonsterAttacks } = require('./gameController');
const challenges = require('./data/challenges');
const monsters = require('./data/monsters');
const { use } = require('passport');

class User {
    constructor(id, username, socket, currentCharacter = null, gameState = null, inMatch = false, board = [], combos = [], characters = []) {
        this.id = id;
        this.username = username;
        this.socket = socket;
        this.characters = characters;
        this.currentCharacter = currentCharacter;
        this.gameState = gameState;
        this.inMatch = inMatch;
        this.board = board;
        this.combos = combos;
        this.characters = characters;
    }
}


// USERS AND MATCHMAKING START ========================================
let users = [];
let matchmakingQueue = [];

const findUserById = (id) => users.find((user) => user.id === id);

const addUser = (user) => {
    console.log("user added", user)
    users.push(user);
};

const removeUser = (id) => {
    users = users.filter((user) => user.id !== id);
};

const updateUser = (id, data) => {
    const userIndex = users.findIndex((user) => user.id === id);
    if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...data };
    }
};


function generateNewCharacter(characterData) {
    const { name, classType, username } = characterData;

    const baseStats = {
        hp: 100,
        maxHp: 100,
        strength: 10,
        dexterity: 10,
        intelligence: 10,
    };

    return {
        name: name,
        username: username,
        level: 1,
        class: classType,
        hp: baseStats.hp,
        maxHp: baseStats.maxHp,
        experience: 0,
        stats: {
            strength: baseStats.strength,
            dexterity: baseStats.dexterity,
            intelligence: baseStats.intelligence,
        },
        inventory: {
            weapon: null,
            armor: null,
            trinket: null,
            helmet: null,
            inventory: [],
        },
        talents: {
            class: {},
            generic: {},
        },
        combos: [],
    };
}

const addToMatchmakingQueue = (user) => {
    matchmakingQueue.push(user);
};

const removeFromMatchmakingQueue = (id) => {
    matchmakingQueue = matchmakingQueue.filter((user) => user.id !== id);
};
// USERS AND MATCHMAKING END ========================================


// COMBO FUNCTIONS START ========================================
function checkForCombos(user) {
    // Filter out the valid word entries from the gameLog
    const validWordEntries = user.gameState.comboGameLog;

    // Iterate through the user's combos
    console.log("combos: " + user.combos)
    for (const combo of user.combos) {
        let comboIndex = 0;
        let comboStartTime = null;
        let usedIndices = new Set();

        // Iterate through the valid word entries
        for (let i = 0; i < validWordEntries.length; i++) {
            const entry = validWordEntries[i];
            // If the word length matches the current combo step
            if (entry.length === combo.sequence[comboIndex]) {
                // If this is the first step in the combo, set the combo start time
                if (comboIndex === 0) {
                    comboStartTime = entry.submittedAt;
                }

                // If the time difference is within the combo time limit, increment the combo index
                if (entry.submittedAt - comboStartTime <= combo.timeLimit * 1000) {
                    comboIndex++;
                    usedIndices.add(i);
                } else {
                    // Reset the combo progress and clear comboGameLog if the time limit is exceeded
                    comboIndex = 0;
                    comboStartTime = null;
                    usedIndices.clear();
                    user.gameState.comboGameLog = []; // Clear the comboGameLog
                }

                // If the entire combo sequence has been matched
                if (comboIndex === combo.sequence.length) {
                    applyComboEffect(user, combo);
                    console.log("successful combo: ", combo.name);

                    // Reset the combo progress after a successful combo
                    comboIndex = 0;
                    comboStartTime = null;
                    usedIndices.clear();

                    user.gameState.comboGameLog = []; // Clear the comboGameLog

                    // Break out of the loop to start the next combo check
                    break;
                }
            } else {
                // If the word length doesn't match, reset the combo progress and clear comboGameLog
                comboIndex = 0;
                comboStartTime = null;
                usedIndices.clear();
            }
        }
    }
}

function applyComboEffect(user, combo) {
    const effect = combo.effect;

    switch (effect.type) {
        case 'damageMultiplier':
            user.gameState.damageMultiplier = effect.value;
            setTimeout(() => {
                user.gameState.damageMultiplier = 1;
            }, effect.duration * 1000);
            break;

        case 'heal':
            user.gameState.playerHp += effect.value;
            if (user.gameState.playerHp > user.maxHp) {
                user.gameState.playerHp = user.maxHp;
            }
            break;

        case 'applyStatusEffect':
            applyStatusEffect(user, effect.statusEffect, effect.duration);
            break;

        // Add other combo effect types here as needed

        default:
            console.error(`Unknown combo effect type: ${effect.type}`);
    }
}
// COMBO FUNCTIONS END ========================================


// TILE EFFECTS START ========================================
const LIGHTNING_TILE_DAMAGE = 3;
const POISON_TILE_DAMAGE = 5;
const BOMB_TILE_DAMAGE = 20;
const BURN_TILE_DAMAGE = 10;
const FIRE_TILE_DAMAGE = 3;

function applyTileEffectToNewLetter(tileEffects, newLetter) {
    if (tileEffects.length > 0) {
        const effect = tileEffects.shift(); // Remove the least recently added effect
        newLetter.effect = effect;
    }
    return newLetter;
}

function handleTileDuration(user) {
    user.board = user.board.map((row) => {
        return row.map((letterObj) => {
            if (letterObj.effect && letterObj.effect.duration > 0) {
                letterObj.effect.duration -= 1;

                if (letterObj.effect.type === 'bomb' && letterObj.effect.duration < 1) {
                    user.gameState.playerHp -= BOMB_TILE_DAMAGE;
                    user.gameState.gameLog.push({
                        type: 'bombExplosion',
                        damage: BOMB_TILE_DAMAGE,
                        submittedAt: Date.now(),
                    });
                    letterObj.effect = {};
                } else if (letterObj.effect.duration < 1) {
                    letterObj.effect = {};
                }
            }
            return letterObj;
        });
    });
}

// TILE SPECIFIC EFFECTS ========================================
function applyLightningEffect(user, numberOfTiles) {
    const availableTiles = [];
    user.board.forEach((row, rowIndex) => {
        row.forEach((letterObj, colIndex) => {
            if (!letterObj.effect) {
                availableTiles.push({ row: rowIndex, col: colIndex });
            }
        });
    });

    for (let i = 0; i < numberOfTiles; i++) {
        if (availableTiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableTiles.length);
            const { row, col } = availableTiles[randomIndex];
            user.board[row][col].effect = {
                type: 'lightning',
                damage: LIGHTNING_TILE_DAMAGE,
            };
            availableTiles.splice(randomIndex, 1);
        }
    }
}

function calculateLightningTileDamage(letters) {
    let lightningTileDamage = 0;
    letters.forEach((letterObj) => {
        if (letterObj.effect && letterObj.effect.type === 'lightning') {
            lightningTileDamage += LIGHTNING_TILE_DAMAGE;
        }
    });
    return lightningTileDamage;
}

function calculateBurnTileDamage(letters) {
    const burnTileCount = letters.filter((letterObj) => letterObj.effect.type === 'burn').length;
    return burnTileCount * BURN_TILE_DAMAGE;
}

function calculateFireTileDamage(letters) {
    let fireTileCount = 0;

    for (let letterObj of letters) {
        if (letterObj.effect && letterObj.effect.type === 'fire') {
            fireTileCount++;
        }
    }

    return FIRE_TILE_DAMAGE * fireTileCount;
}

function calculatePoisonTileDamage(board) {
    let poisonTileCount = 0;

    for (const row of board) {
        for (const letterObj of row) {
            if (letterObj.effect && letterObj.effect.type === 'poison') {
                poisonTileCount++;
            }
        }
    }

    return POISON_TILE_DAMAGE * poisonTileCount;
}

// TILE SPECIFIC EFFECTS END ========================================

// TILE EFFECTS END ========================================

async function initializeUser(socket) {
    const userCharacters = await getCharactersByUsername(socket.user.username);
    const newUser = new User(socket.id, socket.user.username, socket, userCharacters, null, null, false, [], []);
    addUser(newUser);
    return newUser;
}

const setupSocket = (io, authenticateSocket) => {
    io.use(authenticateSocket).on('connection', (socket) => {
        console.log('A user connected:', socket.id, "username:", socket.user.username);

        const newUser = new User(socket.id, socket.user.username, socket, null, null, false, [], fakePlayerData[0].combos);
        addUser(newUser);


        // USER DATA EXCHANGE =======================================================
        socket.on("requestPlayerData", () => {
            const user = findUserById(socket.id);
            if (user) {
                console.log("emitting from requestPlayerData");
                socket.emit("playerData", {
                    id: user.id,
                    username: user.username,
                    characters: user.characters,
                });
            } else {
                socket.emit("error", "User not found");
            }
        });
        // USER DATA EXCHANGE END ===================================================


        // PVE CHALLENGE SELECTION ==================================================
        socket.on('requestChallengeList', () => {
            socket.emit('challengeList', getChallengeSummary(challenges));
        });

        socket.on('challengeSelected', (challengeId) => {
            const challenge = challenges.find((c) => c.id === parseInt(challengeId));
            const user = findUserById(socket.id);
        
            if (!user.currentCharacter) {
                socket.emit('error', { message: "No character selected" });
                return;
            }
        
            if (challenge) {
                const firstMonster = getFirstMonsterInChallenge(challenge);
                const gameState = {
                    monster: firstMonster,
                    playerHp: user.currentCharacter.hp, // This is where the error happens
                    monsterHp: firstMonster.hp,
                    combos: user.currentCharacter.combos,
                    score: 0,
                    gameLog: [],
                    comboGameLog: [],
                    tileEffects: [],
                };
                updateUser(socket.id, { gameState: gameState });
                startMonsterAttacks(user, firstMonster);
                socket.emit('startChallenge', firstMonster);
                socket.emit("gameStateUpdate", user.gameState);
            } else {
                console.log(`Challenge with ID ${challengeId} not found.`);
            }
        });
        
        // PVE CHALLENGE SELECTION END ==============================================


        // CHARACTER SELECT SCREEN ==================================================

        socket.on('requestCharacters', async () => {
            const characters = await getCharactersByUsername(socket.user.username);
            socket.emit('characters', characters);
        });

        socket.on('createCharacter', async (characterData) => {
            try {
                const newCharacter = await createCharacter(socket.user.username, characterData);
                const user = findUserById(socket.id);
                if (user) {
                    user.characters.push(newCharacter);
                    updateUser(socket.id, { characters: user.characters });
                    socket.emit("updateCharacters", 
                        user.characters,
                    );
                }
            } catch (error) {
                console.error('Error creating character:', error);
                socket.emit('error', 'Error creating character');
            }
        });
        // CHARACTER SELECT SCREEN END ==============================================


        // GAMEPLAY =================================================================
        socket.on('generateBoard', (size) => {
            const newBoard = generateBoard(size);
            updateUser(socket.id, { board: newBoard });
            socket.emit('newBoard', newBoard);
        });

        socket.on('replaceSelectedLetters', ({ selectedLetters }) => {
            const user = findUserById(socket.id);
            const updatedBoard = user.board.map((row, rowIndex) => {
                return row.map((letter, colIndex) => {
                    if (selectedLetters.some((pos) => pos.row === rowIndex && pos.col === colIndex)) {
                        // Generate a new letter
                        const newLetter = randomLetter();

                        // Apply the most recent effect if there are any effects in the tileEffects array
                        applyTileEffectToNewLetter(user.gameState.tileEffects, newLetter);

                        return newLetter;
                    }
                    return letter;
                });
            });
            updateUser(socket.id, { board: updatedBoard });
            socket.emit('updatedBoard', updatedBoard);
        });

        socket.on('submitWord', async (data) => {
            const { word, letters } = data;
            const user = findUserById(socket.id);
            

            // if word is less than 3 letters, return
            if (word.length < 3) {
                return;
            }

            const isValid = await validateWord(word);
            if (isValid) {
                handleTileDuration(user);

                user.gameState.comboGameLog.push({
                    word,
                    length: word.length,
                    submittedAt: Date.now(),
                });

                // WORD VALUE START =====================================================
                let wordValue = 0;
                for (let letterObj of letters) {
                    wordValue += letterRarity(letterObj.letter).value * (1 + user.currentCharacter.stats.strength * 0.01);
                }

                const criticalChance = user.currentCharacter.stats.dexterity * 0.01;
                if (Math.random() < criticalChance) {
                    wordValue *= 2; // Double damage on critical hit
                }



                // Fire tile
                const fireTileDamage = calculateFireTileDamage(letters);
                wordValue += fireTileDamage;

                // Poison tile
                const poisonTileDamage = calculatePoisonTileDamage(user.board);
                user.gameState.playerHp -= poisonTileDamage;

                // Apply Int (multiplier for longer words)
                let baseMultiplier = 1.5 + user.currentCharacter.stats.intelligence * 0.005;
                if (letters.length >= 4) {
                    wordValue *= Math.pow(baseMultiplier, letters.length - 3);
                };
                wordValue = Math.round(wordValue);

                // WORD VALUE END =======================================================

                // GAMESTATE START ======================================================    
                if (poisonTileDamage > 0) {
                    user.gameState.gameLog.push({
                        word: `Poison Damage:`,
                        value: poisonTileDamage,
                        color: "danger",
                        submittedAt: Date.now(),
                    });
                }

                const lightningTileDamage = calculateLightningTileDamage(letters);
                user.gameState.playerHp -= lightningTileDamage;

                if (lightningTileDamage > 0) {
                    user.gameState.gameLog.push({
                        type: 'lightningDamage',
                        damage: lightningTileDamage,
                        submittedAt: Date.now(),
                    });
                }

                const burnTileDamage = calculateBurnTileDamage(letters);
                user.gameState.health -= burnTileDamage;

                user.gameState.monsterHp -= wordValue;

                user.gameState.score += wordValue;

                user.gameState.gameLog.push({
                    word,
                    effects: letters
                        .map((letterObj) => letterObj.effect)
                        .filter((effect) => effect !== undefined && Object.keys(effect).length > 0),
                    value: wordValue,
                    color: "success",
                    length: word.length, // Add the word length
                    submittedAt: Date.now(), // Add the submission time
                });
                // GAMESTATE END ========================================================

                // COMBOS START =========================================================
                checkForCombos(user);
                // const validWordEntries = user.gameState.gameLog.filter(
                //     (entry) => entry.color === "success"
                // );
                // COMBOS END ===========================================================

                // STATE UPDATES START ==================================================
                socket.emit("wordAccepted", { word, wordValue });
                socket.emit("gameLogUpdate", user.gameState.gameLog);
                // STATE UPDATES END ====================================================
            } else {
                const user = findUserById(socket.id);
                user.gameState.gameLog.push({ word, value: 0, color: "fail" });
                socket.emit("wordRejected", word);
            }
            socket.emit("gameStateUpdate", user.gameState);
        });

        // GAMEPLAY END ============================================================

        socket.on('disconnect', () => {
            console.log(`A user disconnected: ${socket.id}, username: ${socket.user.username}`);
            removeUser(socket.id);
        });
    });
};

module.exports = setupSocket;
