const mongoose = require('mongoose');

genreSchema = mongoose.Schema({

    genre: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model("Genre", genreSchema);