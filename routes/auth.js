const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User') // Modelo de usuário
require('dotenv').config()

// Rota de cadastro
router.post('/cadastrar', async (req, res) => {
    const { nome, email, telefone, cpf, senha, confirmarSenha } = req.body;

    // Validações simples
    if (!nome || !email || !telefone || !cpf || !senha || !confirmarSenha) {
        return res.status(400).send('Por favor, preencha todos os campos.');
    }

    if (senha !== confirmarSenha) {
        return res.status(400).send('As senhas não coincidem.');
    }

    try {
        // Verifica se o usuário já existe
        const usuarioExistente = await User.findOne({ email: email });
        if (usuarioExistente) {
            return res.status(400).send('Usuário já cadastrado.');
        }

        // Cria um novo usuário
        user = new User({
            nome,
            email,
            telefone,
            cpf,
            senha // A senha será criptografada antes de salvar
        });

        // Criptografa a senha
        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(senha, salt);

        // Salva o usuário no banco de dados
        await user.save();

        
        // Após o cadastro com sucesso, redirecionar para a página de login
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});



// @route   POST api/auth/login
// @desc    Login de usuário
// @access  Público
router.post('/auth/p-01login', async (req, res) => {
  const { email, senha } = req.body

  try {
    // Verificar se o usuário existe
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ msg: 'Credenciais inválidas' })
    }

    // Comparar senhas
    const isMatch = await bcrypt.compare(senha, user.senha)
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciais inválidas' })
    }

    // Gerar token JWT
    const payload = { userId: user.id }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

    res.json({ token })
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro no servidor')
  }
})


const nodemailer = require('nodemailer')
const crypto = require('crypto')

// @route   POST api/auth/forgot-senha
// @desc    Enviar link de recuperação de senha
// @access  Público
router.post('/forgot-senha', async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({ msg: 'Usuário não encontrado' })
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(20).toString('hex')
    user.resetPasswordToken = resetToken
    user.resetPasswordExpires = Date.now() + 3600000 // 1 hora
    await user.save()

    // Configurar nodemailer para envio de e-mails
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Recuperação de Senha',
      text: `Você solicitou a recuperação de senha. Acesse o link abaixo:\n\nhttp://${req.headers.host}/reset/${resetToken}`,
    }

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error(err)
        return res.status(500).send('Erro ao enviar e-mail')
      }
      res.json({ msg: 'E-mail de recuperação enviado' })
    })
  } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro no servidor')
  }
})

module.exports = router

