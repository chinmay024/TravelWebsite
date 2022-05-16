const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1); /// to give server time to finish all the req that are still pending or handled and only after that server is killed
  // necessary to crash our applciation because entire node process is in unclean state
});

const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
); //getting databse string

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then((con) => {
    //console.log(con.connections);
    console.log(" DB connection succesful! ");
  }); //object to deal with deprication warnings. connect Returns the promise with connection object

//console.log(app.get('env'));// env variables are global variables to define the env in which a node app is running. This env variable is set by express

// console.log(process.env)// set up by node js

const port = process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

//dev and production env

process.on("unhandledRejection", (err) => {
  // unhandled promise rejection
  console.log("UNHANDLED REJECTION");
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1); /// to give server time to finish all the req that are still pending or handled and only after that server is killed
  });
});
// all errors or bugs that have occured in sync code and not handled are called uncaught exceptions
