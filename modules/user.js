const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const validator = require("email-validator");

const saltRounds = 10;
/**User schema contains: 
 * Auto generated ID
 * Country
 * First name
 * Last name
 * Email
 * Password
 * Password Confirmation
 * Address
 * City
 * State, Province or Region
 * Zip
 * Phone Number
 */
const userSchema = new mongoose.Schema({    
    _Id: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true]
    },
    country: {
        type: String,
        required: [true, 'Country required'],
    },
    firstName: {
        type: String,
        required: [true, 'First name required'],
        minlength: 2,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: [true, 'Last name required'],
        minlength: 2,
        maxlength: 50
    },
    email: {
        type: String,
        validate: validator.validate,
        required: [true, 'Email name required'],
        unique: true
    },
    password: {
        type: String,
        minlength: 8,
        required: [true, 'Password required']
    },
    confirmedPassword: {
        type: String,
        minlength: 8,
        required: [true, 'Password confirmation required']
    },
    address: {
        type: String,
        minlength: 5,
        maxlength: 100,
        required: [true, 'Address required']
    },
    city: {
        type: String,
        maxlength: 100,
        required: [true, 'City required']
    },
    region: {
        type: String,
        maxlength: 100,
        required: [true, 'State, Province or Region required']
    },
    zip: String,
    phone: {
        type: String,
        validate: {
            validator: function (v) {
                //check if phone number matches australian phone numbers
                return /^0[0-8]\d{8}$/g.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    token: String,
    tokenExpiry: Date
});
//Validate that both password and confirmed password match
userSchema.path('confirmedPassword').validate(function (v) {
    if (this.password != this.confirmedPassword) {
        this.invalidate('password must match');
    }
});

//Generate salt and hash the password and confirmed password.
userSchema.pre('save', function(next) {
    var user = this;
    //Check if password was modified or new
    if (!user.isModified('password')) return next();

    bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) return next(err);

        bcrypt.hash(user.password, salt, function(err, hash) {
            if (err) return next(err);

            user.password = hash;
            user.confirmedPassword = hash;
            next();
        });
    });
});


module.exports = userSchema;