var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    Comment     = require("../models/comment"),
    middleware  = require("../middleware"),
    geocoder    = require("geocoder");

//Index
router.get("/", function(req, res){
    Campground.find({}, function(err, allCampgrounds){
        if(err){
            console.log(err);
        }else{
            //we are passing in the user and campground objects
            res.render("campgrounds/index", {campgrounds: allCampgrounds});
        }
    });
});

//Create 
router.post("/", middleware.isLoggedIn, function(req, res){
    //get data from form
    var name = req.body.name,
        image = req.body.image,
        photographer = req.body.photographer,
        description = req.body.description,
        address = req.body.address,
        formPrice = req.body.price,
        author = {
            id: req.user._id,
            username: req.user.username
        };
    if(!req.body.price){
        var price = "Contact for Price.";
    }else{
        var setPrice = "R" + req.body.price + "/night";
    }
    geocoder.geocode(req.body.address, function (err, data) {
        if(data && data.results && data.results.length) {
            var lat = data.results[0].geometry.location.lat;
            var lng = data.results[0].geometry.location.lng;
            var location = data.results[0].formatted_address;
        }else{
             req.flash("err", "Sorry that address is invalid");
            res.redirect("back");
        }
        //create & add new campground obj
        var newSite = {name: name, image: image, photographer: photographer, address: req.body.address, description: description,  location: location, lat: lat, lng: lng, author: author, price: price, formPrice: formPrice, setPrice: setPrice}; 
        Campground.create(newSite, function(err, newlyCreated){
            if(err){
                console.log(err);
            }else{
                req.flash("success", "Campground added.");
                res.redirect("/campgrounds");  
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
    if(!req.body.price){
        var price = "Contact for Price.";
    }else{
        var setPrice = "R" + req.body.price + "/night";
        var formPrice = req.body.price;
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

module.exports = router;

