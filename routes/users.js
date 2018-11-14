const express = require('express');
const router = express.Router();
let checkLogout = require ('../middleware/check-logout.js');
let checkAuth = require('../middleware/check-auth.js');
let checkAdmin = require('../middleware/check-admin.js');
const User = require('../models/user.js');

//The users managment of the cinema will be done in version 2
// this route is not 100% done. 

// Users schema


router.get("/", checkAuth, checkAdmin, (req, res) => {
    User.find({}, '_id username email firstName lastName').then(users => {
        res.json(users);
    }, err => {
        console.log(err);
    });
});


router.get("/:id", checkAuth, checkAdmin, (req, res) => {
    let userId = (req.params.id);
    User.findById(userId, '_id username email firstName lastName').then(User => {
        res.json(User);
    }, err => {
        console.log(err);
    });
});

router.post("/",checkLogout, (req, res) => {
    if (!req.body)
        return res.sendStatus(400);
    
    let user = new User(req.body);
    user.save().then(newUser => {
        console.log("User saved successfully");
        res.json(newUser);
    }, err => {
        res.send(err);
    });
});


router.put("/", (req,res) => {

    let user = (req.body);
    User.findByIdAndUpdate(user._id,user,
        // an option that asks mongoose to return the updated version 
        // of the document instead of the pre-updated one.
        {new: true},
        (err, user) => {
        // Handle any possible database errors
            if (err) return res.status(500).send(err);
            return res.send(user);
        }
    )
});

router.delete("/:id",checkAuth, checkAdmin, (req, res) => {

    let userId = (req.params.id);
    User.findByIdAndRemove(userId, (err, userObj) => {  
        //handle any potential errors:
        if (err) return res.status(500).send(err);
        //create a simple object to send back with a message and the id of the document that was removed
        const response = {
            message: "user successfully deleted",
            id: userId 
        };
        return res.status(200).send(response);
    });
});


router.get("/search/:term", checkAuth, checkAdmin, (req, res) => {
    var regex = new RegExp(req.params["term"], 'i');
    User.find( { $or: [{username: regex}, {email: regex}, {firstName: regex}, {lastName: regex}] }, '_id username email firstName lastName').then(user => {
        res.json(user);
        console.log(regex);
    }, err => {
        console.log(err);
    });
});

module.exports = router;
