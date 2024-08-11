import { Sequelize } from 'sequelize';

const isProduction = process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(
  isProduction ? 'd7uqi3igoju150' : 'users',
  isProduction ? 'u5fi7mra6e231o' : 'postgres',
  isProduction ? 'p40ae4b623e71d654bb5345479435044f3bc1c15ea797a95bf4414c711c225ae6' : '.nIs08nIs.',
  {
    host: isProduction ? 'ccpa7stkruda3o.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com' : 'localhost',
    dialect: 'postgres',
    dialectOptions: isProduction
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  }
);

sequelize.sync({ alter: true }).catch(err => {
  console.error('Database sync error:', err);
  process.exit(1);
});

export default sequelize;
