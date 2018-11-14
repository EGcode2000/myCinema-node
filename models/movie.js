const mongoose = require('mongoose');

moviesSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    director: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        max: 1000,
    },
    youtubeTrailer: {
        type: String,
        required: true
    },
    durationInMin: {
        type: Number,
        required: true
    },
    isDisplaying: {
        type: Boolean,
        required: true
    },
    releaseYear: {
        type: Number,
        required: true
    },
    posterImagePath: {
        type: String,
        required: true
    },
    wideImagePath: {
        type: String,
        required: true
    },
    genreList: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
        required: true
    },
});


moviesSchema.virtual('genreInfo', {
    ref: 'Genre',
    localField: 'genreList',
    foreignField: '_id'
})


moviesSchema.set('toObject', { virtuals: true });
moviesSchema.set('toJSON', { virtuals: true });


module.exports = mongoose.model("Movie", moviesSchema);