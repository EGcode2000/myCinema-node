const mongoose = require('mongoose');

theaterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    rows: {
        type: Number,
        required: true,
    },
    columns: {
        type: Number,
        required: true,
    },
});

module.exports = mongoose.model("Theater", theaterSchema);
