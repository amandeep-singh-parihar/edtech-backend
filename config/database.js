const mongoose = require("mongoose");
require("dotenv").config();

exports.dbConnect = () => {
  mongoose
    .connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("DB connection Succesfull");
    })
    .catch((err) => {
      console.error(err);
      console.log("DB connection Failed!");
      process.exit(1);
    });
};
