require("dotenv").config();

const ENV_VARIABLE = {
	// Core application settings
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT || 5000,
	DOMAIN: process.env.DOMAIN || "localhost",
	BASE_URL: process.env.BASE_URL,
	// Database configuration
	DATABASE_URL: process.env.DATABASE_URL,
	DB_USER: process.env.DB_USER,
	DB_PASSWORD: process.env.DB_PASSWORD,
	DB_NAME: process.env.DB_NAME,
	DB_HOST: process.env.DB_HOST,
	DB_PORT: process.env.DB_PORT,
	DIALECT: process.env.DIALECT,
	DB_SSL: process.env.DB_SSL == "true",

	// JWT configuration
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_TOKEN_EXPIRATION: process.env.JWT_TOKEN_EXPIRATION,

	// Email configuration (SMTP)
	MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
	MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_PORT: process.env.SMTP_PORT,
	SMTP_USERNAME: process.env.SMTP_USERNAME,
	SMTP_PASSWORD: process.env.SMTP_PASSWORD,
};

module.exports = {
   ENV_VARIABLE,
};
