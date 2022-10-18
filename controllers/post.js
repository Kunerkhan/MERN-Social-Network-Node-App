const formidable = require("formidable");
const fs = require("fs");
const _ = require("lodash");
const Post = require("../models/post");


exports.postById = (req, res, next, id) => {
    Post.findById(id)
        .populate("postedBy", "_id name")
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name role")
        .select("_id title body created photo likes comments")
        .exec((err, post) => {
            if (err || !post) {
                return res.status(400).json({
                    error: err
                });
            }
            req.post = post;
            next();
        });
};


exports.getPosts = async (req, res) => {
    // get current page from req.query or use default value of 1
    const currentPage = req.query.page || 1;
    // return 3 posts per page
    const perPage = 6;
    let totalItems;
  
    const posts = await Post.find()
      // countDocuments() gives you total count of posts
      .countDocuments({})
      .then((count) => {
        totalItems = count;
        return Post.find()
          .skip((currentPage - 1) * perPage)
          .populate("postedBy", "_id name")
          .populate("comments", "text created")
          .populate("comments.postedBy", "_id name")
          .select("_id title body created likes photo comments")
          .limit(perPage)
          .sort({ created: -1 });
      })
      .then((posts) => {
        res.status(200).json(posts);
      })
      .catch((err) => console.log(err));
  };

exports.createPost = (req, res, next) => {
    let form = new formidable.IncomingForm({ keepExtensions: true });

    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: "Image could not be uploaded"
            });
        }

        let post = new Post(fields);
        req.profile.hashed_password = undefined;
        req.profile.salt = undefined;
        post.postedBy = req.profile;

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.filepath);
            post.photo.contentType = files.photo.mimetype;
        }

        post.save((err, result) => {
            if (err) {
                console.log(err)
                return res.status(400).json({
                    error: err
                });
            }
            res.json(result);
        });
    });
};

exports.getPostsByUser = (req, res) => {
    Post.find({ postedBy: req.profile._id })
        .populate("postedBy", "_id name")
        .populate("comments", "text created")
        .populate("comments.postedBy", "_id name")
        .select("_id title body created photo likes")
        .sort("_created")
        .exec((err, posts) => {
            if (err) {
                return res.status(400).json({
                    error: err
                });
            }
            res.json({ posts });
        })
};

exports.isPoster = (req, res, next) => {
    let sameUser = req.post && req.auth && req.post.postedBy._id == req.auth._id;
    let adminUser = req.post && req.auth && req.auth.role == "admin";
    let isPoster = sameUser && adminUser;

    if (!isPoster) {
        return res.status(403).json({
            error: "User is not authorized"
        });
    }
    next();
};

exports.updatePost = (req, res, next) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: "Photo could not be uploaded"
            })
        }

        //save post
        let post = req.post;
        post = _.extend(post, fields);
        post.updated = Date.now();

        if (files.photo) {
            post.photo.data = fs.readFileSync(files.photo.filepath);
            post.photo.contentType = files.photo.mimetype;
        }

        post.save((err) => {
            if (err) {
                return res.status(400).json({
                    error: err
                })
            }
            res.json(post);
        })
    });
}

exports.deletePost = (req, res) => {
    let post = req.post;

    post.remove((err, post) => {
        if (err) {
            return res.status(400).json({
                error: err
            })
        }
        res.json({
            message: "Post deleted successfully"
        })
    });
};

exports.getPostPhoto = (req, res, next) => {
    res.set("Content-Type", req.post.photo.contentType);

    return res.send(req.post.photo.data);
}

exports.getPostById = (req, res) => {
    return res.json(req.post);
}

exports.likePost = (req, res) => {
    Post.findOneAndUpdate(
        req.body.postId,
        { $push: { likes: req.body.userId } },
        { new: true }
    )
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err,
                })
            } else {
                res.json(result)
            }
        })
}

exports.unlikePost = (req, res) => {
    Post.findOneAndUpdate(
        req.body.postId,
        { $pull: { likes: req.body.userId } },
        { new: true }
    )
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err,
                })
            } else {
                res.json(result)
            }
        })
}

exports.commentPost = (req, res) => {
    let comment = req.body.comment;
    comment.postedBy = req.body.userId;

    Post.findByIdAndUpdate(
        req.body.postId,
        { $push: { comments: comment } },
        { new: true }
    )
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name")
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err,
                });
            } else {
                res.json(result);
            }
        });
}

exports.uncommentPost = (req, res) => {
    let comment = req.body.comment;

    Post.findByIdAndUpdate(
        req.body.postId,
        { $pull: { comments: { _id: comment._id } } },
        { new: true }
    )
        .populate("comments.postedBy", "_id name")
        .populate("postedBy", "_id name")
        .exec((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: err,
                });
            } else {
                res.json(result);
            }
        });
}