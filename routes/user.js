const express = require("express");

const { 
    getUserById, 
    getAllUsers, 
    getUser, 
    updateUser, 
    deleteUser, 
    getUserPhoto, 
    addFollowing, 
    addFollower,
    removeFollowing, 
    removeFollower,
    findPeople,  
    hasAuthorization,
} = require("../controllers/user");
const { requireSignIn } = require("../controllers/auth");

const router = express.Router();

router.put('/user/follow', requireSignIn, addFollowing, addFollower);
router.put('/user/unfollow', requireSignIn, removeFollowing, removeFollower);

router.get("/users", getAllUsers);
router.get("/user/:userId", requireSignIn, getUser);
router.put("/user/:userId", requireSignIn, hasAuthorization, updateUser);
router.delete("/user/:userId", requireSignIn, hasAuthorization, deleteUser);

router.get("/user/photo/:userId", getUserPhoto);

router.get("/user/findpeople/:userId", requireSignIn, findPeople);

// any route with userId param, will execute getUserById method
router.param("userId", getUserById);


module.exports = router;