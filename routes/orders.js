const express = require('express');
const router = express.Router();
const Order = require('../models/order.js');
const Show = require('../models/show.js');
let checkAuth = require('../middleware/check-auth.js');


router.get("/", (req, res) => {

    //sorting from latest to oldest
    Order.find().sort({ createdOn: -1 }).populate({
        //for deep populate syntax, see:https://stackoverflow.com/questions/46001213/mongoose-multiple-deep-populates
        path: 'showInfo',
        populate: [
            { path: 'theaterInfo' },
            { path: 'movieInfo' },
        ]
    }).populate('userInfo', 'username email firstName lastName').then(orders => {
        res.json(orders);
    }, err => {
        console.log(err);
    });
});


router.get("/:id", (req, res) => {

    let orderId = (req.params.id);

    Order.findById(orderId).populate({
        //for deep populate syntax, see:https://stackoverflow.com/questions/46001213/mongoose-multiple-deep-populates
        path: 'showInfo',
        populate: [
            { path: 'theaterInfo' },
            { path: 'movieInfo' },
        ]
    }).populate('userInfo', 'username email firstName lastName').then(Order => {
        res.json(Order);
    }, err => {
        console.log(err);
    });
});

router.post("/", checkAuth, (req, res) => {

    if (!checkIfOrderValid(req.body)) {
        return res.sendStatus(400);
    }
    let order = new Order(req.body);

    // add user id to order data
    // we get the user data from the 'check-auth' middelware
    order._UserId = req.userData._UserId;

    //first check if the seats are taken.
    // so we need to check the 'showTakenSeats' in the 'Show' document 
    Show.findById(req.body._ShowId)
        .then(show => {
            console.log(req.body);
            console.log(req.body.ticketsPositions);
            const isSeatsValid = req.body.ticketsPositions.every(element => {
                console.log('checking: ' + element[0] + "-" + element[1]);
                return !show.showTakenSeats.hasOwnProperty(element[0] + "-" + element[1]);
            });
            if (isSeatsValid) {

                // Yes!. the seats are not taken!, make the order.

                console.log('seats are valid');
                return order.save().then(newOrder => {
                    console.log("Order saved successfully");

                    //for inserting new seats in an existing feild see:
                    //1- https://stackoverflow.com/questions/10290621/how-do-i-partially-update-an-object-in-mongodb-so-the-new-object-will-overlay
                    //2 -https://docs.mongodb.com/manual/reference/operator/update/set/#set-fields-in-embedded-documents

                    let orderedSeats = {};
                    newOrder.ticketsPositions.forEach(element => {
                        orderedSeats["showTakenSeats." + element[0] + "-" + element[1]] = newOrder._id;
                    });
                    console.log(orderedSeats);
                    Show.findByIdAndUpdate(req.body._ShowId, { '$set': orderedSeats }).then(updatedShow => {
                        //if i deleting the promise. i sould add .exec() to the end
                        console.log(updatedShow);
                        console.log('added the ordered seats to the showTakenSeats in the show document');
                    });
                    res.json(newOrder);
                });
            } else {
                // Nope, one of the seats is taken. send a message
                console.log('seat are already taken!');
                res.status(400).json({ 'message': 'Seats are already taken!' })
            }
        })
        .catch(err => {
            console.log('catch error');
            console.log(err);
            res.status(400);
        });
});

router.delete("/:id", (req, res) => {

    let orderId = (req.params.id);
    Order.findByIdAndRemove(orderId, (err, orderObj) => {
        //handle any potential errors:
        if (err) return res.status(500).send(err);
        //create a simple object to send back with a message and the id of the document that was removed
        if (!orderObj) {
            return res.status(500).send('cannot find this order');
        }
        console.log(orderObj);
        Show.findById(orderObj._ShowId)
            .then(show => {

                orderObj.ticketsPositions.forEach(element => {
                    delete show.showTakenSeats[element[0] + "-" + element[1]];
                });
                console.log(orderObj.ticketsPositions);

                //'markModified' is very important! without it changes in showTakenSeats will not be saved
                show.markModified('showTakenSeats');

                show.save(show).then(show2 => {
                    console.log('deleted seats');
                    console.log(show2);

                    const response = {
                        message: "Movie successfully deleted",
                        objDeleted: orderObj
                    };
                    console.log('sending response');
                    res.status(200).send(response);

                });

            });
    });
});

router.get("/search/:term", (req, res) => {
    var regex = new RegExp(req.params["term"], 'i');
    Order.find({ $or: [{ _id: regex }, { _ShowId: regex }, { _UserId: regex }] }, {}).then(orders => {
        res.json(orders);
        console.log(regex);
    }, err => {
        console.log(err);
    });
});

function checkIfOrderValid(obj) {
    if ((!obj) || (!obj.numberOfTickets) || (!obj.ticketsPositions || !Array.isArray(obj.ticketsPositions)) || (!obj._ShowId)) {
        return false;
    }
    return true;
}

module.exports = router;
