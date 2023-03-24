const itemId = 0;
const fakePlayerData = [
    {
      id: 1,
      name: "Zoltan",
      level: 1,
      hp: 100,
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
    },
  ];

const { generateBoard, randomLetter, validateWord, letterRarity } = require('./game-utils');
const { getCharactersByUsername, createCharacter } = require('./dynamo-db');
const { authenticateSocket } = require('./auth');
const { callCreatures, getChallengeSummary, getFirstMonsterInChallenge, startMonsterAttacks } = require('./gameController');
const challenges = require('./data/challenges');
const monsters = require('./data/monsters');

class User {
    constructor(id, username, socket, currentCharacter = null, gameState = null, inMatch = false, board = []) {
        this.id = id;
        this.username = username;
        this.socket = socket;
        this.currentCharacter = currentCharacter;
        this.gameState = gameState;
        this.inMatch = inMatch;
        this.board = board;
    }
}

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

const setupSocket = (io, authenticateSocket) => {
    io.use(authenticateSocket).on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        console.log('User:', socket.user);

        const newUser = new User(socket.id, socket.user.username, socket);
        addUser(newUser);


        // USER DATA EXCHANGE =======================================================
        socket.on('requestPVEData', () => {
            console.log("Requesting PVE data...");
            // Generate and send PVE-specific data to the client
            socket.emit('playerData', { pveData: 'Sample PVE data' });
        });

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
            console.log("Requesting characters...");
            const characters = await getCharactersByUsername(socket.user.username);
            socket.emit('characters', characters);
        });

        socket.on('createCharacter', (characterData) => {
            console.log("Creating character...");
            createCharacter(socket.user.username, characterData);
        });

        // CHARACTER SELECT SCREEN END ==============================================


        // GENERAL BOARD ACTIONS ====================================================
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
                        return randomLetter();
                    }
                    return letter;
                });
            });
            updateUser(socket.id, { board: updatedBoard });
            socket.emit('updatedBoard', updatedBoard);
        });

        socket.on('submitWord', async (word) => {
            console.log(`Received word: ${word} from ${socket.id}`);
            // if word is less than 3 letters, return
            if (word.length < 3) {
                console.log('1 or 2 letter word declined');
                return;
            }
        
            const isValid = await validateWord(word);
            if (isValid) {
                console.log('Valid word:', word);
        
                // Calculate the word value
                let wordValue = 0;
                for (let letter of word) {
                    wordValue += letterRarity(letter).value;
                }
        
                // Apply damage to the monster
                const user = findUserById(socket.id);
                user.gameState.monsterHp -= wordValue;
                console.log('Monster HP:', user.gameState.monsterHp)
        
                // Update the score
                user.gameState.score += wordValue;
        
                // Add the word to the game log
                user.gameState.gameLog.push({ word, value: wordValue, color: 'success' });
        
                // Send the updated game state to the client
                socket.emit('wordAccepted', { word, wordValue });
                socket.emit('gameStateUpdate', user.gameState);
                socket.emit('gameLogUpdate', user.gameState.gameLog);
            } else {
                const user = findUserById(socket.id);
                user.gameState.gameLog.push({ word, value: 0, color: 'fail' });
                socket.emit('wordRejected', word);
            }
        });

        // GENERAL BOARD ACTIONS END ================================================


        socket.on('disconnect', () => {
            console.log(`A user disconnected: ${socket.id}, username: ${socket.user.username}`);
            removeUser(socket.id);
        });
    });
};

module.exports = setupSocket;
