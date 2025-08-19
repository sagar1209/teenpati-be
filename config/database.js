const { Sequelize } = require('sequelize');
const { ENV_VARIABLE } = require('../constants/envVariable.constant');
const { logger } = require('sequelize/lib/utils/logger');

const sslEnabled = ENV_VARIABLE.DB_SSL;

const sequelize = new Sequelize(
  ENV_VARIABLE.DB_NAME,
  ENV_VARIABLE.DB_USER,
  ENV_VARIABLE.DB_PASSWORD,
  {
    host: ENV_VARIABLE.DB_HOST,
    dialect: ENV_VARIABLE.DIALECT,
    port: ENV_VARIABLE.DB_PORT || 5432,
    logging: false,
    dialectOptions: sslEnabled
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {}, // No SSL for local development
  }
);

const db = require('../models')(sequelize);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Error connecting to the database:', error.message);
    throw new Error('Database connection failed.');
  }
};

module.exports = { sequelize, db, connectDB };
