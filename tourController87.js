// const fs = require('fs');
// const Tour = require('./../models/tourModel');

// // const tours = JSON.parse(
// //   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) //arrray of js objects
// // );

// exports.checkID = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   if (req.params.id * 1 >= tours.length) {
//     return res
//       .status(404)
//       .json({ messagestatus: 'fail', message: 'Invalid id' });
//   }
//   next();
// };

// exports.checkbody = (req, res, next) => {
//   if (!(req.body.name && req.body.price)){
//     return res.status(400).json({
//       status: 'failed',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

// exports.getAllTours = (req, res) => {
//   console.log(req.requestTime);

//   res.status(200).json({
//     status: 'success',
//     requestAt: req.requestTime,
//     // results: tours.length,
//     // data: {
//     //   tours: tours,
//     // },
//   });
// };

// exports.getTour = (req, res) => {
//   console.log(req.params);

//   // const tour = tours.find((el) => el.id === req.params.id);

//   // res.status(200).json({
//   //   status: 'success',
//   //   data: {
//   //     tour: tour,
//   //   },
//   // });
// };

// exports.createTour = (req, res) => {
//   // console.log(req.body);

//   const newId = tours[tours.length - 1].id + 1;
//   const newTour = Object.assign({ id: newId }, req.body);

//   tours.push(newTour);

//   fs.writeFile(
//     `${__dirname}/dev-data/data/tours-simple.json`,
//     JSON.stringify(tours),
//     (err) => {
//       res.status(201).json({
//         status: 'success',
//         data: {
//           tour: newTour,
//         },
//       });
//     }
//   );
// };

// exports.updateTour = (req, res) => {
//   res.status(200).json({
//     status: 'success',
//     data: { tour: '<Updated tour here..' },
//   });
// };

// exports.deleteTour = (req, res) => {
//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// };
