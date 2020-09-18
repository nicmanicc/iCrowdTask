const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userSchema = require("../modules/user");
const bcrypt = require('bcrypt');
const router = express.Router();

router.use(bodyParser.urlencoded({extended: true}));

const worker_model = mongoose.model("user", userSchema);
const saltRounds = 10;

//Retrieve, add and remove workers at URI: /workers
router.route('/workers')
//Get all workers
.get((req, res) => {
    worker_model.find((err, workerList) => {
        if (err) { 
            res.send(err);
        } else {
            res.send(workerList);
        }
    })
})
//Create a new worker
.post((req, res) => {
    const worker = new worker_model({
        _Id: new mongoose.mongo.ObjectId(),
        country: req.body.inputCountry,
        firstName: req.body.inputName,
        lastName: req.body.inputLname,
        email: req.body.inputEmail,
        password: req.body.inputPassword,
        confirmedPassword: req.body.inputConfirmPassword,
        address: req.body.inputAddress,
        city: req.body.inputCity,
        region: req.body.inputRegion,
        zip: req.body.inputZip,
        phone: req.body.inputPhone
    });
    worker.save((err) => {
        if (err) {
            res.send(err);
        } else {
            res.send('Successfully saved worker');
        }
    });
})
//Delete all workers
.delete((req, res) => {
    worker_model.deleteMany((err) => {
        if (err) {
            res.send(err);
        } else {
            res.send('Successfully deleted all workers!');
        }
    })
});
//Retrieve, update and remove a specific worker at URI: /worlers/:id
router.route('/workers/:worker_email')
//Find specified worker
.get((req, res) => {
    worker_model.findOne({email: req.params.worker_email}, (err, foundWorker) => {
        if (err) {
            res.send(err);
        } else {
            res.send(foundWorker);
        }
    })
})
//Update specified worker
.put((req, res) => {
    if(req.body.inputPassword == req.body.inputConfirmPassword) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) {res.send(err)}
    
            bcrypt.hash(req.body.inputPassword, salt, function(err, hash) {
                if (err) {res.send(err)}
    
                worker_model.findOneAndUpdate(
                    {email: req.params.worker_email},
                    {
                        country: req.body.inputCountry,
                        firstName: req.body.inputName,
                        lastName: req.body.inputLname,
                        email: req.body.inputEmail,
                        password: hash,
                        confirmedPassword: hash,
                        address: req.body.inputAddress,
                        city: req.body.inputCity,
                        region: req.body.inputRegion,
                        zip: req.body.inputZip,
                        phone: req.body.inputPhone
                    },
                    {returnNewDocument: true},
                    (err, user) => {
                        if (err) {
                            res.send(err);
                        } else {
                            res.send(user);
                        }
                    }
                )
            });
        });
    } else {
        res.send("Passwords don't match");
    }
})
//Delete specified worker
.delete((req, res) => {
    worker_model.deleteOne(
        {email: req.params.worker_email},
        (err) => {
            if (err) {
                res.send(err);
            } else {
                res.send('Delete successful');
            }
        })
})
//Update workers address, mobile phone and password.
.patch((req, res) => {      
    if(req.body.inputPassword == req.body.inputConfirmPassword) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            if (err) {res.send(err)}
    
            bcrypt.hash(req.body.inputPassword, salt, function(err, hash) {
                if (err) {res.send(err)}

                worker_model.findOneAndUpdate(
                    {email: req.params.worker_email},
                    {$set: {
                        address: req.body.inputAddress,
                        phone: req.body.inputPhone,
                        password: hash,
                        confirmedPassword: hash
                        }
                    },
                    {returnNewDocument: false},
                    (err, user) => {
                        if (err) {
                            res.send(err);
                        } else {
                            res.send(user);
                        }
                    }
                )
            });
        });
    } else {
        res.send("Passwords don't match");
    }
});

module.exports = router;