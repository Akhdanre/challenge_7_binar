const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient
const bcrypt = require("bcrypt")
const sentry = require("../libs/sentry_logging")
const jwt = require("jsonwebtoken")
const { getHTML, sendMail } = require("../libs/nodemailer")
const { JWT_SECRET } = process.env

module.exports = {
    register: async (req, res, next) => {
        let { email, password, name } = req.body

        if (!email || !password || !name) {
            return res.status(400).json({
                status: "failed",
                message: "field cant null",
                data: null
            })
        }
        try {
            let userExist = await prisma.user.findFirst({ where: { email } })
            if (userExist) {
                return res.status(400).json({
                    status: "failed",
                    message: "Email already registered",
                    data: null
                })
            }

            let bcryptPass = await bcrypt.hash(password, 10);
            let newUser = await prisma.user.create({
                data: {
                    email,
                    password: bcryptPass,
                    name
                }
            })
            if (!newUser) {
                return res.status(400).json({
                    status: "failed",
                    message: "regsiter failed",
                    data: null
                })
            }
            delete newUser.password
            return res.status(200).json({
                status: "Succes",
                message: "Succes register new user",
                data: newUser
            })
        } catch (error) {
            sentry.captureException(error)
            next(error)
        }
    },
    login: async (req, res, next) => {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({
                status: "failed",
                message: "field cant empty",
                data: null
            })

        }
        try {
            let user = await prisma.user.findFirst({ where: { email } })
            if (!user) {
                return res.status(400).json({
                    status: "failed",
                    message: "user not registered",
                    data: null
                })
            }

            let isPasswordCorrect = await bcrypt.compare(password, user.password)
            if (!isPasswordCorrect) {
                return res.status(400).json({
                    status: "failed",
                    message: "check again email and password",
                    data: null
                })
            }
            delete user.password
            let token = jwt.sign({ user }, JWT_SECRET)
            res.json({
                status: true,
                message: 'OK',
                data: { ...user, token }
            })
        } catch (error) {
            sentry.captureException(error)
            next(error)
        }
    },
    whoami: async (req, res, next) => {
        try {
            res.json({
                status: true,
                message: 'OK',
                data: req.user
            });
        } catch (error) {
            sentry.captureException(error)
            next(error);
        }
    },
    updatePass: async (req, res, next) => {
        let { email } = req.body
        try {
            let userExist = await prisma.user.findFirst({ where: { email } })
        } catch (error) {

        }
    },

    requestUpdatePass: async (req, res, next) => {
        const { email } = req.query
        console.log(email)
        let url = `${req.protocol}://${req.get('host')}/users/new-pass?email=${email}`;
        try {
            let html = await getHTML('verification.ejs', { reset_pass_url: url });
            await sendMail(email, 'Verification Email', html);
            res.render('success')
        } catch (error) {
            sentry.captureException(error)
        }
    }
}