const sequelize = require('../db')
const {DataTypes} = require('sequelize')

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    user_email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
            isEmail: {args: 1, msg: 'Невалидный email'},
            notEmpty: {args: 1, msg: 'Email не может быть пустым'}
        }
    },
    user_password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {notEmpty: {args: 1, msg: 'Пароль не может быть пустым'}}
    },
})

const UserBalance = sequelize.define('user_balance', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
})
const Purse = sequelize.define('purse', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    purse_summary: {type: DataTypes.DECIMAL, allowNull: false, validate: {isDecimal: true}},
    purse_number: {type: DataTypes.STRING, unique: true, allowNull: false}
})

const Transaction = sequelize.define('transaction', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    transaction_type: {type: DataTypes.STRING, allowNull: false},
    transaction_date: {type: DataTypes.DATE, allowNull: false},
    transaction_balance: {type: DataTypes.DECIMAL, allowNull: false},
    transaction_count: {type: DataTypes.DECIMAL, allowNull: false}
})

const UserBio = sequelize.define('user_bio', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    user_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_second_name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_patronomyc: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    user_number: {
        type: DataTypes.STRING,
        allowNull: false,
    }
})

const Currency = sequelize.define('currency', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    type: {type: DataTypes.STRING, allowNull: false}
})

const Purse_Transaction = sequelize.define('purse_transaction', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
})

User.hasOne(UserBalance)
UserBalance.belongsTo(User)

User.hasOne(UserBio)
UserBio.belongsTo(User)

UserBalance.hasMany(Purse)
Purse.belongsTo(UserBalance)

Currency.hasMany(Purse)
Purse.belongsTo(Currency)

Transaction.belongsToMany(Purse, {through: Purse_Transaction})
Purse.belongsToMany(Transaction, {through: Purse_Transaction})

module.exports = {
    User,
    UserBalance,
    UserBio,
    Purse_Transaction,
    Purse,
    Currency,
    Transaction
}