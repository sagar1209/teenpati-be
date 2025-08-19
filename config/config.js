require('dotenv').config();

const { ENV_VARIABLE } = require('../constants/envVariable.constant');

const sslEnabled = ENV_VARIABLE.DB_SSL;

module.exports = {
  username: ENV_VARIABLE.DB_USER,
  password: ENV_VARIABLE.DB_PASSWORD,
  database: ENV_VARIABLE.DB_NAME,
  host: ENV_VARIABLE.DB_HOST,
  dialect: ENV_VARIABLE.DIALECT,
  port: ENV_VARIABLE.DB_PORT || 5432,
  dialectOptions: sslEnabled
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      }
    : {}, // No SSL for local development
};
