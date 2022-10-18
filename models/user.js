
const mongoose = require("mongoose");
const uuidv1 = require("uuidv1");
const crypto = require("crypto");
const { ObjectId } = mongoose.Schema;
const Post = require("./post");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    email: {
        type: String,
        trim: true,
        unique: true,
        required: true,
    },
    photo: {
        data: Buffer,
        contentType: String
    },
    about: {
        type: String,
        trim: true,
    },
    following: [{
        type: ObjectId,
        ref: "User"
    }],
    followers: [{
        type: ObjectId,
        ref: "User"
    }],
    hashed_password: {
        type: String,
        required: true,
    },
    salt: String,
    created: {
        type: Date,
        default: Date.now,
    },
    updated: Date,
    resetPasswordLink: {
        data: String,
        default: ""
    },
    role: {
        type: String,
        default: "subscriber",
    }
});

// virtual field
userSchema.virtual("password")
.set(function(password) {
    //create temporary var _password
    this._password = password;
    //generate timestamp
    this.salt = uuidv1();
    // encryptPassword()
    this.hashed_password = this.encryptPasssword(password);
})
.get(function() {
    return this._password;
});

// methods of user schema
userSchema.methods = {
    authenticate: function(plainText) {
        return this.encryptPasssword(plainText) === this.hashed_password;
    },
    encryptPasssword: function(password) {
        if(!password) return "";
        try {
            return crypto.createHmac('sha1', this.salt)
            .update(password)
            .digest('hex');
        }
        catch(err) {
            return "";
        }
    } 
}

// pre middleware
userSchema.pre("remove", function (next) {
    Post.remove({ postedBy: this._id }).exec();
    next();
  });
  // remove comments if user is deleted
  // https://www.udemy.com/instructor/communication/qa/12584122/detail/
  userSchema.pre("remove", async function (next) {
    await Post.remove({ postedBy: this._id }).exec();
    await Post.updateMany(
      {},
      { $pull: { comments: { postedBy: this._id } } },
      { new: true, multi: true }
    ).exec();
    next();
  });

module.exports = mongoose.model("User", userSchema);
