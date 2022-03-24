require('dotenv').config()
const sequelize = require('./db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {User, Purse, UserBalance, Currency, Transaction, Purse_Transaction, UserBio} = require('./models/models')
// const models = require('./models/models')
const fastify = require('fastify')({
    logger: true
})
fastify.register(require('fastify-cors'), {})
const PORT = process.env.PORT || 7000
const generateJwt = (id, email) => {
    return jwt.sign(
        {id, email},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}
fastify.register(require('fastify-swagger'), {
    routePrefix: '/documentation',
    swagger: {
        info: {
            title: 'Крипто-документация',
            description: 'Описание REST API',
            version: '0.1.0'
        },
        host: 'localhost:5000',
        tags: [
            {name: 'Работа с пользователями'},
        ],

        securityDefinitions: {
            apiKey: {
                type: 'apiKey',
                name: 'apiKey',
                in: 'header'
            }
        }
    },
    uiConfig: {
        docExpansion: 'full',
        deepLinking: false
    },
    uiHooks: {
        onRequest: function (request, reply, next) {
            next()
        },
        preHandler: function (request, reply, next) {
            next()
        }
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    exposeRoute: true
})

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

fastify.get('/get_user/:id', {
    schema: {
        description: 'Получаем пользователя по id',
        tags: ['Работа с пользователями'],
        params: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                }
            }
        },
        response: {
            201: {
                description: 'Стандартный ответ',
                type: 'object',
                properties: {
                    id: {example: 1},
                    user_email: {example: "8schmakov8@gmail.com"},
                    user_password: {example: "123"},
                    createdAt: {example: "2021-10-24T11:01:29.973Z"},
                    updatedAt: {example: "2021-10-24T11:01:29.973Z"}
                },
            },
        },
        security: [
            {
                "apiKey": []
            }
        ]
    }
}, async (req, res) => {
    if (req.params.id) {
        try {
            const {id} = req.params
            const user = await User.findOne({
                where: {id}
            })
            res.send(user)
        } catch (e) {
            res.send({
                error: 'Пользователя с таким id не существует'
            })
        }
    } else {
        try {
            const users = await User.findAll()
            res.send(users)
        } catch (e) {
            res.send(e)
        }
    }

})

fastify.post('/create_user', {
    schema: {
        description: 'Создаем пользователя',
        tags: ['Работа с пользователями'],
        body:{
            type:'object',
            properties:{
                user_email: {
                    example:'useremail@gmail.com',
                },
                user_password: {
                    example:'123412qQ',
                }
            }
        },
        response: {
            201: {
                description: 'Стандартный ответ',
                type: 'object',
                properties: {
                   user:{
                       id: {example:15},
                       user_email: {example: "userEmail@gmail.com"},
                       user_password: {example: "$2a$05$l3hSoPJhSMsK9N/B6eH2m.FCITx7ccqrQ.ySarsr7I5o0JQgyqy3a"},
                       updatedAt: {example: "2021-10-31T09:40:31.741Z"},
                       createdAt: {example: "2021-10-31T09:40:31.741Z"}
                   },
                    balance:{
                        id: 12,
                        userId: 15,
                        updatedAt: "2021-10-31T09:40:31.748Z",
                        createdA: "2021-10-31T09:40:31.748Z"
                    },
                    purse:{
                        id: 7,
                        userBalanceId: 12,
                        currencyId: 2,
                        purse_summary: "0",
                        purse_number: "0",
                        updatedAt: "2021-10-31T09:40:31.749Z",
                        createdAt: "2021-10-31T09:40:31.749Z"
                    },
                    bio:{
                        id: 7,
                        user_name: "",
                        user_second_name: "",
                        user_patronomyc: "",
                        user_number: "",
                        userId: 15,
                        updatedAt: "2021-10-31T09:40:31.752Z",
                        createdAt: "2021-10-31T09:40:31.752Z"
                    }
                },
            },
        },
        security: [
            {
                "apiKey": []
            }
        ]
    }
}, async (req, res) => {
    const {user_email, user_password} = req.body
    if (user_password.length >= 8) {
        if (user_password.toLowerCase() !== user_password) {
            const candidate = await User.findOne({where: {user_email: user_email}})
            if (candidate) {
                res.status(500)
                res.send({error: 'Пользователь с таким email уже сущетсвует'})
            } else {
                try {
                    const hashPassword = await bcrypt.hash(user_password, 5)
                    const user = await User.create({user_email, user_password: hashPassword})
                    const balance = await UserBalance.create({userId: user.id})
                    let purseNumber = ''
                    for (let i = 0; i < 10; i++) {
                        purseNumber = getRandomInt(10)
                    }
                    const purse = await Purse.create({
                        userBalanceId: balance.id, // или можем получить с фронта, тип при регистрации предлагать пользователю выбрать валюту и отправлять ее сюда
                        currencyId: 2,
                        purse_summary: 0,
                        purse_number: purseNumber
                    }) //TODO решил что по дефолту будет создаваться 1 кошелек с валютой emg
                    const bio = await UserBio.create({
                        user_name: '',
                        user_second_name: '',
                        user_patronomyc: '',
                        user_number: '',
                        userId: user.id
                    })
                    res.send({user, balance, purse, bio})
                } catch (e) {
                    res.send(e)
                }
            }
        } else {
            res.status(500)
            res.send({
                error: 'Пароль должен включать в себя хотя бы одну заглавную букву'
            })
        }
    } else {
        res.send({
            error: 'Пароль меньше 8 символов'
        })
    }
})

fastify.post('/login', async (req, res) => {
    const {user_email, user_password} = req.body
    const user = await User.findOne({where: {user_email}})
    if (user) {
        let comparePassword = bcrypt.compareSync(user_password, user.user_password)
        if (comparePassword) {
            const token = generateJwt(user.id, user.user_email)
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            let user_balance = await UserBalance.findOne({where: {userId: decoded.id}})
            let user_purses = await Purse.findAll({where: {userBalanceId: user_balance.id}})
            res.send({token: token, purses: user_purses})
        } else {
            res.send('Введен неверный пароль')
        }
    } else {
        res.send('Пользователя с такой почтой не существует')
    }
})

fastify.get('/check', async (req, res) => {
    if (req.method === "OPTIONS") {
        res.send('Неправильный тип запроса')
    }
    try {
        const token = req.headers.authorization.split(' ')[1]
        if (!token) {
            res.status(401).send('Токен отсутствует')
        }
        req.user = jwt.verify(token, process.env.SECRET_KEY)
        res.send({result: true})
    } catch (e) {
        res.status(401).send('Пользователь не авторизован')
    }
})

fastify.get('/get_user_bio', async (req, res) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1]
            // Декодируем токен
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            const userBio = await UserBio.findOne({where: {userId: decoded.id}})
            res.send(userBio)
        } catch (e) {
            const message = 'Невалидный токен'
            res.status(401)
            res.send({message})
        }
    } else {
        const message = 'Пользователь не авторизован, так как отсутствует токен'
        res.status(401)
        res.send({message})
    }

})

fastify.put('/update_user_bio', async (req, res) => {
    const token = req.headers.authorization.split(' ')[1]
    const decoded = jwt.verify(token, process.env.SECRET_KEY)
    const {user_name, user_second_name, user_patronomyc, user_number} = req.body
    if (user_number.length !== 10) {
        res.status(500)
        res.send({error: 'Неверный формат номера'})
    }
    if (Number(Array.from(user_number)[0]) !== 9) {
        res.status(500)
        res.send({error: 'Неправильно введен префикс мобильного оператора(должен начинаться с 9)'})
    }
    if (user_name.length < 2) {
        res.status(500)
        res.send({error: 'Слишком короткое имя'})
    }
    if (user_second_name.length < 2) {
        res.status(500)
        res.send({error: 'Слишком короткая фамилия'})
    }
    if (user_patronomyc.length < 2) {
        res.status(500)
        res.send({error: 'Слишком короткое отчество'})
    }
    try {
        const userBio = await UserBio.update({
            user_name,
            user_second_name,
            user_patronomyc,
            user_number,
        }, {where: {userId: decoded.id}})
        res.send('Успешно обновлено записей: ' + userBio)
    } catch (e) {
        res.send(e)
    }
})


//TODO Работаем с балансом

fastify.get('/get_balance', async (req, res) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1]
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            const balance = await UserBalance.findOne({
                where: {userId: decoded.id}
            })
            res.send(balance)
        } catch (e) {
            const message = 'Невалидный токен'
            res.status(401)
            res.send({message})
        }
    } else {
        const message = 'Пользователь не авторизован, так как отсутствует токен'
        res.status(401)
        res.send({message})
    }
})
fastify.post('/create_balance', async (req, res) => {
    const {userId} = req.body
    if (userId) {
        try {
            const userBalance = await UserBalance.create({userId})
            res.send(userBalance)
        } catch (e) {
            res.send(e)
        }
    } else {
        res.send({
            error: 'Поле userId не должно быть пустым'
        })
    }
})


fastify.get('/get_purse', async (req, res) => {
    if (req.headers.authorization) {
        try {
            const token = req.headers.authorization.split(' ')[1]
            const decoded = jwt.verify(token, process.env.SECRET_KEY)
            const userBalance = await UserBalance.findOne({where: {userId: decoded.id}})
            const userPurses = await Purse.findAll({where: {userBalanceId: userBalance.id}})
            res.send(userPurses)
        } catch (e) {
            res.send(e)
        }
    } else {
        const message = 'Пользователь не авторизован, так как отсутствует токен'
        res.status(401)
        res.send({message})
    }
})
fastify.get('/get_purse_currency/:currencyId', async (req, res) => {
    if (req.params.currencyId) {
        try {
            const currencyId = req.params.currencyId
            const userPurses = await Purse.findAll({where: {currencyId}})
            res.send(userPurses)
        } catch (e) {
            res.send(e)
        }
    } else {
        try {
            const purses = await Purse.findAll()
            res.send(purses)
        } catch (e) {
            res.send(e)
        }
    }
})

fastify.post('/create_purse', async (req, res) => {
    if (req.headers.authorization) {
        const {purse_summary, purse_number, currencyId} = req.body
        const token = req.headers.authorization.split(' ')[1]
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        const balance = await UserBalance.findOne({where: {userId: decoded.id}})
        try {
            const purse = await Purse.create({purse_summary, purse_number, userBalanceId: balance.id, currencyId})
            res.send(purse)
        } catch (e) {
            res.send(e)
        }
    } else {
        res.send({message: 'Пользователь не авторизован'})
    }

})

fastify.get('/currencies/:id', async (req, res) => {
    if (req.params.id) {
        try {
            const id = req.params.id
            const currency = await Currency.findOne({where: {id}})
            if (currency) {
                res.send(currency)
            } else {
                res.send({error: 'Валюты с тамим id не существует'})
            }

        } catch (e) {
            res.send(e)
        }
    } else {
        try {
            const currencies = await Currency.findAll()
            res.send(currencies)
        } catch (e) {
            res.send(e)
        }
    }
})

fastify.post('/create_currency', async (req, res) => {
    const {type} = req.body
    try {
        const currency = await Currency.create({type})
        res.send(currency)
    } catch (e) {
        res.send(e)
    }
})

fastify.post('/create_transaction/:purseId', async (req, res) => {
    const {transaction_type, transaction_date, transaction_balance, transaction_count} = req.body
    const purse = await Purse.findOne({where: {id: req.params.purseId}})
    try {
        if (purse) { // Если кошелек есть, создаем транзакцию
            const transaction = await Transaction.create({
                transaction_type,
                transaction_date,
                transaction_balance,
                transaction_count
            })
            await Purse_Transaction.create({transactionId: transaction.id, purseId: req.body.id})
            res.send(transaction)
        }
    } catch (e) {
        res.send(e)
    }
})

fastify.listen(PORT, async function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
    await sequelize.authenticate()
    await sequelize.sync()
    await fastify.log.info(`server listening on ${address}`)
})

