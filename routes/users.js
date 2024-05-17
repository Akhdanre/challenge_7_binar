var express = require('express');
var router = express.Router();

const userController = require('../controllers/user.controller')
const authMiddleware = require("../middleware/auth_middleware")

router.post('/', userController.register);
router.post('/login', userController.login);
router.get('/whoAmI', authMiddleware, userController.whoami)

router.get("/reset-pass", (req, res, next) => {
    res.render('email')
})
router.get("/send-email", userController.requestUpdatePass)

router.get("/new-pass", (req, res, next) => {
    res.render('reset-pass')

})
module.exports = router;
