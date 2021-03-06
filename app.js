//for multiple declarations we can merge all into one statement separated by commas
var express                 = require("express"),
    app                     = express(), 
    bodyParser              = require("body-parser"),
    mongoose                = require("mongoose"),
    Campground              = require("./models/campground.js"),
    Comment                 = require("./models/comment.js"),
    User                    = require("./models/user.js"),
    seed                    = require("./seeds.js"),
    passport                = require("passport"),
    LocalStrategy           = require("passport-local"),
    methodOverride          = require("method-override"),
    flash                   = require("connect-flash"),
    passportLocalMongoose   = require("passport-local-mongoose");

var campgroundRoutes    = require("./routes/campgrounds"),
    commentRoutes       = require("./routes/comments"),
    authRoutes          = require("./routes/auth");
    
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
mongoose.Promise = global.Promise;

//dev DB
//set our default, in the case that the DBURL is somehow not set we set the DB to fall back on
const databaseUri = process.env.DATABASEURL || "mongodb://localhost/yelp_camp_final";
mongoose.connect(databaseUri, { useMongoClient: true })
    .then(() => console.log("DB connected!"))
     .catch(err => console.log(`Database connection error: ${err.message}`));

app.use(flash());

app.locals.moment = require("moment");
//passport config
//session
app.use(require("express-session")({
    secret: process.env.PASS_SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); 
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//pass (user obj) to all routes & DRY's up our code, middleware so needs to be passed with next()
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    //creates an array of errors/successes/any message name that we can access in all routes
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(methodOverride("_method"));


//Require routes
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
app.use(authRoutes);

app.use(express.static(__dirname + "/public"));
app.set("view engine", "ejs"); 


app.listen(process.env.PORT, process.env.IP, function(){
  console.log("Server has started");  
});















