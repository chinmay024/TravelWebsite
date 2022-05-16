const express = require('express');
const viewsController = require('../Controllers/viewsController');
// const authController = require('../Controllers/authController');
const router = express.Router();

// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Park Camper',
//     user: 'Chinu', //locals in pug file
//   }); //render the template with base
// }); //for rendering pages in browser

// router.use(authController.isLoggedIn);

router.get('/', viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);

module.exports = router;
