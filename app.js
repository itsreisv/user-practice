const express = require('express');
require('dotenv').config();
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const { body, validationResult } = require("express-validator");


const mongoDB = process.env.mongoDBPath
mongoose.connect(mongoDB);
const db = mongoose.connection;
db.on('error', console.error.bind(console, "mongo connection error"));

const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, required: true},
    password: { type: String, required: true},
    firstName: { type: String, required: true},
    lastName: { type: String, required: true},
    member: { type: Boolean}
  })
);

const UserMessage = mongoose.model(
  "Message",
  new Schema({
    creator: { type: String, required: true},
    title: { type: String, required: true},
    message: { type: String, required: true},
    time: { type: Date, required: true}
  })
)

const app = express();
app.set("views", __dirname + '/views');
app.set("view engine", "ejs");
app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await User.findOne({ username: username });
      if (!user) {
        return done(null, false, { message: "Incorrect username"})
      };
      const match = await bcrypt.compare(password, user.password)
      if (!match) {
        return done(null, false, { message: "Incorrect password"})
      }
      return done(null, user)
    } catch(err) {
      return done(err)
    }
  })
)

passport.serializeUser((user, done) => {
  done(null, user.id)
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch(err) {
    done(err)
  }
});

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
res.render("index")
});

app.get('/sign-up', (req, res) => {
  res.render('sign-up')
})

app.post('/sign-up', async (req, res, next) => {
  try {
    bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
      const user = new User({
        username: req.body.username,
        password: hashedPassword,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        member: false,
      })
      const result = await user.save();
    })
    res.redirect('/')
  } catch(err) {
    return next(err)
  }
})

app.listen(3000, () => console.log("app listening on port 3000"));