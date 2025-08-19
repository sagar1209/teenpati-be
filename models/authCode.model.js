"use strict";

module.exports = (sequelize, DataTypes) => {
	const AuthCode = sequelize.define(
		"AuthCode",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			user_id: {
				type: DataTypes.BIGINT,
				allowNull: false
			},
			otp_code: {
				type: DataTypes.STRING,
				allowNull: false
			},
			expiration: {
				type: DataTypes.DATE,
				allowNull: false
			},
			is_verified: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			}
		},
		{
			tableName: "auth_codes",
			timestamps: true,
			paranoid: true
		}
	);

	AuthCode.associate = (models) => {
		AuthCode.belongsTo(models.User, {
			foreignKey: "user_id",
			as: "user"
		});
	};

	return AuthCode;
};
