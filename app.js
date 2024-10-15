const express = require('express')
const connectDB = require('./config/database')
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/user')
const cookieParser = require('cookie-parser')
require('dotenv').config()

const app = express()

// Conectar ao MongoDB
connectDB()


// Middleware para lidar com dados do formulário
app.use(express.urlencoded({ extended: true }))
app.use(express.json())// Para tratar JSON no corpo das 
app.use(cookieParser())

// Servindo arquivos estáticos (CSS, JS, Imagens)
app.use(express.static(__dirname + '/public')) // Servindo os arquivos da pasta public
app.use(express.static(__dirname + '/views'))  // Servindo os arquivos HTML da pasta views


// Rota para exibir a página de cadastro
app.get('/cadastrar', (req, res) => {
    res.sendFile(__dirname + '/views/p-00cadastrar.html')
})
// Rota para exibir a página de login
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/views/p-01login.html')
})
// Rota para exibir a página de recuperação de senha
app.get('/recuperar', (req, res) => {
    res.sendFile(__dirname + '/views/p-002recuperar.html')
})
// Rota para exibir a página de recuperação de senha
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

app.get('/usuario', (req, res) => {
    res.sendFile(__dirname + '/views/p-03User.html')
})


// Definindo a rota de autenticação
app.use('/', authRoutes)
app.use('/auth', authRoutes)
app.use('/user', userRoutes);  // Usando as rotas do usuário
app.use('/api/auth', authRoutes)
// Rotas
app.use('/auth', require('./routes/auth'))

// Porta do servidor
const PORT = process.env.PORT || 5500
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))
