import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        ssl: {
            require: true, 
            rejectUnauthorized: false
        }
    },
    logging: false // Optional: disables logging of SQL queries to the console
});

export default sequelize;
