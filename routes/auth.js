const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User') // Modelo de usuário
require('dotenv').config()

// Rota de cadastro
router.post('/cadastrar', async (req, res) => {
    const { nome, email, telefone, cpf, senha, confirmarSenha } = req.body

    // Validações simples
    if (!nome || !email || !telefone || !cpf || !senha || !confirmarSenha) {
        return res.status(400).send('Por favor, preencha todos os campos.')
    }

    if (senha !== confirmarSenha) {
        return res.status(400).send('As senhas não coincidem.')
    }

    try {
        // Verifica se o usuário já existe
        const usuarioExistente = await User.findOne({ email: email })
        if (usuarioExistente) {
            return res.status(400).send('Usuário já cadastrado.')
        }

        // Cria um novo usuário
        usuario = new User({
            nome,
            email,
            telefone,
            cpf,
            senha // A senha será criptografada antes de salvar
        })        
        // Salva o usuário no banco de dados
        await usuario.save()

        
        // Após o cadastro com sucesso, redirecionar para a página de login
        res.redirect('/login')
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro no servidor')
    }
})



// @route   POST api/auth/login
// @desc    Login de usuário
// @access  Público
router.post('/login', async (req, res) => {
  const { email, senha } = req.body
  
  try {
    // Verificar se o usuário existe
    const usuario = await User.findOne({ email })
    if (!usuario) {
      console.log('Usuário não encontrado.')
      return res.status(400).json({ msg: 'Credencial inválida' })
    }
    console.log('Usuário encontrado:', usuario)
        
    // Comparar senhas
    const isMatch = await bcrypt.compare(senha, usuario.senha)
    if (!isMatch) {
      console.log('Senhas não coincidem')
      return res.status(400).json({ msg: 'Credenciais inválidas' })
    }
    console.log('Senhas coincidem, autenticando...')    

    // Gerar token JWT
    const payload = { userId: usuario.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

    res.cookie('token', token, { httpOnly: true }) // Salvando o token como um cookie HTTP-Only (opcional)
    res.redirect('/usuario') // Redirecionando para a página do usuário após login bem-sucedido
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro no servidor')
  }
})


const nodemailer = require('nodemailer')
const crypto = require('crypto')
const { error } = require('console')

// @route   POST api/auth/forgot-senha
// @desc    Enviar link de recuperação de senha
// @access  Público
router.post('/recuperar', async (req, res) => {
  const { email } = req.body

  try {
    const usuario = await User.findOne({ email })
    if (!usuario) {
      return res.status(400).json({ msg: 'Usuário não encontrado' })
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(20).toString('hex')
    usuario.resetPasswordToken = resetToken
    usuario.resetPasswordExpires = Date.now() + 2592000000 
    await usuario.save()

    // Configurar nodemailer para envio de e-mails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }      
    })

    const mailOptions = {
      to: usuario.email,
      from: process.env.EMAIL_USER,
      subject: 'Recuperação de Senha',
      text: `Você solicitou a recuperação de senha. Acesse o link abaixo:\n\nhttp://${req.headers.host}/reset/${resetToken}`,
    }

    transporter.sendMail(mailOptions, (err) => { //
      if (err) {
        console.error('Erro ao enviar o e-mail:', err)
        return res.status(500).send('Erro ao enviar e-mail')
      }
      res.json({ msg: 'E-mail de recuperação enviado' })
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro no servidor')
  }
})



router.post('/novasenha', async (req, res) => {
  const { email, token, password, confirmarSenha } = req.body

  // Validação básica
  if (!password || !confirmarSenha) {
    console.log('Por favor, preencha todos os campos.')
    return res.status(400).json({ msg: 'Por favor, preencha todos os campos.' })
  }

  if (password !== confirmarSenha) {
    console.log('As senhas não coincidem.')
    return res.status(400).json({ msg: 'As senhas não coincidem.' })
  }

  try {
    const usuario = await User.findOne({
      email: email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    })

    if (!usuario) {
      console.log('Token inválido ou expirado.')
      return res.status(400).json({ msg: 'Token inválido ou expirado.' })
    }

    // Criptografar a nova senha
    const salt = await bcrypt.genSalt(10)
    usuario.senha = await bcrypt.hash(password, salt) // Substitui a senha antiga pela nova

    // Remover o token de recuperação
    usuario.resetPasswordToken = undefined
    usuario.resetPasswordExpires = undefined

    await usuario.save()
    
    res.redirect('/login')
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro no servidor')
  }
})


module.exports = router

