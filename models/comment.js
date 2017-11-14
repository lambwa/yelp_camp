var mongoose = require("mongoose");

//we want to associate user with comment, we can store the bits we need as an obj in the comment itself leaving out the extra bits
var commentSchema = new mongoose.Schema({
    text: String,
    
    author: {
        id: { 
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
    username: String,
    createdAt: { type: Date, Default: Date.now },
    }
});

module.exports = mongoose.model("Comment", commentSchema);