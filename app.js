const express = require('express')
const path = require("path")
const connectDB = require('./config/database')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const cookieParser = require('cookie-parser')
const User = require('./models/User')
require('dotenv').config()

const app = express()

// Conectar ao MongoDB
connectDB()


// Middleware para lidar com dados do formulário
app.use(express.urlencoded({ extended: true }))
app.use(express.json())// Para tratar JSON no corpo das 
app.use(cookieParser())

// Servindo arquivos estáticos (CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, 'public'))) // Corrigido o uso do path.join
app.use(express.static(path.join(__dirname, 'views')))  // Se você quiser servir os arquivos estáticos da pasta views

// Configurar o mecanismo de template EJS
app.set('view engine', 'ejs')

// Definir o diretório de views (opcional, se for diferente de 'views')
app.set('views', path.join(__dirname, 'views'))

// Rotas para renderizar as páginas EJS
app.get('/cadastrar', (req, res) => {
    res.render('p-00cadastrar') // Renderizando o EJS sem extensão
})

app.get('/login', (req, res) => {
    res.render('p-01login') // Certifique-se de que este arquivo existe em "views"
})

app.get('/recuperar', (req, res) => {
    res.render('p-002recuperar')
})

app.get('/', (req, res) => {
    res.render('index') // Assumindo que você tem um index.ejs na pasta views
})

app.get('/usuario', (req, res) => {
    res.render('p-03User')
})

app.get('/novasenha', async (req, res) => {
    const { email, token } = req.query

    const user = await User.findOne({
        email,
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
    })

    if (!user) {
        return res.status(400).json({ msg: 'Token inválido ou expirado.' })
    }

    // Renderizar a página de nova senha com os parâmetros corretos
    res.render('p-06novasenha', { email, token })
})

app.get('/reset/:token', async (req, res) => {
    try {
        // Verifique se o token é válido e se não expirou
        const usuario = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        })

        if (!usuario) {
            return res.status(400).json({ msg: 'Token inválido ou expirado' })
        }

        // Renderizar a página de nova senha, passando o email e o token para o formulário
        res.render('p-06novasenha', { email: usuario.email, token: req.params.token })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Erro no servidor')
    }
})

app.post('/novasenha', async (req, res) => {
    const { email, token, password, confirmarSenha } = req.body
  
    // Validação básica
    if (!password || !confirmarSenha) {
      console.log('Por favor, preencha todos os campos.')
    }
  
    if (password !== confirmarSenha) {
      console.log('As senhas não coincidem.')
    }
  
    try {
      // Buscar o usuário pelo token e garantir que o token ainda é válido
      const usuario = await User.findOne({
        email: email,
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      })
  
      if (!usuario) {
        return res.status(400).json({ msg: 'Token inválido ou expirado.' })      
      }
      console.log('Token inválido ou expirado.')
  
      // Criptografar a nova senha
      const salt = await bcrypt.genSalt(10)
      usuario.senha = await bcrypt.hash(password, salt) // Substitui a senha antiga pela nova
  
      // Remover o token de recuperação
      usuario.resetPasswordToken = undefined
      usuario.resetPasswordExpires = undefined
  
      // Salvar o usuário com a nova senha
      await usuario.save()
  
      res.redirect('/login') // Redireciona o usuário para a página de login
    } catch (err) {
      console.error(err.message)
      res.status(500).send('Erro no servidor')
    }
})


// Definindo a rota de autenticação

app.use('/auth', authRoutes)
app.use('/user', userRoutes)  // Usando as rotas do usuário
app.use('/api/auth', authRoutes) // 
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Algo deu errado!')
})
// Porta do servidor
const PORT = process.env.PORT || 5500
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
