var mongoose    = require("mongoose"),
    Campground  = require("./models/campground"),
    Comment     = require("./models/comment");

//write a function to clear the db
function seed(){
    //remove all campgrounds
    Campground.remove({}, function(err){
        if(err){
            console.log(err + " error with removing campgrounds");
        }else{
            console.log("campgrounds cleared");
        }
    });
}

module.exports = seed;
