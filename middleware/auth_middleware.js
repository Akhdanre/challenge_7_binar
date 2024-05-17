const jwt = require('jsonwebtoken')
const { JWT_SECRET } = process.env

module.exports = (req, res, next) => {
    let { authorization } = req.headers
    if (!authorization || !authorization.split(' ')[1]) {
        return res.status(401).json({
            status: false, 
            message: "token not provided",
            data: null

        }) 
    }
    let token = authorization.split(' ')[1]
    jwt.verify(token , JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(401).json({
                status: false,
                message: err.message,
                data: null
            });
        }
        delete user.iat;
        req.user = user;
        console.log(req.user)
        next();
    })

}