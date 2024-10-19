const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  IS_PRODUCTION,
  DEV_USER_TABLE_NAME,
  DEV_CHARACTER_TABLE_NAME,
  DEV_ITEM_TABLE_NAME,
  PROD_USER_TABLE_NAME,
  PROD_CHARACTER_TABLE_NAME,
  PROD_ITEM_TABLE_NAME
} = process.env;

const isProduction = IS_PRODUCTION === 'true';

const TABLE_PREFIX = isProduction ? 'PROD_' : 'DEV_';
const USER_TABLE_NAME = process.env[`${TABLE_PREFIX}USER_TABLE_NAME`];
const CHARACTER_TABLE_NAME = process.env[`${TABLE_PREFIX}CHARACTER_TABLE_NAME`];
const ITEM_TABLE_NAME = process.env[`${TABLE_PREFIX}ITEM_TABLE_NAME`];

const clientConfig = {
  region: AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  }
};

if (!isProduction) {
  clientConfig.endpoint = 'http://localhost:8000';
}

const client = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(client);

const createTableIfNotExists = async (tableName, keySchema, attributeDefinitions, globalSecondaryIndexes = []) => {
  const params = {
    TableName: tableName,
    KeySchema: keySchema,
    AttributeDefinitions: attributeDefinitions,
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  if (globalSecondaryIndexes.length > 0) {
    params.GlobalSecondaryIndexes = globalSecondaryIndexes;
  }

  try {
    await client.send(new CreateTableCommand(params));
    console.log(`Created table: ${tableName}`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table already exists: ${tableName}`);
    } else {
      console.error(`Error creating table ${tableName}:`, error);
      throw error;
    }
  }
};

const initializeTables = async () => {
  try {
    // Users Table
    await createTableIfNotExists(
      USER_TABLE_NAME,
      [{ AttributeName: 'id', KeyType: 'HASH' }],
      [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'username', AttributeType: 'S' }
      ],
      [
        {
          IndexName: 'username-index',
          KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ]
    );

    // Characters Table
    await createTableIfNotExists(
      CHARACTER_TABLE_NAME,
      [
        { AttributeName: 'id', KeyType: 'HASH' },
        { AttributeName: 'username', KeyType: 'RANGE' }
      ],
      [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'username', AttributeType: 'S' }
      ],
      [
        {
          IndexName: 'username-index',
          KeySchema: [{ AttributeName: 'username', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ]
    );

    // Items Table
    await createTableIfNotExists(
      ITEM_TABLE_NAME,
      [{ AttributeName: 'id', KeyType: 'HASH' }],
      [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'name', AttributeType: 'S' }
      ],
      [
        {
          IndexName: 'name-index',
          KeySchema: [{ AttributeName: 'name', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
        }
      ]
    );

  } catch (error) {
    console.error("Error initializing tables:", error);
    throw error;
  }
};

const createUser = async (userData) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const params = {
    TableName: USER_TABLE_NAME,
    Item: {
      id: new Date().getTime().toString(),
      username: userData.username,
      password: hashedPassword,
      characters: [],
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return params.Item;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createCharacter = async (username, characterData) => {
  const params = {
    TableName: CHARACTER_TABLE_NAME,
    Item: {
      id: new Date().getTime().toString(),
      username: username,
      name: characterData.name,
      level: 1,
      experience: 0,
      class: characterData.class,
      talentPoints: 0,
      talents: {
        class: {},
        generic: {},
      },
      inventory: {
        weapon: null,
        armor: null,
        trinket: null,
        helmet: null,
        inventory: Array(10).fill(null)
      },
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return params.Item;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createItem = async (itemData) => {
  const params = {
    TableName: ITEM_TABLE_NAME,
    Item: {
      id: new Date().getTime().toString(),
      name: itemData.name,
      type: itemData.type,
      stats: {
        strength: itemData.stats.strength || 0,
        agility: itemData.stats.agility || 0,
        intellect: itemData.stats.intellect || 0,
      },
      keywords: itemData.keywords || [],
      combos: itemData.combos || [],
    },
  };

  try {
    await docClient.send(new PutCommand(params));
    return params.Item;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getUserByUsername = async (username) => {
  const params = {
    TableName: USER_TABLE_NAME,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: {
      ':u': username,
    },
  };

  try {
    const result = await docClient.send(new QueryCommand(params));
    return result.Items.length ? result.Items[0] : null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getCharactersByUsername = async (username) => {
  const params = {
    TableName: CHARACTER_TABLE_NAME,
    IndexName: 'username-index',
    KeyConditionExpression: 'username = :u',
    ExpressionAttributeValues: {
      ':u': username,
    },
  };

  try {
    const result = await docClient.send(new QueryCommand(params));
    return result.Items.length ? result.Items : [];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const validatePassword = async (user, password) => {
  try {
    const hashedPassword = user.password;
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
  createItem,
  initializeTables,
};
