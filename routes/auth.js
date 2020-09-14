const express = require('express');
const bodyParser = require('body-parser');
const { isNull } = require('util');
const mongoose = require("mongoose");
const userSchema = require("../modules/user");
const bcrypt = require('bcrypt');
const https = require("https");
const router = express.Router();

router.use(bodyParser.urlencoded({extended: true}))

//Create model
const user = mongoose.model("user", userSchema);

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

module.exports = router;