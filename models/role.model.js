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
			},
			role_description: {
				type: DataTypes.STRING,
				allowNull: true
			},
			is_active: {
				type: DataTypes.BOOLEAN,
				allowNull: false,
				defaultValue: true
			},
			permissions: {
				type: DataTypes.TEXT,
				allowNull: true,
			},
			parent_role_id: {
				type: DataTypes.BIGINT,
				allowNull: true
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
		Role.belongsTo(models.Role, {
			foreignKey: "parent_role_id",
			as: "parent_role"
		});
	};

	return Role;
};
