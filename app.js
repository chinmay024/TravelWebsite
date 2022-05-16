const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp'); //http parameter pollution
const cookieParser = require('cookie-parser');
const AppError = require('./utils/appError');

const globalErrorHandler = require(`${__dirname}/Controllers/errorController`);
const tourRouter = require(`${__dirname}/Routes/tourRoutes.js`);
const userRouter = require(`${__dirname}/Routes/userRoutes.js`);
const reviewRouter = require(`${__dirname}/Routes/reviewRoutes.js`);
const viewRouter = require(`${__dirname}/Routes/viewRoutes.js`);

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

//1) GLOABAL MIDDLEWARES

//Serving static files
app.use(express.static(path.join(__dirname, 'public'))); //parses data from body
app.use(cookieParser()); //parses data from cookie
//Set security HTTP Headers
app.use(helmet());

// Limit req from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many req from this IP, please try again in an hour',
});

app.use('/api', limiter);

//Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} //Body parser, reading data from body into req. body
app.use(express.json({ limit: '10kb' }));

//Data Sanitization against noSql query injection
app.use(mongoSanitize());
//Data Sanitization against XSS
app.use(xss());
//PREVETN PARAMETER POLLUTIONS
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'price',
      'difficulty',
    ],
  })
); //uses only last sort

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.cookie);
  next();
});

//3) routes

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all(`*`, (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server.`,
  // });

  // const err = new Error(`Can't find ${req.originalUrl} on this server.`);
  // err.status = 'fail';
  // err.statusCode = 404;
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404)); //whatever we pass into next is error
});

app.use(globalErrorHandler); // 4 arg -> error handling middleware

module.exports = app;
