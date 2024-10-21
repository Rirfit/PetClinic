const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')


const UserSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    telefone: {
        type: String,
        required: true,
    },
    cpf: {
        type: String,
        required: true,
        unique: true,
    },
    senha: {
        type: String,
        required: true,
    },
    data: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: {
        type: String,
        default: null,
    },
    resetPasswordExpires: {
        type: Date,
        default: null,
    },
});


// Antes de salvar, criptografar a senha
UserSchema.pre('save', async function (next) {
  if (!this.isModified('senha')) {
    return next()
  }

  const salt = await bcrypt.genSalt(10)
  this.senha = await bcrypt.hash(this.senha, salt)
  next()
})

const User = mongoose.model('User', UserSchema)
module.exports = User
