const express = require('express');
const bodyParser = require('body-parser');
const { isNull } = require('util');
const mongoose = require("mongoose");
const userSchema = require("../modules/user");
const bcrypt = require('bcrypt');
const https = require("https");
const nodemailer = require("nodemailer");
//const keys = require("../config/keys");
const async = require('async');
const crypto = require("crypto");
const router = express.Router();

router.use(bodyParser.urlencoded({extended: true}))

//Create model
const user = mongoose.model("user", userSchema);
const saltRounds = 10;

//------------------------------------------------------------------REGISTRATION PAGE
router.get('/reg', (req, res) => {
    res.sendFile('/public/iCrowdTask.html', {root: __dirname + '/../'});
});

router.post('/reg', (req, res) => {
    //Save each input from user
    const inputCountry = req.body.inputCountry;
    const inputName = req.body.inputName;
    const inputLname = req.body.inputLname;
    const inputEmail = req.body.inputEmail;
    const inputPassword = req.body.inputPassword;
    const inputConfirmPassword = req.body.inputConfirmPassword;
    const inputAddress = req.body.inputAddress;
    const inputCity = req.body.inputCity;
    const inputRegion = req.body.inputRegion;
    const inputZip = req.body.inputZip;
    const inputPhone = req.body.inputPhone;

    //Create model
    const newUser = new user({
        _Id: new mongoose.mongo.ObjectId(),
        country: inputCountry,
        firstName: inputName,
        lastName: inputLname,
        email: inputEmail,
        password: inputPassword,
        confirmedPassword: inputConfirmPassword,
        address: inputAddress,
        city: inputCity,
        region: inputRegion,
        zip: inputZip,
        phone: inputPhone
    });

    //Save user to database unless an error occured (May be caused by validators)
    newUser.save().then(item => {
        res.sendFile('/public/reqlogin.html', {root: __dirname + '/../'});
    }).catch(err => {
        console.log(err);
        res.status(400).send("Unable to save user to database." + err);
    });
    //Find all users in iCrowdTaskDB and list them in console
    user.find({}, (err, user) => {
        if (err) { console.log(err); }
        user.forEach(function(i) {
            console.log(i.firstName + " is currently signed up.");
        });
    });

    //Add user to MailChimp
    const apiKey = "5361fa8643eff9a6da475b174889c8a5-us17";
    const url = "https://us17.api.mailchimp.com/3.0/lists/d880776236";
    const options = {
        method: "POST",
        auth: "nic:5361fa8643eff9a6da475b174889c8a5-us17"
    }
    //Create object with user details
    const data = {
        members: [{
            email_address: inputEmail,
            status: "subscribed",
            merge_fields: {
                FNAME: inputName,
                LNAME: inputLname
            }
        }]
    }
    //Convert object to json string
    var jsonData = JSON.stringify(data);
    //Request to subscribe user to mailchimp
    const request = https.request(url, options, (response) => {
        response.on("data", (data) => {
            console.log(JSON.parse(data));
        });
    });

    request.write(jsonData);
    request.end();
});

//-----------------------------------------------------------------------LOGIN PAGE
router.get('/', (req, res) => {
    res.sendFile('/public/reqlogin.html', {root: __dirname + '/../'});
});

router.post('/', (req, res) => {
    const loginEmail = req.body.loginEmail;
    const loginPassword = req.body.loginPassword;
    //Look for entered email in the database
    user.findOne({ email: loginEmail }, function (err, user) {
        if (err) { console.log(err); }
        //If user is null, email didn't exist in database.
        if(!isNull(user)) {
            //Compare entered password with stored hash if user exists
            bcrypt.compare(loginPassword, user.password, function(err, isMatch) {
                if (err) { console.log(err); }
                //Allow user to proceed if all credentials are correct
                if (isMatch) {
                    res.sendFile('/public/reqtask.html', {root: __dirname + '/../'});
                //Tell user entered password is incorrect
                } else {
                    res.send("Password entered was incorrect.");
                }
            });
        //Tell use their entered email doesn't exist in database
        } else {
            res.send(loginEmail + " does not exist in our database.");
        }
        
    });
});

//-----------------------------------------------------------------------FORGOT PASSWORD ROUTE
router.get('/forgot', (req,res) => {
    //Send file that asks user for their email
    res.sendFile('/public/forgotPassword.html', {root: __dirname + '/../'});
});

router.post('/requestReset', (req, res) => {
    //Waterfall to ensure a result is received before continuing to next function
    async.waterfall([
        //Create a token using crypto
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        //Find user using entered email and assign token and token expiry date to their account
        function(token, done) {
            //Find user with user email
            user.findOne({ email: req.body.userEmail }, function(err, account) {
                if (err) {
                    req.send(err);
                }
                if (!account) {
                    res.send('Account does not exist');
                }
                //Assign token to user
                account.token = token;
                //Make token expire an hour from creation
                account.tokenExpiry = Date.now() + 3600000; // 1 hour
                //Save user
                account.save(function(err) {
                    done(err, token, account);
                });
            });
        },
        //Create transport and send mail with specific password reset link.
        function(token, account, done) {
            //Create nodemailer transport using gmail smtp
            var transport = nodemailer.createTransport({
                host: 'smtp.googlemail.com',
                port: 465,
                auth: {
                //user: keys.gmail.email,
                user: process.env.GMAIL_EMAIL,
                //pass: keys.gmail.pass
                pass: process.env.GMAIL_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            //Send password reset email
            transport.sendMail({
                //Gmail account used by the server
                //from: keys.gmail.email,
                from: process.env.GMAIL_EMAIL,
                //Target email account
                to: account.email, 
                subject: "iCrowdTask Password Reset", 
                //Reset password link with token
                text: "Reset password link: " + 'http://' + req.headers.host + '/reset/' + token + '\n\n' //Content
            }, (error, info) => {
                if (error) { return res.send(error);}
                console.log('Message %s sent: %s', info.messageId, info.response);
                done(error, 'done');
            });
        }
      ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
      });
})

router.get('/reset/:token', function(req, res) {
    //Find user that matches token in URI and make sure the link was clicked within an hour
    user.findOne({ token: req.params.token , tokenExpiry: { $gt: Date.now() } }, function(err, account) {
        if (err) {
            res.send(err);
        }
        //Send file that allows user to enter new password
        res.sendFile('/public/resetPassword.html', {root: __dirname + '/../'});
        
    });
});

router.post('/reset/:token', function(req, res) {
    //Find user that matches token in URI and make sure the password was entered before token expiry
    user.findOne({ token: req.params.token , tokenExpiry: { $gt: Date.now() } }, function(err, account) {
        //Check if passwords match
        if (req.body.password == req.body.confirmPassword) {
            //Assign passwords (plain text now - will be hashed by pre-save function created in user schema)
            account.password = req.body.password;
            account.confirmedPassword = req.body.password;
            //Save passwords to be hashed and stored
            account.save();
            //Redirect to login page
            res.redirect("/");
        } else {
            res.send("Passwords don't match");
        }
    });
});

//TO_DO
//SET EMAIL AND PASSWORD TO HEROKU ENV VAR
module.exports = router;