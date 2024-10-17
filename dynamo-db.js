const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  TABLE_NAME,
  CHARACTER_TABLE_NAME
} = process.env;

AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  region: AWS_REGION,
});

const docClient = new AWS.DynamoDB.DocumentClient();

const getUserByUsername = async (username) => {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: {
      ':u': username,
    },
  };

  try {
    const result = await docClient.query(params).promise();
    return result.Items.length ? result.Items[0] : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const params = {
    TableName: TABLE_NAME,
    Item: {
      id: new Date().getTime().toString(),
      username: userData.username,
      password: hashedPassword,
      characters: [],
    },
  };

  try {
    await docClient.put(params).promise();
    return params.Item;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createCharacter = async (username, userId, characterData) => {
  const params = {
    TableName: CHARACTER_TABLE_NAME,
    Item: {
      characterId: new Date().getTime().toString(),
      userId: userId,
      username: username,
      name: characterData.name,
      level: 1,
      experience: 0,
      class: characterData.class,
      talentPoints: 0,
      talents: { class: {}, generic: {} },
      stats: { strength: 10, dexterity: 10, intelligence: 10 },
      inventory: [
        { weapon: null },
        { armor: null },
        { trinket: null },
        { helmet: null },
        { inventory: [null, null, null, null, null, null, null, null, null, null] },
      ],
    },
  };

  try {
    await docClient.put(params).promise();
    return params.Item;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getCharactersByUsername = async (username) => {
  const params = {
    TableName: 'characters',
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: {
      ':u': username,
    },
  };

  try {
    const result = await docClient.query(params).promise();
    return result.Items.length ? result.Items : [];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const validatePassword = async (user, password) => {
  try {
    const hashedPassword = user.password; // Extract the hashed password from the user object
    const isValid = await bcrypt.compare(password, hashedPassword);
    return isValid;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = {
  getUserByUsername,
  createUser,
  validatePassword,
  getCharactersByUsername,
  createCharacter,
};
