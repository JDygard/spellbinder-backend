const letterFrequency = "EEEEEEEEEEEEEEEEEAAAAAAAAIIIIIIINNNNNNNOOOOOOTTTTTTTRRRRRRSSSSSLLLLLCCCCCUUUUDMMMMPHFFBBGYWKVJXQZ";

let key = 0;
const keyGenerator = () => {
  console.log("keyGenerator key:", key)
  return () => {
    key += 1;
    return key;
  };
};

const randomLetter = () => {
  return {
    letter: letterFrequency[Math.floor(Math.random() * letterFrequency.length)],
    key: keyGen(),
    effect: {},
  };
};

const keyGen = keyGenerator();

const generateBoard = (size) => {
  const board = [];
  for (let i = 0; i < size; i++) {
    const row = [];
    for (let j = 0; j < size; j++) {
      row.push(randomLetter());
    }
    board.push(row);
  }
  return board;
};

const letterRarity = (letter) => {
    const commonLetters = 'ETAONRIS';
    const rareLetters = 'JKQXZ';
  
    if (commonLetters.includes(letter)) {
      return { value: 1, color: 'copper' };
    } else if (rareLetters.includes(letter)) {
      return { value: 3, color: 'gold' };
    } else {
      return { value: 2, color: 'silver' };
    }
  };

const validateWord = async (word) => {
    try {
        const fetchModule = await import("node-fetch");
        const fetch = fetchModule.default;
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (response.ok) {
        const data = await response.json();
        return data.length > 0;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Error validating word:", error);
      return false;
    }
  };

module.exports = { randomLetter, generateBoard, validateWord, letterRarity };