const mongoose = require('mongoose');

showSchema = mongoose.Schema({


    _MovieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
    _TheaterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater' },

    dateTime: {
        type: Date,
        required: true
    },

    /*theaterMap will contain all the orderd seats of this given show.
    the key will follown this sintax `seatRow-seatCol`, in order to enable efficent checking if a seat is teaken.
    the value will be the order id number
    */
    showTakenSeats: {
        type: Object,
        default: {}
    },
}, {
        //we need 'minimize: false' in order to initilze 'showTakenSeats' as an empty object.
        //otherwise moongose will prevent it.  
        minimize: false
    });

showSchema.virtual('movieInfo', {
    ref: 'Movie',
    localField: '_MovieId',
    foreignField: '_id'
})

showSchema.virtual('theaterInfo', {
    ref: 'Theater',
    localField: '_TheaterId',
    foreignField: '_id'
})

showSchema.set('toObject', { virtuals: true });
showSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Show", showSchema);