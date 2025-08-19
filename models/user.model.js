'use strict';

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define(
		"User",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			username: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			},
			contact_number: {
				type: DataTypes.STRING,
				allowNull: true,
				unique: true
			},
			password: {
				type: DataTypes.STRING,
				allowNull: false
			},
			role_id: {
				type: DataTypes.BIGINT,
				allowNull: false
			},
			is_verified: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: false
			}
		},
		{
			tableName: "users",
			timestamps: true,
			paranoid: true
		}
	);

	User.associate = (models) => {
		User.belongsTo(models.Role, {
			foreignKey: "role_id",
			as: "role"
		});
	};

	return User;
};
