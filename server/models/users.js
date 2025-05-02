// User Document Schema
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    displayName: {
        type: String, 
        required: true, 
        unique: true
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    dateJoined: { 
        type: Date, 
        default: Date.now 
    },
    reputation: { //regular users start at 100
        type: Number, 
        default: 100
    },
    role:{
        type: String, 
        enum: ['user', 'admin'], 
        default: "user"}
});

module.exports = mongoose.model('User', UserSchema);