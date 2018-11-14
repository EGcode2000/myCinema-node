const mongoose = require('mongoose');

orderSchema = mongoose.Schema({

    _ShowId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Show',
        required: true
    },
    _UserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    numberOfTickets: {
        type: Number,
        required: true
    },

    ticketsPositions: {
        type: Array,
        required: true
    },

    createdOn: {
        type: Date,
        default: Date.now,
    }
});

orderSchema.virtual('showInfo', {
    ref: 'Show',
    localField: '_ShowId',
    foreignField: '_id'
})

orderSchema.virtual('userInfo', {
    ref: 'User',
    localField: '_UserId',
    foreignField: '_id'
})

orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model("Order", orderSchema);