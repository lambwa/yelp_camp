var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    middleware  = require("../middleware");
    //index.js is automatically require through express 

//Comments - New
router.get("/new", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
        }else{
            res.render("comments/new", {campground: foundCampground, currentUser: req.user});  
        }
    });
});

//Comments - Create
router.post("/", middleware.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }else{
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong.")
                    console.log(err);
                }else{
                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    // save comment
                    comment.save();
                    foundCampground.comments.push(comment);
                    foundCampground.save();
                    req.flash("success", "Comment added.");
                    //redirect to see comments
                    res.redirect("/campgrounds/" + req.params.id);
                    console.log(comment);
                }
            });
        }
    });
});

//edit
router.get("/:comment_id/edit", middleware.checkComOwner, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
       if(err || !foundCampground){
           req.flash("error", "Campground not found.");
           return res.redirect("back");
       } 
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            } else{
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
                
            }
        });
    });
});


//update
router.put("/:comment_id", middleware.checkComOwner, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
       if(err || !foundCampground){
           req.flash("error", "Campground not found.");
            res.redirect("back");
       }else{
        Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, foundComment){
            if(err || !foundComment || !foundCampground){
                req.flash("error", "Something went wrong");
                res.redirect("back");
            }else{
                res.redirect("/campgrounds/" + req.params.id);
                console.log(req.params.id);
            }
        });
       }
    });
});

router.delete("/:comment_id", middleware.checkComOwner, function(req, res){
    Comment.findByIdAndRemove(req.params.comment_id, function(err, foundComment){
        if(err){
            console.log(err);
            res.redirect("back");
        }else{
            req.flash("success", "Comment deleted.");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;