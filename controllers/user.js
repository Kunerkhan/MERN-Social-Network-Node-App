const _ = require("lodash");
const formidable = require("formidable");
const fs = require("fs");
const User = require("../models/user");

exports.getUserById = (req, res, next, userId) => {
    User.findById(userId)
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec((err, user) => {
        if(err || !user)
        {
            return res.status(400).json({
                error: "User is not found"
            });
        }

        req.profile = user; //adds profile object in req with user info
        next();
    });
};

exports.hasAuthorization = (req, res, next) => {
    let sameUser = req.profile && req.auth && req.profile._id == req.auth._id;
    let adminUser = req.profile && req.auth && req.auth.role === 'admin';
    console.log(req.auth);
    const authorized = sameUser || adminUser;
    if(!authorized)
    {
        return res.status(403).json({
            error: "User is not authorized to perfom this action"
        })
    }

    next();
}

exports.getAllUsers = (req, res) => {
    User.find((error, users) => {
        if(error)
        {
            return res.status(400).json({ error });
        }

        res.json({ users });
    }).select("name email created updated role")
}

exports.getUser = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;

    return res.json(req.profile);
}

// exports.updateUser = (req, res) => {
//     let user = req.profile;
//     user = _.extend(user, req.body); // extend mutates source object(user)

//     user.updated = Date.now();
//     user.save((error) => {
//         if(error)
//         {
//             return res.status(400).json({ error: "You're not authorized to perform this action"});
//         }

//         user.hashed_password = undefined;
//         user.salt = undefined;

//         res.json({ user });
//     })
// }

exports.updateUser = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if(err) {
            return res.status(400).json({
                error: "Photo could not be uploaded"
            })
        }
        //save user

        let user = req.profile;
        user = _.extend(user, fields);
        user.updated = Date.now();

        if(files.photo) {
            user.photo.data = fs.readFileSync(files.photo.filepath);
            user.photo.contentType = files.photo.mimetype;
        }

        user.save((err) => {
            if(err) {
                return res.status(400).json({
                    error: err
                })
            }

            user.hashed_password = undefined;
            user.salt = undefined;
            res.json(user);
        })
    });
}

exports.deleteUser = (req, res) => {
    let user = req.profile;

    console.log(user);
    user.remove((error, user) => {
        if(error)
        {
            return res.status(400).json({ error });
        }

        res.json({ message: "User deleted successfully." });
    })
} 

exports.getUserPhoto = (req, res, next) => {
    if(req.profile.photo.data)
    {
        res.set({ "Content-type": req.profile.photo.contentType });
        return res.send(req.profile.photo.data);
    }
    next();
}

exports.addFollowing = (req, res, next) => {
    User.findByIdAndUpdate(
        req.body.userId,
        {
            $push: { "following": req.body.followId },
        }, 
        (err, result) => {
            if(err) {
                return res.status(400).json({ error: err });
            }
            else {
                console.log("here1");
            }

            next();
        }
    )
    .exec()
    .catch(err => {
        console.log("Workle")
    })
}

exports.addFollower = (req, res) => {
    User.findByIdAndUpdate(
        req.body.followId,
        {
            $push: { "followers": req.body.userId },
        }, 
        { new: true },
    )
    .populate('following', '_id name')
    .populate('followers', '_id name')
    .exec((err, result) => {
        if(err) {
            return res.status(400).json({
                message: "fooloddw",
                error: err
            })
        }
        else {
            console.log("here2");
        }

        result.hashed_password = undefined;
        result.salt = undefined;

        console.log("here2");
        res.json(result);
    })
    .exec()
    .catch(err => {
        console.log("Workle")
    })
}

exports.removeFollowing = (req, res, next) => {
    User.findByIdAndUpdate(
        { _id: req.body.userId }, 
        {
            $pull: { following: req.body.unfollowId }
        }, 
        (err, result) => {
            if(err) {
                return res.status(400).json({ error: err });
            }

            next();
        }
    )
}

exports.removeFollower = (req, res) => {
    User.findByIdAndUpdate(
        req.body.unfollowId, 
        {
            $pull: { followers: req.body.userId }
        }, 
        { new: true },
    )
    .populate('following', "_id name")
    .populate('followers', "_id name")
    .exec((err, result) => {
        if(err) {
            return res.status(400).json({
                error: err
            })
        }

        result.hashed_password = undefined;
        result.salt = undefined;

        res.json(result);
    })
}

exports.findPeople = (req, res) => {
    let following = req.profile.following;

    following.push(req.profile._id);
    User
        .find({ _id: { $nin: following }}, (err, users) => {
            if(err) {
                return res.status(400).json({
                    error: err
                })
            }
            
            res.json(users);
        })
        .select("name");
}
