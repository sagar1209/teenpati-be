'use strict';

module.exports = (sequelize, DataTypes) => {
	const Role = sequelize.define(
		"Role",
		{
			id: {
				type: DataTypes.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			role_name: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true
			}
		},
		{
			tableName: "roles",
			timestamps: true,
			paranoid: true
		}
	);

	Role.associate = (models) => {
		Role.hasMany(models.User, {
			foreignKey: "role_id",
			as: "users"
		});	
	};

	return Role;
};
