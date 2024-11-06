const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Agendamento = require('../models/Agendamento')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
require('dotenv').config()

// Rota para listar os horários disponíveis
router.get('/datas-disponiveis', async (req, res) => {
    try {
        const datasDisponiveis = await Agendamento.find({ disponivel: true }).select('dataAgendamento nomeMedico')
        res.status(200).json(datasDisponiveis)
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro no servidor')
    }
})

// Rota para marcar uma data específica
router.post('/marcar-agendamento', async (req, res) => {
    const { agendamentoId, userId, nomePaciente } = req.body

    try {
        const agendamento = await Agendamento.findById(agendamentoId)
        if (!agendamento) {
            return res.status(400).send('Agendamento não encontrado.')
        }

        if (!agendamento.disponivel) {
            return res.status(400).send('Agendamento não está disponível.')
        }

        agendamento.nomePaciente = nomePaciente
        agendamento.userId = userId
        agendamento.disponivel = false
        await agendamento.save()

        res.status(200).json({ msg: 'Agendamento realizado com sucesso.' })
    } catch (err) {
        console.error(err)
        res.status(500).send('Erro no servidor')
    }
})

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

// Rota de cadastro Animal
router.post('/cadastrarAnimal', async (req, res) => {
  const { nome, raca, rga, idade, peso } = req.body

  // Validações simples
  if (!nome || !raca || !rga || !idade || !peso) {
      return res.status(400).send('Por favor, preencha todos os campos.')
  }
  
  try {
      // Verifica se o animal já existe
      const animalExistente = await User.findOne({ rga: rga })
      if (animalExistente) {
          return res.status(400).send('Animal já cadastrado.')
      }

      // Cria um novo cadastro de animal
      pet = new animal({
          nome,
          raca,
          rga,
          idade,
          peso // A senha será criptografada antes de salvar
      })        
      // Salva o animal no banco de dados
      await pet.save()

      
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
router.post('/recuperar', async (req, res) => {
  const { email } = req.body

  try {
    const usuario = await User.findOne({ email })
    if (!usuario) {
      return res.status(400).json({ msg: 'Usuário não encontrado' })
    }

    // Gerar token de reset
    const token = crypto.randomBytes(20).toString('hex')
    usuario.resetPasswordToken = token
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
      text: `Você solicitou a recuperação de senha. Acesse o link abaixo:\n\nhttp://${req.headers.host}/reset/${token} \n\nou copie e cole este link, na barra de endereço do seu navegador.`,
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

router.post('/reset/:token', async (req, res) => {
  const {senha, confirmarSenha } = req.body
  const token = req.params.token
  
  try {    
    const usuario = await User.findOne({              
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    })
    
    if (!usuario) {      
      return res.status(400).json({ msg: 'Token inválido ou expirado.' })
    }
    // Validação básica
    if (!senha || !confirmarSenha) {      
      return res.status(400).json({ msg: 'Por favor, preencha todos os campos.' })      
    }

    if (senha !== confirmarSenha) {      
      return res.status(400).json({ msg: 'As senhas não coincidem.' })
    }
    
    usuario.senha = senha // 

    // Remover o token de recuperação
    usuario.resetPasswordToken = undefined
    usuario.resetPasswordExpires = undefined

    // Salvar o usuário com a nova senha
    await usuario.save()
    
    res.status(200).json({ msg: 'Senha alterada com sucesso.' });
    } catch (err) {
    console.error(err.message)
    res.status(500).send('Erro no servidor')
  }
})


 




module.exports = router

