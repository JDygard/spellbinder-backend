const letterFrequency = "EEEEEEEEEEEEEEEEEEEAAAAAAAAAAIIIIIIIIINNNNNNNOOOOOOOOTTTTTTTRRRRRRSSSSSLLLLLCCCCCUUUUUDMMMMPHFFBBGYWKVJXQZ";

const randomLetter = () => letterFrequency[Math.floor(Math.random() * letterFrequency.length)];

const generateBoard = (size) => {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => randomLetter()));
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