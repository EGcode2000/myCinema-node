const express = require('express');
let cache = require('../middleware/chaching.js');
let checkAuth = require('../middleware/check-auth.js');
let checkAdmin = require('../middleware/check-admin.js');

const router = express.Router();

const Genre = require('../models/genre.js');

// Genre schema
router.get("/", cache(24 * 60 * 60), (req, res) => {
    Genre.find().then(genres => {
        console.log(genres);
        res.json(genres);
    }, err => {
        console.log(err);
    });
});

router.post("/"/*,checkAuth,checkAdmin*/, (req, res) => {
    if (!checkIfGenreValid(req.body)) {
        return res.sendStatus(400);
    }

    let genre = new Genre(req.body);
    genre.save().then(newGenre => {
        console.log("Genre saved successfully");
        res.json(newGenre);
    }, err => {
        res.send(err);
    });
});

router.put("/", checkAuth, checkAdmin, (req, res) => {
    if (!checkIfGenreValid(req.body)) {
        return res.sendStatus(400);
    }
    let genre = (req.body);
    Genre.findByIdAndUpdate(genre._id, genre,
        // an option that asks mongoose to return the updated version 
        // of the document instead of the pre-updated one.
        { new: true },
        (err, genre) => {
            // Handle any possible database errors
            if (err) return res.status(500).send(err);
            return res.send(genre);
        }
    )
});

router.delete("/:id", checkAuth, checkAdmin, (req, res) => {

    let genreId = (req.params.id);
    Genre.findByIdAndRemove(genreId, (err, genreObj) => {
        //handle any potential errors:
        if (err) return res.status(500).send(err);
        //create a simple object to send back with a message and the id of the document that was removed
        const response = {
            message: "Genre successfully deleted",
            objDeleted: genreObj
        };
        return res.status(200).send(response);
    });
});

// Search autocomplete

router.get("/search/:term", (req, res) => {
    var regex = new RegExp(req.params["term"], 'i');
    Genre.find({ $or: [{ _id: regex }, { genre: regex }] }, {}).then(genres => {
        res.json(genres);
        console.log(regex);
    }, err => {
        console.log(err);
    });
});

function checkIfGenreValid(obj) {
    if ((!obj) || (!obj.genre)) {
        return false;
    }
    return true;
}

module.exports = router;