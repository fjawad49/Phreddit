// LinkFlair Document Schema
const mongoose = require('mongoose');
const { Schema } = mongoose;

const linkFlairSchema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 30
  }
});

linkFlairSchema.virtual('url').get(function () {
  return `linkFlairs/${this._id}`;
});

//export
module.exports = mongoose.model('LinkFlair', linkFlairSchema);
