const itemId = 0;
const fakePlayerData = [{
    id: 1,
    name: 'Zoltan',
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
    stats: {
        strength: 10,
        dexterity: 10,
        intelligence: 10,
    },
    inventory: [
        { weapon: itemId },
        { armor: itemId },
        { trinket: itemId },
        { helmet: itemId },
        { inventory: [itemId, itemId, itemId, itemId, itemId, itemId, itemId, itemId, itemId, itemId] }
    ]
}];

const { generateBoard, randomLetter, validateWord, letterRarity } = require('./game-utils');
const { getCharactersByUsername, createCharacter } = require('./dynamo-db');
const { authenticateSocket } = require('./auth');
const { callCreatures, getChallengeSummary } = require('./gameController');
const challenges = require('./data/challenges');
const monsters = require('./data/monsters');

class User {
    constructor(id, username, currentCharacter = null, gameState = 'idle', inMatch = false, board = []) {
        this.id = id;
        this.username = username;
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

        const newUser = new User(socket.id, socket.user.username);
        addUser(newUser);

        socket.on('requestPVEData', () => {
            console.log("Requesting PVE data...");
            // Generate and send PVE-specific data to the client
            socket.emit('playerData', { pveData: 'Sample PVE data' });
        });

        socket.on('requestChallengeList', () => {
            console.log(getChallengeSummary(challenges))
            socket.emit('challengeList', getChallengeSummary(challenges));
          });

        socket.on("requestPlayerData", () => {
            socket.emit("playerData", { playerData: fakePlayerData });
        });

        socket.on('generateBoard', (size) => {
            const newBoard = generateBoard(size);
            updateUser(socket.id, { board: newBoard });
            socket.emit('newBoard', newBoard);
        });

        socket.on('requestCharacters', async () => {
            console.log("Requesting characters...");
            const characters = await getCharactersByUsername(socket.user.username);
            socket.emit('characters', characters);
        });

        socket.on('createCharacter', (characterData) => {
            console.log("Creating character...");
            createCharacter(socket.user.username, characterData);
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

                socket.emit('wordAccepted', word);
            } else {
                console.log('Invalid word:', word);
                // Handle the invalid word case as required
            }
        });

        socket.on('disconnect', () => {
            console.log(`A user disconnected: ${socket.id}, username: ${socket.user.username}`);
            removeUser(socket.id);
        });
    });
};

module.exports = setupSocket;
