// User Document Schema
const mongoose = require('mongoose');
const communities = require('./communities');
const comments = require('./comments');
const { Schema } = mongoose;

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
        default: "user"
    },
    communities: [{
        type: Schema.Types.ObjectId,
        ref: "Community",
        default: [],
        required: true
    }],
    posts: [{
        type: Schema.Types.ObjectId,
        ref: "Post",
        default: [],
        required: true
    }],
    comments: [{
        type: Schema.Types.ObjectId,
        ref: "Comment",
        default: [],
        required: true
    }]
});

module.exports = mongoose.model('User', UserSchema);