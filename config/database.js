const mongoose = require('mongoose')
require('dotenv').config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)  // Remover as opções descontinuadas
    console.log('MongoDB conectado...')
  } catch (err) {
    console.error('Erro ao conectar ao MongoDB', err)
    process.exit(1)  // Sair da aplicação com erro
  }
}

module.exports = connectDB
  