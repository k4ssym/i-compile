// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    icoins: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
    }
});

export default User;
