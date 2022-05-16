const express = require('express');
const userController = require(`${__dirname}/../Controllers/userController.js`);
const router = express.Router();

const authController = require(`${__dirname}/../Controllers/authController.js`);

// special route for user-> authentication-> func relevant for user

router.post('/signup', authController.signup); // doesnt follow 100% rest philosophy like below routes where name of url has nothing to do with the action to be performed, these are basically functions for user.
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//PROTECT ALL ROUTES AFTER THIS MIDDLEWARE
router.use(authController.protect);

router.patch('/updateMyPassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(authController.restrictTo('admin'));
router //possibility of system adinistrator of updating and deleting or getting users based on their id
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
