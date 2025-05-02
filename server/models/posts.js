// Post Document Schema
const mongoose = require('mongoose');
const { Schema } = mongoose;

const postSchema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true
  },
  linkFlairID: {
    type: Schema.Types.ObjectId,
    ref: "LinkFlair"
  },
  postedBy: {
    type: Schema.Types.ObjectId,
    ref:"User",
    required: true
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  commentIDs: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }],
  communityId:{
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  views: {
    type: Number,
    default: 0
  },
  voteCount: {
    type: Number,
    default: 0
  },
  upvoters:[{
    type: mongoose.Schema.Types.ObjectId,
    ref : 'User'
  }],
  downvoters: [{
    type:mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

postSchema.virtual('url').get(function () {
  return `posts/${this._id}`;
});

module.exports = mongoose.model('Post', postSchema);
