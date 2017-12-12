var express     = require("express"),
    router      = express.Router({mergeParams: true}),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
    async       = require("async"),
    nodemailer  = require("nodemailer"),
    //no need to i crypto, part of node
    crypto      = require("crypto");

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
        res.render("register", {page: 'register'});
    }
});

//Register - POST
router.post("/register", function(req, res){
    var newUser = new User({
        username:   req.body.username,
        firstName:  req.body.firstName,
        lastName:   req.body.lastName,
        avatar:     req.body.avatar,
        about:      req.body.about,
        email:      req.body.email,
    });
    if (req.body.adminCode === "flipflop1"){
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            // passport js gives us the error, we don't need to write one for each type of error and can print as is
            req.flash("error", err.message);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//USER PROFILES
router.get("/users/:id", function(req, res){
    User.findById(req.params.id, function(err, foundUser){
        if(err){
            req.flash("error", "The profile couldn't be reached right now, sorry!");
            res.redirect("back");
        }else{
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err, foundCampgrounds){
                if(err){
                    req.flash("error", "The profile couldn't be reached right now, sorry!");
                    res.redirect("back");
                }
               res.render("users/show", {user: foundUser, campgrounds: foundCampgrounds}); 
            });
        }
    });
});

//USER update routes

//Login - form
router.get("/login", function(req, res){
    if(req.user) {
        req.flash("error", "You are already logged in!");
        return res.redirect("back");
    }else{
    //we pass in the mes object, grab the correct message from the function isLoggedIn
    res.render("login", {page: 'login'});
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

//forgot form
router.get("/forgot", function(req, res){
    res.render("forgot");
});

//sending forgot form data, create email & link
router.post("/forgot", function(req, res, next){
    //use waterfall to pass in array of functions
    async.waterfall([
        //create token to be sent
        function(done){
            //gen cipher and buf it to a var
            crypto.randomBytes(20, function(err, buf) {
            //translate buf to hex string save as token
            var token = buf.toString("hex");
            done(err, token);
          });
        },
        //use email to find user
        function(token, done) {
            //check if user exists & find it
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user || err) {
              req.flash("error", "No account with that email address exists.");
              return res.redirect("/forgot");
            }
            //set token
            user.resetPasswordToken = token;
            //set expiration time to one hour from now
            user.resetPasswordExpires = Date.now() + 3600000;
            
            //save new temp obj with all the details we need
            user.save(function(err) {
            done(err, token, user);
            });
          });
        },
        //the magic of nodemailer
        function(token, user, done) {
            //ready email address 
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail", 
                auth: {
                  user: "lameez.wakefield@gmail.com",
                  pass: process.env.GMAILPW
                }
            });
        //we can control what the email contains
        var mailOptions = {
            //who to send it to
            to: user.email,
            //now we create the email with an address the user can respond to 
            //we add a link for the user to follow token is nb
            from: "lameez.wakefield@gmail.com",
            subject: "Password Reset",
            text: "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
              "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
              "http://" + req.headers.host + "/reset/" + token + "\n\n" +
              "If you did not request this, please ignore this email and your password will remain unchanged.\n"
        };
        //now we need to send the message using smtpT var and passing in the mailOp var
        smtpTransport.sendMail(mailOptions, function(err) {
            console.log("mail sent");
            req.flash("success", "An e-mail has been sent to " + user.email + " with further instructions.");
            done(err, "done");
        });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect("/forgot");
  });
});

//reset form 
router.get("/reset/:token", function(req, res){
    //find user using token, $gt retrieve doc only if the exp time is greater than now (ie only if valid)
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
        if(!user || err){
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", {token: req.params.token});
    });
});

//handle reset form logic
router.post("/reset/:token", function(req, res){
    async.waterfall([
        function(done){
            //first funct in waterfall figures out if pasword & confirm match, 
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user){
                if(!user || err){
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm){
                    //if match we overwrite user, setPassword is a mongo method
                    user.setPassword(req.body.password, function(err){
                        if(err){
                            req.flash("error", "Something went wrong.");
                            return res.redirect("back");
                        }else{
                            //we don't need the following anymore
                            user.resetPasswordToken = undefined;
                            user.resetPasswordExpires = undefined;
                            
                            user.save(function(err) {
                                if(err){
                                    req.flash("error", "Something went wrong.");
                                    return res.redirect("back");
                                }else{
                                    req.logIn(user, function(err){
                                        done(err, user);
                                    });
                                }
                            });
                        }
                    });
                }else{
                    req.flash("error", "Passwords do not match.");
                    //nb we need to exit out of the entire waterfall
                    return res.redirect("back");
                }
            });
        },
        //rewrite vars write email
        function(user, done){
            var smtpTransport = nodemailer.createTransport({
                service: "Gmail", 
                auth: {
                  user: "lameez.wakefield@gmail.com",
                  pass: process.env.GMAILPW
                }
            });
            var mailOptions = {
                to: user.email,
                from: "lameez.wakefield@gmail.com",
                subject: "Your password has been changed",
                text: 'Hello,\n\n' +
                "This is a confirmation that the password for your account " + user.email + " has just been changed.\n"
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash("success", "Your password has been changed.");
                done(err, "done");
            });
        }
    ], function(err){
        if(err){
            req.flash("error", "Something went wrong.");
            return res.redirect("back");
        }else{
            res.redirect("/campgrounds");
        }
    });
});

module.exports = router;









