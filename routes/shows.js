//const moment = require('moment');
const moment = require('moment-timezone');
const express = require('express');
const router = express.Router();
let checkAuth = require('../middleware/check-auth.js');
let checkAdmin = require('../middleware/check-admin.js');
const Show = require('../models/show.js');
const Movie = require('../models/movie.js');
const Theater = require('../models/theater.js');
const Order = require('../models/order.js');



router.get("/", (req, res) => {
    Show.find().sort({ dateTime: -1 }).populate('movieInfo').populate('theaterInfo').then(shows => {
        res.json(shows);
    }, err => {
        console.log(err);
    });
});


//this function will return an array with dates and times
//of all the shows in the folowing week
// a real masterpeice!

router.get("/schedule/:movieid", (req, res) => {

    let paramMovieId = (req.params.movieid);
    let dateRange = [];

    for (i = 0; i < 7; i++) {
        dateRange.push(moment().add(i, 'd').format('YYYY-MM-DD'));
    }

    console.log(dateRange);

    // date objects are being saved in the DB in UTC timezone. we need to change it back to local time.
    // we can do it using 'aggregation expressions':
    // see - https://docs.mongodb.com/manual/reference/operator/query/expr/index.html
    // see - https://docs.mongodb.com/manual/reference/operator/aggregation/setIsSubset/

    Show.find({
        _MovieId: paramMovieId, '$expr': {
            '$setIsSubset': [
                [{
                    '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$dateTime',
                        'timezone': 'Asia/Jerusalem'
                    }
                }],
                dateRange
            ]
        }
    }, {}).sort({ dateTime: 1 })
        .populate('movieInfo')
        .populate('theaterInfo')
        .then(show => {
            let showRespond = {};
            //saving it as as a array of object so i could *ngfor the results in angular  
            show.forEach(element => {
                //let dateTime = moment(element.dateTime).tz("Asia/Jerusalem").format();
                let dateTime = moment(element.dateTime).format();
                let date = moment(dateTime).tz("Asia/Jerusalem").format('YYYY-MM-DD');
                let time = moment(dateTime).tz("Asia/Jerusalem").format('HH:mm');
                console.log(time);
                if (!showRespond.hasOwnProperty(date)) {
                    if (!moment(element.dateTime).isBefore(moment())) {
                        showRespond[date] = [];
                        let obj = {};
                        obj[time] = element._id;
                        showRespond[date].push(obj);
                    }
                } else {
                    let obj = {};
                    obj[time] = element._id;
                    showRespond[date].push(obj);
                }
            });

            //saving it as as a array of object so i could *ngfor the results in angular
            let newRespond = [];
            for (let key in showRespond) {
                let obj = {};
                obj[key] = showRespond[key];
                newRespond.push(obj);
            }
            res.json(newRespond);
        }, err => {
            console.log(err);
        });
});

//this function will return only the shows of the next 3 days

router.get("/coming", (req, res) => {
    let currentDateTime = moment.utc();
    let endOfDate = moment().add(1, 'd');
    //console.log('work');
    let dateRange = [];

    for (i = 0; i < 1; i++) {
        dateRange.push(moment().add(i, 'd').format('YYYY-MM-DD'));
    }
    console.log(dateRange);

    Show.find({
        dateTime: { $gte: currentDateTime }, '$expr': {
            '$setIsSubset': [
                [{
                    '$dateToString': {
                        'format': '%Y-%m-%d',
                        'date': '$dateTime',
                        'timezone': 'Asia/Jerusalem'
                    }
                }],
                dateRange
            ]
        }
    }).sort({ dateTime: 1 })
        .populate('movieInfo')
        .populate('theaterInfo')
        .then(shows => {
            //filter shows of movies that are not displaying
            shows = shows.filter((obj) => {
                return obj.movieInfo[0].isDisplaying === true;
            });
            console.log('result');
            console.log(shows);
            res.json(shows);
        }, err => {
            console.log(err);
        });
});

router.get("/:id", (req, res) => {
    let showId = (req.params.id);
    Show.findById(showId).populate('movieInfo').populate('theaterInfo').then(show => {
        res.json(show);
    }, err => {
        console.log(err);
    });
});

router.put("/:id", checkAuth, checkAdmin, (req, res) => {
    if (!checkIfShowValid(req.body)) {
        return res.sendStatus(400);
    }
    let showId = (req.params.id);
    let show = (req.body);
    Show.findByIdAndUpdate(showId, show,
        // an option that asks mongoose to return the updated version 
        // of the document instead of the pre-updated one.
        { new: true },
        (err, show) => {
            // Handle any possible database errors
            if (err) return res.status(500).send(err);
            return res.send(show);
        }
    )
});

router.delete("/:id", checkAuth, checkAdmin, (req, res) => {

    let showId = (req.params.id);
    Movie.findByIdAndRemove(showId, (err, showObj) => {
        //handle any potential errors:
        if (err) return res.status(500).send(err);
        //create a simple object to send back with a message and the id of the document that was removed
        const response = {
            message: "Show successfully deleted",
            objDeleted: showObj
        };
        return res.status(200).send(response);
    });
});

//add new show
//with all the validation checks needed
router.post("/", (req, res) => {

    if (!checkIfShowValid(req.body)) {
        return res.sendStatus(400);
    }

    let show = new Show(req.body);

    /*
        before we enter a show we will check if the theater is available
        this is a complex query. 
    */

    startDateTime = show.dateTime;
    console.log('start date');
    console.log(startDateTime);
    let now = moment.utc();
    console.log('now');
    console.log(now);

    if (moment(startDateTime).isBefore(now)) {
        return res.status(400).json({ message: 'You can only choose a future date!' });
    } else {
        console.log('ok! this is a future shows')
    }

    // first we need the movie end time of the show. 
    // we calculate it with feild from the Movie collection -> "durationInMin"

    Movie.findById(show._MovieId).then(movieDetails => {

        //calculate the movie end time     
        let movieEndTime = moment.utc(startDateTime).add(movieDetails.durationInMin, 'minutes');

        // in order to make the query faster, we will first fillter the shows to relevent dates
        // +1 and -1 dates are our range

        let startRange = moment.utc(startDateTime).subtract(1, 'days');
        let endRange = moment.utc(startDateTime).add(1, 'days');

        Show.aggregate([

            /*
            first stage: fiilter according to Theater
            and according to relevant date range.
            this will make our query faster.
            */

            {
                "$match": {
                    "_TheaterId": show._TheaterId,
                    "dateTime": { $gte: new Date(startRange), $lte: new Date(endRange) },
                }
            },

            /*
            next stage:
            add the movie collection.
            we need it because we need to calculate the end time of the movie. (the movie of the other shows)  
            */

            {
                $lookup:
                    {
                        from: 'movies',
                        localField: '_MovieId',
                        foreignField: '_id',
                        as: 'movieInfo'
                    }
            },
            {
                $unwind: "$movieInfo"
            },

            /*
            next stage:
            keep shows only if: 
            (if the newShow 'start time' is in a range of another show)
            or
            (if the newShow 'end time' is in a range of another show)
            */

            {
                "$match": {
                    $or: [{
                        "dateTime": { $lte: new Date(startDateTime) },
                        "$expr":
                            { $gte: [{ $add: ["$dateTime", { $multiply: ["$movieInfo.durationInMin", 60000] }] }, new Date(startDateTime)] }
                    },
                    {
                        "dateTime": { $gte: new Date(startDateTime), $lte: new Date(movieEndTime) },
                    }
                    ]
                }
            }
        ]).then((suspectedShow) => {

            if (suspectedShow.length > 0) {
                //theater is already taken
                return res.status(400).json({ message: 'Thaeter is already taken at that time!', suspected: suspectedShow })
            } else {
                //theater is free. show is valid!

                show.save().then(newShow => {
                    console.log("Show saved successfully");
                    console.log(newShow);

                    res.json({ new: newShow, suspected: suspectedShow });
                })
            }
        })
    })
        .catch(err => {
            console.log('catch error');
            console.log(err);
            res.status(400);
        });



});


// Search autocomplete

router.get("/search/:term", (req, res) => {
    var regex = new RegExp(req.params["term"], 'i');
    Movie.find({ title: regex }, {}).then(movies => {
        res.json(movies);
        console.log(regex);
    }, err => {
        console.log(err);
    });
});

function checkIfShowValid(obj) {
    if ((!obj) || (!obj._MovieId) || (!obj.dateTime) || (!obj._TheaterId)) {
        return false;
    }
    return true;
}

module.exports = router;
