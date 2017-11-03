//middleware goes here!
var middlewareObj = {},
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment");

//note we could also define the object with all functions at the beginning instead of adding them to an empty obj array

middlewareObj.checkOwnership = function(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            //now if the campground is null it will be handled
            if(err || !foundCampground){
                console.log(err);
                req.flash("error", "Campground not found.");
                res.redirect("back");
            }else{
                //is the user is authorized to edit?
                //we need to use equals() as the first is an object (type string) and the second a string
                if(foundCampground.author.id.equals(req.user._id)){
                    next();
                } else {
                    req.flash("error", "Sorry, you do not have permission to do that.");
                    res.redirect("back");
                }
            }
        });
    }else{
        //add flash to say "You need to be logged in to do that!"
        res.redirect("back");
    }
};

middlewareObj.checkComOwner = function checkComOwner(req, res, next){
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                console.log(err);
                req.flash("error", "Campground not found.");
                res.redirect("back");
            }else{
                Comment.findById(req.params.comment_id, function(err, foundComment){
                    if(err || !foundComment){
                        req.flash("error", "Comment not found.");
                        res.redirect("back");
                    }else{
                        //is the user authorized to use this comment?
                        if(foundComment.author.id.equals(req.user._id)){
                            next();
                        } else {
                            req.flash("error", "Sorry, you do not have permission to do that.");
                            res.redirect("back");
                        }
                    }
                });
            }
            // }else{
            //     //even though users are unlikely to be able to access this we need to be as secure as we can 
            //     req.flash("error", "You need to be logged in to do that!");
            //     res.redirect("back");
            // }

    });
    
};
}

middlewareObj.isLoggedIn = function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    //must set the message before redirect like passing it in
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/login");
};


//we could also define the object in the following line AND add all the functions
module.exports = middlewareObj;