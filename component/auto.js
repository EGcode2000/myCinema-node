const Show = require('../models/show.js');
const Movie = require('../models/movie.js');
const Theater = require('../models/theater.js');
const Order = require('../models/order.js');
const moment = require('moment');

module.exports = function () {

    //this function will delete all shows and odrers stored in our DB
    // and will generate new ones. 
    // because we are the ones who are inserting the data there is no validation
    // this function takes in cosidoration that movies number =< theaters number

    console.log('working!!!!');

    Order.deleteMany({}).then(() => {
        Show.deleteMany({}).then(() => {
            //res.json({'msg':'delete all'});            
        });
    }, err => {
        console.log(err);
    });

    let dateRange = [];
    let hours = ['12:00', '15:00', '16:00', '22:00'];

    for (i = 0; i < 8; i++) {
        dateRange.push(moment().add(i, 'd').format('YYYY-MM-DD'));
    }

    console.log(dateRange);



    // date objects are being saved in the DB in UTC timezone. we need to change it back to local time.
    // we can do it using 'aggregation expressions':
    // see - https://docs.mongodb.com/manual/reference/operator/query/expr/index.html
    // see - https://docs.mongodb.com/manual/reference/operator/aggregation/setIsSubset/


    Movie.find({ isDisplaying: true })
        .then(movies => {
            //console.log(movies);
            Theater.find().then(theaters => {
                //console.log(theaters);
                /*let respond = {
                    movies: movies, 
                    theaters: theaters
                }
                let newshows = [];*/
                movies.forEach((movieEl, movieI) => {
                    {
                        dateRange.forEach((element, index) => {

                            hours.forEach((H, indexH) => {

                                console.log('index ' + index + ' indexH ' + indexH);
                                console.log(movies[movieI].title + " " + theaters[index]._id + " " + new Date(element + ' ' + H));
                                let newShow = {
                                    _MovieId: movies[movieI]._id,
                                    _TheaterId: theaters[movieI]._id,
                                    dateTime: new Date(element + ' ' + H),
                                }
                                let show = new Show(newShow);
                                show.save().then(newShow => {
                                    console.log("Show saved successfully");
                                    console.log(movies[movieI].title + " " + theaters[movieI]._id + " " + new Date(element + ' ' + H));
                                    console.log(newShow);
                                    /*// temp code for adding orders as well//todo: continuo
                                    let newOrder = {
                                        _ShowId: newShow._id,
                                        _UserId: '??',
                                        numberOfTickets: 2,
                                        ticketsPositions: [[0, movieI], [0, movieI + 1]],
                                    }
                                    let order = new Order(newOrder);
                                    order.save().then(orderNew => {
                                        console.log("order saved successfully");
                                        console.log(orderNew);
                                        let orderedSeats = {};
                                        orderNew.ticketsPositions.forEach(element => {
                                            orderedSeats["showTakenSeats." + element[0] + "-" + element[1]] = orderNew._id;
                                        });
                                        console.log(orderedSeats);
                                        Show.findByIdAndUpdate(newShow._ShowId, { '$set': orderedSeats }).then(updatedShow => {
                                            //if i deleting the promise. i sould add .exec() to the end
                                            console.log(updatedShow);
                                            console.log('added the ordered seats to the showTakenSeats in the show document');
                                        });
                                    });*/
                                });
                                //console.log(newShow);
                                //newshows.push(newShow);
                            })

                        })
                    }
                })
                //res.json(newshows)

            });
        }, err => {
            console.log(err);
        });
}