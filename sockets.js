const { generateBoard, randomLetter, validateWord, letterRarity } = require('./game-utils');
const { authenticateSocket } = require('./auth');
var userArray = [];

const setupSocket = (io, authenticateSocket) => {
    console.log(authenticateSocket);
    io.use(authenticateSocket).on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        
        userArray.push(socket.user.username);

        socket.on('requestPVEData', () => {
            console.log("Requesting PVE data...");
            // Generate and send PVE-specific data to the client
            socket.emit('playerData', { pveData: 'Sample PVE data' });
          });

        socket.on("requestPlayerData", () => {
            console.log("Requesting player data...");
        });

        socket.on('generateBoard', (size) => {
            const newBoard = generateBoard(size);
            socket.emit('newBoard', newBoard);
        });

        socket.on('replaceSelectedLetters', ({ board, selectedLetters }) => {
            const updatedBoard = board.map((row, rowIndex) => {
                return row.map((letter, colIndex) => {
                    if (selectedLetters.some((pos) => pos.row === rowIndex && pos.col === colIndex)) {
                        return randomLetter();
                    }
                    return letter;
                });
            });
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
        });
    });
};

module.exports = setupSocket;
