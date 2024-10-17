const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
require('dotenv').config()
// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')  // Pegando o token de cookie ou header

  if (!token) {
    return res.status(401).json({ msg: 'Sem autorização, token não encontrado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)  // Verificando o token com a chave secreta
    req.user = decoded.userId  // Decodificando o token para obter o userId
    next()  // Prosseguindo para a próxima função
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' })
  }
}

// Rota protegida: /usuario
router.get('/usuario', verifyToken, (req, res) => {
  res.render('p-03User')  // Enviando o arquivo HTML protegido
})

module.exports = router
