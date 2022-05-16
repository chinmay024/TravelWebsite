// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');

const catchAsync = require(`${__dirname}//../utils/catchAsync`);
const AppError = require(`./../utils/appError`);
const sendEmail = require(`./../utils/email`);

const signToken = (id) =>
  jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  }); // same as { id:id }
// console.log();

//cookie is a small piece of text that a server can send to its client Then when the client receives a cookie, it will automatically store it and then automatically send it back along with all future requests to the same server.All right, so again, a browser automatically stores a cookie that it receives and sends it back in all future requests to that server where it came from.

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id); //payload-> obj for all data, secret, option(json)
  //HSA 256 encryption-> 32 char long pw
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ), //browser or client will delete the cookie after it has expired
    //  secure: true, // cookie will be sent in only encrypted connection. So basically https
    httpOnly: true, // cookie cant be acessed or modified in any way by browser
  };
  if (process.env.NOD_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  //REMOVE PW FROM OUTPUTS
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    }, //envelope
  }); //json object
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
  }); // pass in object with data for user to be created
  createSendToken(newUser, 201, res);
}); //async for DB operations

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // 1) Check if email and pw exists
  if (!email || !password)
    return next(new AppError('Please send email and password!', 400));

  // 2) Check if user exist and pw is correctly
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); //unauthorized
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if its there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  console.log(token);
  if (!token) {
    return next(
      new AppError(`You are not logged in! Please login to get access.`, 401)
    );
  }
  // 2) Verification Token //Token payload has not been changed by malicious party or has not expired
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // it is an async func and has 3rd arg -> callback func which gets called as soon as token is verified // returns decoded value of payload and callback
  // promisify for async await using lib util which has built-in func

  // 3) Check if user still exists
  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new AppError(
        'The user belonging to this token does no longer exist.',
        401
      )
    );
  }
  console.log(decoded);
  // 4) Check if user changed password after the token was issused
  console.log(freshUser.changedPasswordAfter(decoded.iat));
  if (!freshUser.changedPasswordAfter(decoded.iat)) {
    console.log('Hi');
    return next(
      new AppError('User recently changed password. Please login again !!', 401)
    );
  } //iat-> issued a
  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = freshUser;
  next();
});

//only for rendered pages, no error

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  let token;
  if (req.cookies.jwt) {
    // 1) Verification Token //Token payload has not been changed by malicious party or has not expired
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET); // it is an async func and has 3rd arg -> callback func which gets called as soon as token is verified // returns decoded value of payload and callback
    // promisify for async await using lib util which has built-in func

    // 2) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
      return next();
    }

    // 3) Check if user changed password after the token was issused
    console.log(freshUser.changedPasswordAfter(decoded.iat));
    if (!freshUser.changedPasswordAfter(decoded.iat)) {
      return next();
    } //iat-> issued a
    // GRANT ACCESS TO PROTECTED ROUTE

    //THERE IS A LOGGED IN USER
    res.locals.user = freshUser; //now inside the pug templates there will be a variable called user
    return next();
  }
  next();
});

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    //roles ['admin], 'lead-guide]
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  }; //rest parameter syntex new in ES6, create array of all the specified arguments

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2) Generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH req with your new password and passwordConfirm to: ${resetURL}.\n If you didnt forget your password ignore the email!`;
  try {
    await sendEmail({
      email: user.email,
      // resetURL: resetURL,
      message,
      subject: 'Your password reset token (valid for 10 min)',
    });
    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(new AppError(err.message, 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // 2) If token hasnt expired, and there is user set the new pw
  if (!user) {
    return next(new AppError(`The token is invalid or has expired.`, 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  // 3) update changedPasswordAt property for the user
  // 4) Log the user in, send JWT

  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if posted current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password)))
    return next(new AppError(`Your current password is wrong.`), 401);
  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
