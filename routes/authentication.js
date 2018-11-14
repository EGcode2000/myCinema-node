const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bCrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
let checkLogout = require('../middleware/check-logout.js');
var ExpressBrute = require('express-brute');

var store = new ExpressBrute.MemoryStore(); // stores state locally, before production look at: https://github.com/AdamPflug/express-brute/issues/10
var bruteforce = new ExpressBrute(store);

//token

router.post('/signup'/*, checkLogout*/, (req, res, next) => {

    if (!checkIfSignupValid(req.body)) {
        return res.sendStatus(400);
    }

    // Check if username exists

    User.findOne({ 'username': req.body.username },
        (err, user) => {
            if (err) {
                return res.json(err);
            }
            console.log('res user');
            console.log(user);
            if (user) {
                // User already exists
                console.log('User already exists: ' + req.body.username);
                return res.status(401).json({ 'message': 'Username already in use!' });
            }

            // Create a new user
            let newUser = new User();
            newUser.username = req.body.username;
            newUser.password = createHash(req.body.password);
            newUser.email = req.body.email;
            newUser.firstName = req.body.firstName;
            newUser.lastName = req.body.lastName;

            newUser.save((err) => {
                if (err) {
                    console.log("Error in saving user:" + user);
                    return res.json(err);
                }
                // success
                return res.json({
                    'status': 'success',
                });
                //return res.json(newUser); 
            });
        }
    );
});

router.post('/login', bruteforce.prevent, (req, res, next) => {

    if (!checkIfLoginValid(req.body)) {
        return res.sendStatus(400);
    }
    // Check if username exists
    User.findOne({ 'username': req.body.username },
        (err, user) => {
            if (err) {
                return res.json(err);
            }

            if (!user) {
                console.log("User not found: " + req.body.username);
                return res.status(401).json({ 'message': 'Incorrect username or password' });

            }

            if (!isValidPassword(user, req.body.password)) {
                console.log("Invalid password");
                return res.status(401).json({ 'message': 'Incorrect username or password' });
            }

            // return a successful login
            // success
            const token = jwt.sign({
                id: user._id,
                email: user.email,
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                isAdmin: user.isAdmin
            }, 'secret_this_should_be_longer',
                { expiresIn: "1h" }
            );
            return res.json({
                token: token,
                expiresInDuration: 3600
            });
            //return res.status(200).json(user);
        }
    );
});

function createHash(password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}

function isValidPassword(user, password) {
    return bCrypt.compareSync(password, user.password);
}

function checkIfLoginValid(obj) {
    if ((!obj) || (!obj.username) || (!obj.password)) {
        return false;
    }
    return true;
}

function checkIfSignupValid(obj) {
    if ((!obj) || (!obj.username) || (!obj.password) || (!obj.email) || (!obj.firstName) || (!obj.lastName)) {
        return false;
    }
    return true;
}

module.exports = router;
