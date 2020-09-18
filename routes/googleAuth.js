const express = require('express');
const app = express();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');
const cookieSession = require('cookie-session');
//const keys = require('../config/keys');

const router = express.Router();

router.use(cookieSession({
    //maxAge: 24 * 60 * 60 * 1000, // One day in milliseconds
    maxAge: 1000,
    keys: [process.env.cookie_key]
}));

router.use(passport.initialize()); // Used to initialize passport
router.use(passport.session()); // Used to persist login sessions

passport.use(new GoogleStrategy({
        clientID: process.env.client_id,
        //clientID: keys.google.client_id,
        clientSecret: process.env.client_secret,
        //clientSecret: keys.google.client_secret,
        callbackURL: 'https://mysterious-atoll-21625.herokuapp.com/auth/google/redirect'
        //callbackURL: 'http://localhost:8080/auth/google/redirect'
    },
    (accessToken, refreshToken, profile, done) => {
        done(null, profile); // passes the profile data to serializeUser
    }
));

// Used to stuff a piece of information into a cookie
passport.serializeUser((user, done) => {
    done(null, user);
});

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
    done(null, user);
});

// passport.authenticate middleware is used here to authenticate the request
router.get('/auth/google', passport.authenticate('google', {
    scope: ['profile'] // Used to specify the required data
}));

// The middleware receives the data from Google and runs the function on Strategy config
router.get('/auth/google/redirect', passport.authenticate('google'), (req, res) => {
    res.sendFile('/public/reqtask.html', {root: __dirname + '/../'});
});

module.exports = router;