var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    middleware  = require("../middleware"),
    geocoder    = require('geocoder');
    
require('dotenv').config();

//Index
router.get("/", function(req, res){
    if(req.query.search && req.query.search!=" "){
        //first we need to make user request usable and storeit. note g=global i=ignore case
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        //we are only doing a simple filter for names
        Campground.find({name:regex}, function(err, searchedCampgrounds){
            if(err){
                req.flash("error", "Something went wrong.");
            }else{
                //we don't want 0 campgrounds
                if(searchedCampgrounds.length < 1){
                    //sometimes the simplest way is the best way?
                    req.flash("error", "No campgrounds match that description.");
                    return res.redirect("/campgrounds");
                }
                res.render("campgrounds/index",{campgrounds: searchedCampgrounds, page: "campgrounds"});
            }
        }); 
    }else{
        Campground.find({}, function(err, allCampgrounds){
            if(err){
                req.flash("error", "Something went wrong.");
            }else{
                //we are passing in the user and campground objects
                res.render("campgrounds/index",{campgrounds: allCampgrounds, page: "campgrounds"});
            }
        });
    }
});

//Create 
router.post("/", middleware.isLoggedIn,  function(req, res){
    
        req.body.author = {
            id: req.user._id,
            username: req.user.username
        };
        
        if(!req.body.price){
            var price = "Contact for Price.";
        }else{
            var setPrice = "R" + req.body.price + "/night";
        }
        
        // gmaps creates obj with all nb data
        geocoder.geocode(req.body.address, function (err, data) {
            if(data && data.results && data.results.length) {
                var lat = data.results[0].geometry.location.lat;
                var lng = data.results[0].geometry.location.lng;
                var location = data.results[0].formatted_address;
                 var newSite = {name: req.body.name, image: req.body.image, photographer: req.body.photographer, address: req.body.address, description: req.body.description,  location: location, lat: lat, lng: lng, author: req.body.author, formPrice: req.body.price, price: price, setPrice: setPrice};
            }else{
                req.flash("error", "Sorry that address is invalid.");
                res.redirect("back");
                var newSite = {name: req.body.name, image: req.body.image, photographer: req.body.photographer, address: req.body.address, description: req.body.description,  author: req.body.author, price: price, setPrice: setPrice}; 
            }
            
            Campground.create(newSite, function(err, campground){
                if(err){
                    req.flash("error", "Sorry something went wrong.");
                    res.redirect("back");
                }else{
                    req.flash("success", "Campground added.");
                    res.redirect("/campgrounds/" + campground.id);  
                }
            });
        });
});

//New 
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

//Show
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found.");
            //might want to add a return statement fr safety but then our else statement would never be run
            res.redirect("back");
        }else{
            res.render("campgrounds/show", {campground: foundCampground, currentUser: req.user});  
        }
    });
});

//Edit
router.get("/:id/edit", middleware.checkOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if(err){
            res.redirect("back");
        }else{
            res.render("campgrounds/edit", {campground: foundCampground});
        }
    });
});

//Update
router.put("/:id", middleware.checkOwnership, function(req, res){
    var formPrice = req.body.price;
    if(!req.body.price){
        var price = "Contact for Price.";
    }else{
        var setPrice = "R" + req.body.price + "/night";
    }
    geocoder.geocode(req.body.address, function (err, data) {
        if (data && data.results && data.results.length) {
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            var location = data.results[0].formatted_address;
            var newData = {name: req.body.name, image: req.body.image, photographer: req.body.photographer, address: req.body.address, description: req.body.description, price: price, formPrice: formPrice, setPrice: setPrice, location: location, lat: lat, lng: lng};
        } else{
            var newData = {name: req.body.name, image: req.body.image, photographer: req.body.photographer, address: req.body.address, description: req.body.description, price: price, formPrice: formPrice, setPrice: setPrice};
        }
        Campground.findByIdAndUpdate(req.params.id, newData, function(err, updatedCampground){
            if(err){
                console.log(err);
                res.redirect("/campgrounds");
            }else{
                res.redirect("/campgrounds/" + req.params.id);
            }
        });
    });
});

//Destroy
router.delete("/:id", middleware.checkOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err, foundCampground){
        if(err){
            console.log(err);
            res.redirect("/campgrounds");
        }else{
            res.redirect("/campgrounds");
        }
    });
});

//to escape all special characters
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

