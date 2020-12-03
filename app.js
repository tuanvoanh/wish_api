// Config env
require("dotenv").config();

const path = require("path");
const bodyParser = require("body-parser");
const express = require("express");
const logger = require("morgan");
const mongoClient = require("mongoose");
const { MONGODB_URL, PORT } = require("./configs");
const adminHelper = require("./helpers/createAdmin")
require("./jobs")
// setup connect mongodb by mongoose
mongoClient
  .connect(MONGODB_URL, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async() => {
    console.log("✅ Connected database from mongodb.");
    await adminHelper.createAdmin()
  })
  .catch((error) =>
    console.error(`❌ Connect database is failed with error which is ${error}`)
  );
const app = express();

const userRoute = require("./routes/user");
const shopRoute = require("./routes/shop");

// Middlewares
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Routes
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "*");
  next();
});

app.use("/users", userRoute);
app.use("/shops", shopRoute);

// Routes
app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Server is OK!",
  });
});

// Catch 404 Errors and forward them to error handler
app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// Error handler function
app.use((err, req, res, next) => {
  const error = app.get("env") === "development" ? err : {};
  const status = err.status || 500;
  const errorObject = {}
  errorObject.message = error.message
  errorObject.code = error.code
  // response to client
  return res.status(status).json({
    error: errorObject
  });
});

// Start the server
const port = PORT || 3000;
app.listen(port, () => console.log(`Server is listening on port ${port}`));
