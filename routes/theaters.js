const express = require('express');
const router = express.Router();
let checkAuth = require ('../middleware/check-auth.js');
let checkAdmin = require ('../middleware/check-admin.js');
const Theater = require('../models/theater.js');


// Theaters schema

router.get("/", (req, res) => {
    Theater.find().then(theaters => {
        res.json(theaters);
    }, err => {
        console.log(err);
    });
});


router.get("/:id", (req, res) => {
    let theaterId = (req.params.id);
    Theater.findById(theaterId).then(Theater => {
        res.json(Theater);
    }, err => {
        console.log(err);
    });
});

router.post("/",checkAuth,checkAdmin, (req, res) => {
    if (!checkIfTheaterValid(req.body)) {
        return res.sendStatus(400);
    }
    
    let theater = new Theater(req.body);
    theater.save().then(newTheater => {
        console.log("Theater saved successfully");
        res.json(newTheater);
    }, err => {
        res.send(err);
    });
});

router.put("/",checkAuth,checkAdmin, (req,res) => {
    if (!checkIfTheaterValid(req.body)) {
        return res.sendStatus(400);
    }
    let theater = (req.body);
    Theater.findByIdAndUpdate(theater._id,theater,
        // an option that asks mongoose to return the updated version 
        // of the document instead of the pre-updated one.
        {new: true},
        (err, theater) => {
        // Handle any possible database errors
            if (err) return res.status(500).send(err);
            return res.send(theater);
        }
    )
});

router.delete("/:id",checkAuth,checkAdmin, (req, res) => {

    let theaterId = (req.params.id);
    Theater.findByIdAndRemove(theaterId, (err, theaterObj) => {  
        //handle any potential errors:
        if (err) return res.status(500).send(err);
        //create a simple object to send back with a message and the id of the document that was removed
        const response = {
            message: "Theater successfully deleted",
            objDeleted: theaterObj 
        };
        return res.status(200).send(response);
    });
});

// Search autocomplete

router.get("/search/:term", (req, res) => {
    var regex = new RegExp(req.params["term"], 'i');
    Theater.find({ $or: [{_id: regex}, {name: regex}] }, {}).then(theaters => {
        res.json(theaters);
        console.log(regex);
    }, err => {
        console.log(err);
    });
});

function checkIfTheaterValid(obj) {
    if ((!obj) || (!obj.name) || (!obj.rows) || (!obj.columns) ) {
        return false;
    }
    return true;
}

module.exports = router;
