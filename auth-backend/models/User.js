const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Optional for Google OAuth users
  googleId: { type: String, unique: true, sparse: true }, // For Google OAuth
  name: { type: String }, // For Google OAuth users
  picture: { type: String }, // Profile picture from Google
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' }
});

module.exports = mongoose.model('User', UserSchema); 