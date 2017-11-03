var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    passport    = require("passport"),
    User        = require("../models/user");

router.get("/", function(req, res){
    res.render("landing");
});

//Register - form
router.get("/register", function(req, res){
    if(req.user) {
        req.flash("error", "You are already logged in!");
        return res.redirect("back");
    }else{
    //pass in the error from the method declaration
        res.render("register");
    }
});

//Register - POST
router.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            // passport js gives us the error, we don't need to write one for each type of error and can print as is
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//Login - form
router.get("/login", function(req, res){
    if(req.user) {
        req.flash("error", "You are already logged in!");
        return res.redirect("back");
    }else{
    //we pass in the mes object, grab the correct message from the function isLoggedIn
    res.render("login");
    }
});

//Login - POST
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), function(req, res){
});


//Logout
router.get("/logout", function(req, res){
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/login");
});

module.exports = router;