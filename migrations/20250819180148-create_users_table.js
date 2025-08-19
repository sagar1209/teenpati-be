"use strict";

const { generatehashPassword } = require('../utils/hash.util');
const { ROLE } = require('../constants/rolePermission.constant');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
	async up(queryInterface, Sequelize) {
		await queryInterface.createTable("users", {
			id: {
				type: Sequelize.BIGINT,
				autoIncrement: true,
				primaryKey: true,
				allowNull: false
			},
			username: {
				type: Sequelize.STRING,
				allowNull: false,
			},
			email: {
				type: Sequelize.STRING,
				allowNull: false,
				validate: {
					isEmail: true
				}
			},
			contact_number: {
				type: Sequelize.STRING,
				allowNull: true
			},
			password: {
				type: Sequelize.STRING,
				allowNull: false
			},
			role_id: {
				type: Sequelize.BIGINT,
				allowNull: false,
				references: {
					model: 'roles',
					key: 'id'
				},
				onUpdate: 'CASCADE',
				onDelete: 'RESTRICT'
			},
			is_verified: {
				type: Sequelize.BOOLEAN,
				allowNull: false,
				defaultValue: false
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

		// Get the Super Admin role ID dynamically
		const superAdminRole = await queryInterface.sequelize.query(
			`SELECT id FROM roles WHERE role_name = '${ROLE.SUPER_ADMIN}' LIMIT 1`,
			{ type: Sequelize.QueryTypes.SELECT }
		);

		if (superAdminRole.length > 0) {
			const superAdminRoleId = superAdminRole[0].id;
            const hashedPassword = await generatehashPassword("Admin@123");
			
			// Insert super admin user with dynamic role ID
			await queryInterface.bulkInsert('users', [
				{
					username: 'superadmin1',
					email: 'admin@teenpati.com',
					contact_number: '+919876543210',
					password: hashedPassword,
					role_id: superAdminRoleId,
					is_verified: true,
					createdAt: new Date(),
					updatedAt: new Date()
				}
			], {});
		}
	},

	async down(queryInterface, Sequelize) {
		await queryInterface.dropTable("users");
	}
};
