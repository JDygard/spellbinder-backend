const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
dotenv.config();

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  TABLE_NAME,
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
};
