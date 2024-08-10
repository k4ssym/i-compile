import { Sequelize } from 'sequelize';

// Use the External Database URL for the connection
const sequelize = new Sequelize('postgresql://users_wdyn_user:qrv6rlo2yqNmeYTUUUZzWOPSrLvKv66z@dpg-cqrl2f0gph6c73a13np0-a.oregon-postgres.render.com/users_wdyn', {
    dialect: 'postgres',
    ssl: {
        require: true,
        rejectUnauthorized: false // This is important if you are connecting to a hosted database
    }
});

export default sequelize;
