var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    name: String,
    price: {type: String, default: null},
    formPrice: String,
    setPrice: String,
    image: String,
    photographer: String,
    description: String,
    address: String,
    location: String,
    lat: Number,
    lng: Number,
    author: {
        id:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    //creating an array of comment object reference
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
        ]
});

module.exports = mongoose.model("Campground", campgroundSchema);