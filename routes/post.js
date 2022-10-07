const express = require("express");

const { postById, getPosts, getPostsByUser, createPost, likePost, unlikePost, isPoster, updatePost, deletePost, getPostPhoto, getPostById, commentPost, uncommentPost } = require("../controllers/post");
const { createPostValidator } = require("../validators");
const { requireSignIn } = require("../controllers/auth");
const { getUserById } = require("../controllers/user");

const router = express.Router();

router.get("/posts", getPosts);

router.put('/post/like', requireSignIn, likePost);
router.put('/post/unlike', requireSignIn, unlikePost);

router.put('/post/comment', requireSignIn, commentPost);
router.put('/post/uncomment', requireSignIn, uncommentPost);

router.get("/posts/by/:userId", getPostsByUser);
router.post("/post/new/:userId", requireSignIn, createPost, createPostValidator);
router.get("/post/:postId", getPostById);
router.put("/post/:postId", requireSignIn, isPoster, updatePost);
router.delete("/post/:postId", requireSignIn, isPoster, deletePost);

router.get("/post/photo/:postId", getPostPhoto);

router.param("userId", getUserById);
router.param("postId", postById);

module.exports = router;