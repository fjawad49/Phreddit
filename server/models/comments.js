// Comment Document Schema
const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500
  },
  commentedBy: {
    type: String,
    required: true
  },
  commentedDate: {
    type: Date,
    default: Date.now
  },
  commentIDs: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

commentSchema.virtual('url').get(function () {
  return `comments/${this._id}`;
});

module.exports = mongoose.model('Comment', commentSchema);

