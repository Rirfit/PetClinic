const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User') // Modelo de usuário
const nodemailer = require('nodemailer')
const Agendamento = require('../models/Agendamentos') // Ajuste o caminho conforme necessário
const crypto = require('crypto')
const Animal = require('../models/Animal') // Importação correta do modelo de Animal
require('dotenv').config()

// Rota de cadastro de usuário
router.post('/cadastrar', async (req, res) => {
    const { nome, email, telefone, cpf, senha, confirmarSenha } = req.body

    if (!nome || !email || !telefone || !cpf || !senha || !confirmarSenha) {
        return res.status(400).send('Por favor, preencha todos os campos.')
    }

    if (senha !== confirmarSenha) {
        return res.status(400).send('As senhas não coincidem.')
    }

    try {
        const usuarioExistente = await User.findOne({ email })
        if (usuarioExistente) {
            return res.status(400).send('Usuário já cadastrado.')
        }

        const novoUsuario = new User({
            nome,
            email,
            telefone,
            cpf,
            senha // Será criptografada antes de salvar
        })

        await novoUsuario.save()
        res.redirect('/login')
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro no servidor')
    }
})

// Rota de cadastro de Animal
router.post('/cadastrarAnimal', async (req, res) => {
    const { nome, raca, rga, idade, peso } = req.body

    if (!nome || !raca || !rga || !idade || !peso) {
        return res.status(400).send('Por favor, preencha todos os campos.')
    }

    try {
        const animalExistente = await Animal.findOne({ rga })
        if (animalExistente) {
            return res.status(400).send('Animal já cadastrado.')
        }

        const novoAnimal = new Animal({
            nome,
            raca,
            rga,
            idade,
            peso
        })

        await novoAnimal.save()
        res.redirect('/login')
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro no servidor')
    }
})

// Rota de login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body

    try {
        const usuario = await User.findOne({ email })
        if (!usuario) {
            return res.status(400).json({ msg: 'Credencial inválida' })
        }

        const isMatch = await bcrypt.compare(senha, usuario.senha)
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciais inválidas' })
        }

        const payload = { userId: usuario.id }
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })

        res.cookie('token', token, { httpOnly: true })
        res.redirect('/usuario')
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Erro no servidor')
    }
})

// Rota para recuperação de senha
router.post('/recuperar', async (req, res) => {
    const { email } = req.body

    try {
        const usuario = await User.findOne({ email })
        if (!usuario) {
            return res.status(400).json({ msg: 'Usuário não encontrado' })
        }

        const token = crypto.randomBytes(20).toString('hex')
        usuario.resetPasswordToken = token
        usuario.resetPasswordExpires = Date.now() + 2592000000
        await usuario.save()

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        const mailOptions = {
            to: usuario.email,
            from: process.env.EMAIL_USER,
            subject: 'Recuperação de Senha',
            text: `Você solicitou a recuperação de senha. Acesse o link abaixo:\n\nhttp://${req.headers.host}/reset/${token}`
        }

        transporter.sendMail(mailOptions, (err) => {
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

// Rota de redefinição de senha
router.post('/reset/:token', async (req, res) => {
    const { senha, confirmarSenha } = req.body

    try {
        const usuario = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        })

        if (!usuario) {
            return res.status(400).json({ msg: 'Token inválido ou expirado.' })
        }

        if (senha !== confirmarSenha) {
            return res.status(400).json({ msg: 'As senhas não coincidem.' })
        }

        usuario.senha = senha
        usuario.resetPasswordToken = undefined
        usuario.resetPasswordExpires = undefined

        await usuario.save()
        res.status(200).json({ msg: 'Senha alterada com sucesso.' })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Erro no servidor')
    }
})

// Rota para listar agendamentos
router.get('/agendamentos', async (req, res) => {
    try {
        const agendamentos = await Agendamento.find()
        res.render('agendamentos', { agendamentos })
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro no servidor')
    }
})

module.exports = router
