"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("roles", {
			id: {
				type: Sequelize.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			role_name: {
				type: Sequelize.STRING,
				allowNull: false,
				unique: true
			},
			createdAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW
			},
			updatedAt: {
				type: Sequelize.DATE,
				allowNull: false,
				defaultValue: Sequelize.NOW
			},
			deletedAt: {
				type: Sequelize.DATE,
				allowNull: true
			}
		});

		// Bulk insert predefined roles
		await queryInterface.bulkInsert('roles', [
			{
				role_name: 'Super Admin',
				createdAt: new Date(),
				updatedAt: new Date()
			},
			{
				role_name: 'User',
				createdAt: new Date(),
				updatedAt: new Date()
			}
		], {});
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("roles");
	}
};
