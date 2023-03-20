const AWS = require('aws-sdk');
require('dotenv').config();


AWS.config.update({
  region: 'your-region', // e.g., 'us-west-2'
  accessKeyId: process.env.AWSAccessKey,
  secretAccessKey: process.env.AWSSecretKey,
});

module.exports = AWS;