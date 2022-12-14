const express = require("express");
const app = express();
const mongoose = require("mongoose");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const cookieParser = require('cookie-parser')
const dotenv = require("dotenv");
const fs = require("fs");
const cors = require("cors");
dotenv.config();

//db
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true }).then(() => { console.log("DB connected")});

mongoose.connection.on("error", err => {
    console.log(`DB connection error: ${err.message}`);
});

//bringing routes
const postRoutes = require("./routes/post");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");

//middleware
app.use(morgan("dev"));
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended : true }));
app.use(cookieParser());
app.use(expressValidator());
app.use(cors());

app.use("/", postRoutes);
app.use("/", authRoutes);
app.use("/", userRoutes);

//API DOCS
app.get("/", (req, res) => {
  fs.readFile("docs/apiDocs.json", (err, data) => {
    if(err) {
      res.status(400).json({
        error: err
      })
    }
    const docs = JSON.parse(data);
    res.json(docs);
  })
});



app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      res.status(401).json({ error: 'Unauthorized' });
    }
  });

const port = process.env.PORT || 4040;

app.listen(port, () => {
    console.log(`Express app is runnig on ${port} port`)
});

