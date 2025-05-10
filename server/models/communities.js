// Community Document Schema
const mongoose = require('mongoose');
const { Schema } = mongoose;

const communitySchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  postIDs: [{
    type: Schema.Types.ObjectId,
    ref: "Post"
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
});

//communities.url returns "communities/<_id>"
communitySchema.virtual('url').get(function () {
  return `communities/${this._id}`;
});

//communities.memberCount returns members.length
communitySchema.virtual('memberCount').get(function () {
  return this.members.length;
});

module.exports = mongoose.model('Community', communitySchema);
