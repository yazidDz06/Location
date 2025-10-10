const mongoose = require('mongoose')

const bcrypt = require('bcrypt')

const { Schema } = mongoose;

const userSchema = new Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
    numero: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^\d{10}$/.test(v);  // exactement 10 chiffres
      },
      message: props => `${props.value} n'est pas un numéro valide (10 chiffres attendus)`
    }
  },
  password: { type: String, required: true },
  dateNaissance: { type: String, required: true },
  role: { type: String, enum: ['admin', 'user'], default: 'user' }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);
