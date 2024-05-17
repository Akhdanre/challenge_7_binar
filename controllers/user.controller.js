const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient
const bcrypt = require("bcrypt")
const sentry = require("../libs/sentry_logging")
const jwt = require("jsonwebtoken")
const { getHTML, sendMail } = require("../libs/nodemailer")
const { JWT_SECRET } = process.env

addNotification = async (userId, message) => {
    await prisma.notification.create({
        data: {
            userId,
            message
        }
    })
}

sendNotification = async (io, email, userId) => {
    let notifications = await prisma.notification.findMany({ where: { userId } })
    io.emit(`user`, notifications)
}

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
        let { new_password, confirm_password } = req.body;
        let { token } = req.query;
        let { email } = jwt.verify(token, JWT_SECRET)
        try {
            let userExist = await prisma.user.findFirst({ where: { email } });

            if (!userExist) {
                return res.status(404).json({ message: 'User not found' });
            }

            if (new_password !== confirm_password) {
                addNotification(updateUser.id, "password do not match")
                sendNotification(io, updateUser.email, updateUser.id)
                return res.status(400).json({ message: 'Passwords do not match' });
            }

            const hashedPassword = await bcrypt.hash(new_password, 10);

            let updateUser = await prisma.user.update({
                where: { id: userExist.id },
                data: { password: hashedPassword },
            });
            const io = req.app.get('io');
            addNotification(updateUser.id, "success change password")
            sendNotification(io, updateUser.email, updateUser.id)

            // return res.status(200).json({ message: 'Password updated successfully' });
        } catch (error) {
            sentry.captureException(error)
            next(error)
        }
    },
    requestUpdatePass: async (req, res, next) => {
        const { email } = req.query
        let token = jwt.sign({ email }, JWT_SECRET)
        let url = `${req.protocol}://${req.get('host')}/users/new-pass?token=${token}`;
        try {
            let html = await getHTML('verification.ejs', { reset_pass_url: url });
            await sendMail(email, 'Verification Email', html);
            res.render('success')
        } catch (error) {
            sentry.captureException(error)
        }
    }
}