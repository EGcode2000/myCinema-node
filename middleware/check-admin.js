const jwt = require("jsonwebtoken");
const User = require('../models/user.js');

module.exports = (req, res, next) => {
    try {
        User.findById(req.userData._UserId).then(User => {
            if (User.isAdmin === true) {
                console.log('auth  admin succes');
                next();
            } else {
                console.log('auth admin faild');
                res.status(401).json({ message: "Auth failed!" });
            }
        });
    } catch (error) {
        console.log('auth admin faild');
        res.status(401).json({ message: "Auth failed!" });
    }
};
