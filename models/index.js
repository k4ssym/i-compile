// models/index.js
import { Sequelize } from 'sequelize';

const sequelize = new Sequelize('users', 'postgres', '.nIs08nIs.', {
    host: 'localhost',
    dialect: 'postgres',
});
sequelize.sync({ alter: true }).catch(err => {
    console.error('Database sync error:', err);
    process.exit(1);
});


export default sequelize;
