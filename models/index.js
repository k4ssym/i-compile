// models/index.js
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('users', 'postgres', '.nIs08nIs.', {
    host: 'localhost',
    dialect: 'postgres',
});

export default sequelize;
