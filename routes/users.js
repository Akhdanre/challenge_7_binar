var express = require('express');
var router = express.Router();

const userController = require('../controllers/user.controller')

router.get('/', userController.register);

module.exports = router;
