const cron = require("node-cron");
const express = require('express');
const fs = require("fs");
const app = express();
const mongoose = require('mongoose');
const http = require('http');
let cache = require('./middleware/chaching.js');
let checkAuth = require('./middleware/chaching.js');
let autoShows = require('./component/auto.js');

//for openode.io deploy
//process.env.PORT -> this variable is defined in package.json
var port = process.env.PORT;

const multer = require('multer');
const path = require('path');

app.use(express.static(path.join(__dirname, 'angular')));
app.use(express.static(path.join(__dirname, 'public')));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/files');
    },
    filename: function (req, file, cb) {

        let pos = file.originalname.lastIndexOf('.');
        let name = file.originalname.substring(0, pos);
        let extension = file.originalname.substring(pos + 1);
        let newFilename = file.fieldname + '-' + name + "-" + Date.now() + "." + extension;
        cb(null, newFilename);
    }
});

const upload = multer({
    storage
}).any();

// schedule tasks to be run on the server
// on every suterday at 02:30 am israel time    
cron.schedule("30 2 * * 5", function () {
    // delete all shows and orders and generete new ones
    autoShows();
}, {
    scheduled: true,
    timezone: "Asia/Jerusalem"
});



const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//mongodb atlas url
const url = "mongodb+srv://god:Xacdw2z2H8OGR9D9@mycinema-a1olt.mongodb.net/moviesdb?retryWrites=true";

//for local host url
//const url = "mongodb://localhost:27017/moviesdb";


mongoose.connect(url);
/*
mongoose.connect(url, { useNewUrlParser: true });
*/
let db = mongoose.connection;
db.once('open', () => {
    console.log("Connected to db");
});



// allow CORS
//for us to be able to work with angular local envierment 
app.use(function (req, res, next) {
    //res.header("Access-Control-Allow-Origin", "http://mycinema.us.openode.io");
    res.header("Access-Control-Allow-Origin", "http://localhost:4200");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Credentials", true);
    next();
});


app.post('/upload', (req, res) => {
    console.log('uploading...');
    upload(req, res, function (err) {
        if (err) {
            return res.status(500).send(err);
        }
        console.log(req.files);
        console.log('file uploaded');
        console.log(req.files[0].filename);
        res.send(req.files[0].filename);
    });
});

//Routs
const moviesRouter = require('./routes/movies.js');
app.use('/api/movies', moviesRouter);

const ordersRouter = require('./routes/orders.js');
app.use('/api/orders', ordersRouter);

const showsRouter = require('./routes/shows.js');
app.use('/api/shows', showsRouter);

const theatersRouter = require('./routes/theaters.js');
app.use('/api/theaters', theatersRouter);

const usersRouter = require('./routes/users.js');
app.use('/api/users', usersRouter);

const authenticationRouter = require('./routes/authentication.js');
app.use('/auth', authenticationRouter);

const genresRouter = require('./routes/genres.js');
app.use('/api/genres', genresRouter);

//ANGULAR
app.use('/', (req, res, next) => {
    res.sendFile("index.html", { root: path.join(__dirname, 'angular') })
});
app.use('*', (req, res, next) => {
    res.redirect('/');
});


app.listen(port || 3000);
