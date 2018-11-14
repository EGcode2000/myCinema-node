const express = require('express');
let cache = require('../middleware/chaching.js');
let checkAuth = require('../middleware/check-auth.js');
let checkAdmin = require('../middleware/check-admin.js');

const moment = require('moment');
const router = express.Router();
const Movie = require('../models/movie.js');
const Show = require('../models/show.js');

// Movies schema

router.get("/"/*, cache(30)*/, (req, res) => {
    Movie.find({ isDisplaying: true })
        .populate('genreInfo')
        .then(movies => {
            res.json(movies);
        }, err => {
            console.log(err);
        });
});

router.get("/movieListAdmin", checkAuth, checkAdmin/*, cache(30)*/, (req, res) => {

    //sorting: 'Displaying movies' are sorted first

    Movie.find().sort({ isDisplaying: -1 })
        .populate('genreInfo')
        .then(movies => {
            res.json(movies);
        }, err => {
            console.log(err);
        });
});



//the following function will return the best sellers movies!

//To better understand the 'aggregate' framework and the following query see
//see https://www.youtube.com/watch?v=pOJAW4jTjr0
//caching for 24 hours

router.get("/best-sellers2"/*,cache(24*60*60)*/, (req, res) => {

    let startDateTime = moment.utc().subtract(6, 'd');

    Show.aggregate([
        {
            "$match": {
                "dateTime": { $gte: new Date(startDateTime) }
            }
        },
        //next stage: add movies details

        {
            $lookup:
                {
                    from: 'movies',
                    localField: '_MovieId',
                    foreignField: '_id',
                    as: 'movieDetials'
                }
        },
        {
            $unwind: "$movieDetials"
        },
        //next stage: fillter only the movies that are displaying
        {
            $match: { 'movieDetials.isDisplaying': true }
        },

        //next stage: group by id an sum all of the seats ordered
        {
            $group: {
                _id: '$_MovieId',
                count: {
                    $sum: { $size: { $objectToArray: "$showTakenSeats" } }
                },
                movieDetails: { "$first": "$movieDetials" }
            }
        },
        //next stage: sort
        {
            $sort: {
                'count': -1,
            }
        },
        //next stage: only 3 results
        {
            $limit: 3
        },

    ], function (err, result) {
        if (err) {
            //next(err);
            return res.json(err);
        } else {
            res.json(result);
        }
    });
});


router.get("/:id", (req, res) => {
    let movieId = (req.params.id);
    Movie.findById(movieId).populate('genreInfo').then(Movie => {
        res.json(Movie);
    }, err => {
        console.log(err);
    });
});

router.post("/", checkAuth, checkAdmin, (req, res) => {
    if (!checkIfMovieValid(req.body)) {
        return res.sendStatus(400);
    }
    console.log(req.body);
    let movie = new Movie(req.body);
    movie.save().then(newMovie => {
        console.log("Movie saved successfully");
        res.json(newMovie);
    }, err => {
        res.send(err);
    });
});

router.put("/", checkAuth, checkAdmin, (req, res) => {
    if (!checkIfMovieValid(req.body)) {
        return res.sendStatus(400);
    }
    let movie = (req.body);
    Movie.findByIdAndUpdate(movie._id, movie,
        // an option that asks mongoose to return the updated version 
        // of the document instead of the pre-updated one.
        { new: true },
        (err, movie) => {
            // Handle any possible database errors
            if (err) return res.status(500).send(err);
            return res.send(movie);
        }
    )
});

router.delete("/:id", checkAuth, checkAdmin, (req, res) => {

    let movieId = (req.params.id);
    Movie.findByIdAndRemove(movieId, (err, movieObj) => {
        //handle any potential errors:
        if (err) return res.status(500).send(err);
        //create a simple object to send back with a message and the id of the document that was removed
        const response = {
            message: "Movie successfully deleted",
            objDeleted: movieObj
        };
        return res.status(200).send(response);
    });
});

router.get("/search/:term", (req, res) => {
    var regex = new RegExp(req.params["term"], 'i');
    Movie.find({ $or: [{ _id: regex }, { title: regex }, { director: regex }, { releaseYear: regex }] }, {}).then(movies => {
        res.json(movies);
        console.log(regex);
    }, err => {
        console.log(err);
    });
});

function checkIfMovieValid(obj) {
    if ((!obj) || (!obj.title) || (!obj.director) || (!obj.genreList || !Array.isArray(obj.genreList)) || (!obj.posterImagePath) || (!obj.wideImagePath) || (!obj.releaseYear) || (!obj.durationInMin) || (!obj.youtubeTrailer)) {
        return false;
    }
    return true;
}

module.exports = router;