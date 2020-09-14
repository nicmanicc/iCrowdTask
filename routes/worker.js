const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userSchema = require("../modules/user");
const router = express.Router();

router.use(bodyParser.urlencoded({extended: true}));

const worker_model = mongoose.model("worker", userSchema);

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
    worker_model.update(
        {email: req.params.worker_email},
        {
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
        },
        {overwrite: true},
        (err) => {
            if (err) {
                res.send(err);
            } else {
                res.send("Update successful");
            }
        }
    )
    
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
    worker_model.update(
        {email: req.params.worker_email},
        {$set: 
            {
                address: req.body.inputAddress,
                phone: req.body.inputPhone,
                password: req.body.inputPassword,
                confirmedPassword: req.body.inputConfirmPassword
            }
        },
        (err) => {
            if (err) {
                res.send(err);
            } else {
                res.send("Update successful");
            }
        }
    )
});

module.exports = router;