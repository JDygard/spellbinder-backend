const itemId = 0;
const fakePlayerData = [
    {
        id: 1,
        name: "Zoltan",
        level: 1,
        hp: 100,
        maxHp: 100,
        experience: 0,
        class: "warrior",
        talentPoints: 0,
        talents: {
            class: {},
            generic: {},
        },
        stats: {
            strength: 10,
            dexterity: 10,
            intelligence: 10,
        },
        inventory: {
            weapon: itemId,
            armor: itemId,
            trinket: itemId,
            helmet: itemId,
            inventory: [
                itemId,
                itemId,
                itemId,
                itemId,
                itemId,
                itemId,
                itemId,
                itemId,
                itemId,
                itemId,
            ],
        },
        combos: [
            {
                id: 1,
                name: "Quick Healer",
                sequence: [3, 4],
                timeLimit: 10,
                effect: {
                    type: 'heal',
                    value: 20,
                },
            },
            {
                id: 2,
                name: "Damage Boost",
                sequence: [5, 5],
                timeLimit: 15,
                effect: {
                    type: 'damageMultiplier',
                    value: 2,
                    duration: 10,
                },
            },
        ],
    },
];


const { generateBoard, randomLetter, validateWord, letterRarity } = require('./game-utils');
const { getCharactersByUsername, createCharacter } = require('./dynamo-db');
const { authenticateSocket } = require('./auth');
const { callCreatures, getChallengeSummary, getFirstMonsterInChallenge, startMonsterAttacks } = require('./gameController');
const challenges = require('./data/challenges');
const monsters = require('./data/monsters');

class User {
    constructor(id, username, socket, currentCharacter = null, gameState = null, inMatch = false, board = [], combos = []) {
        this.id = id;
        this.username = username;
        this.socket = socket;
        this.currentCharacter = currentCharacter;
        this.gameState = gameState;
        this.inMatch = inMatch;
        this.board = board;
        this.combos = combos;
    }
}


// USERS AND MATCHMAKING START ========================================
let users = [];
let matchmakingQueue = [];

const findUserById = (id) => users.find((user) => user.id === id);

const addUser = (user) => {
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
    const validWordEntries = user.gameState.gameLog.filter(
        (entry) => entry.color === "success"
    );

    // Iterate through the user's combos
    for (const combo of user.combos) {
        let comboIndex = 0;
        let comboStartTime = null;

        // Iterate through the valid word entries in reverse order
        for (let i = validWordEntries.length - 1; i >= 0; i--) {
            const entry = validWordEntries[i];

            // If the word length matches the current combo step
            if (entry.length === combo.sequence[comboIndex]) {
                // If this is the first step in the combo, set the combo start time
                if (comboIndex === 0) {
                    comboStartTime = entry.submittedAt;
                }

                // If the time difference is within the combo time limit, increment the combo index
                if (comboStartTime - entry.submittedAt <= combo.timeLimit * 1000) {
                    comboIndex++;
                } else {
                    // If the time limit is exceeded, reset the combo progress
                    break;
                }

                // If the entire combo sequence has been matched, apply the combo effect and exit the loop
                if (comboIndex === combo.sequence.length) {
                    console.log("CCCCOMBOOO")
                    applyComboEffect(user, combo);
                    break;
                }
            } else {
                // If the word length doesn't match, reset the combo progress
                console.log("NO COMBO FOR YOU")
                break;
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
            // Assuming there's a function applyStatusEffect that handles applying status effects
            applyStatusEffect(user, effect.statusEffect, effect.duration);
            break;

        // Add other combo effect types here as needed

        default:
            console.error(`Unknown combo effect type: ${effect.type}`);
    }
}
// COMBO FUNCTIONS END ========================================


// TILE EFFECTS START ========================================
function applyTileEffectToNewLetter(tileEffects, newLetter) {
    if (tileEffects.length > 0) {
        const effect = tileEffects.shift(); // Remove the least recently added effect
        newLetter.effect = effect;
    }
    return newLetter;
}

function handleTileDuration(user) {
    // Reduce every tile's duration by 1 and remove the effect if the duration is 1
    user.board = user.board.map((row) => {
        return row.map((letterObj) => {
            if (letterObj.effect.duration > 1) {
                console.log("duration:", letterObj.effect.duration)
                letterObj.effect.duration--;

            } else {
                letterObj.effect = [];
            }
            return letterObj;
        });
    });

    // Reduce every tile effect's duration by 1 and remove the effect if the duration is 1
    user.gameState.tileEffects = user.gameState.tileEffects
        .map((effect) => {
            effect.duration--;
            return effect;
        })
        .filter((effect) => effect.duration > 0);
}
// TILE EFFECTS END ========================================

const setupSocket = (io, authenticateSocket) => {
    io.use(authenticateSocket).on('connection', (socket) => {
        console.log('A user connected:', socket.id, "username:", socket.user.username);

        const newUser = new User(socket.id, socket.user.username, socket, null, null, false, [], fakePlayerData[0].combos);
        addUser(newUser);


        // USER DATA EXCHANGE =======================================================
        socket.on("requestPlayerData", () => {
            socket.emit("playerData", { playerData: fakePlayerData });
        });
        // USER DATA EXCHANGE END ===================================================


        // PVE CHALLENGE SELECTION ==================================================
        socket.on('requestChallengeList', () => {
            socket.emit('challengeList', getChallengeSummary(challenges));
        });

        socket.on('challengeSelected', (challengeId) => {
            const challenge = challenges.find((c) => c.id === parseInt(challengeId));
            if (challenge) {
                const firstMonster = getFirstMonsterInChallenge(challenge);
                const gameState = {
                    monster: firstMonster,
                    playerHp: fakePlayerData[0].hp,
                    monsterHp: firstMonster.hp,
                    score: 0,
                    gameLog: [],
                    tileEffects: [],
                };
                updateUser(socket.id, { gameState: gameState });
                let thisUser = findUserById(socket.id);
                startMonsterAttacks(thisUser, firstMonster)
                socket.emit('startChallenge', firstMonster);
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

        socket.on('createCharacter', (characterData) => {
            createCharacter(socket.user.username, characterData);
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

                // WORD VALUE START =====================================================
                let wordValue = 0;
                let multiplier = 1;
                let baseMultiplier = 1.5;

                for (let letterObj of letters) {
                    wordValue += letterRarity(letterObj.letter).value;
                }

                if (letters.length >= 4) {
                    multiplier = Math.pow(baseMultiplier, letters.length - 3);
                }
                wordValue *= multiplier;
                // WORD VALUE END =======================================================

                // GAMESTATE START ======================================================
                user.gameState.monsterHp -= wordValue;

                user.gameState.score += wordValue;

                user.gameState.gameLog.push({
                    word,
                    value: wordValue,
                    color: "success",
                    length: word.length, // Add the word length
                    submittedAt: Date.now(), // Add the submission time
                });
                // GAMESTATE END ========================================================

                // COMBOS START =========================================================
                checkForCombos(user);
                const validWordEntries = user.gameState.gameLog.filter(
                    (entry) => entry.color === "success"
                );
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
