const express = require('express');
const path = require("path");
const bodyParser = require('body-parser');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const cookieParser = require('cookie-parser');
const User = require('./models/User');
const Agendamento = require('./models/Agendamento');
require('dotenv').config();

const app = express();

// Conectar ao MongoDB
connectDB();

app.use(bodyParser.urlencoded({ extended: false })); // Middleware para analisar os dados do formulário
app.use(bodyParser.json()); // Middleware para analisar os dados JSON
app.use(cookieParser()); // Middleware para analisar cookies

// Servindo arquivos estáticos (CSS, JS, Imagens)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Configurar o mecanismo de template EJS
app.set('view engine', 'ejs'); // Definir o mecanismo de visualização como EJS

// Definir o diretório de views
app.set('views', path.join(__dirname, 'views'));

// Rotas para renderizar as páginas EJS
app.get('/cadastrar', (req, res) => {
    res.render('p-00cadastrar'); // Renderizando o EJS sem extensão
});

app.get('/cadastrarAnimal', (req, res) => {
    res.render('p-07AnimalCadastro');
});

app.get('/login', (req, res) => {
    res.render('p-01login'); // Certifique-se de que este arquivo existe em "views"
});

app.get('/recuperar', (req, res) => {
    res.render('p-002recuperar');
});

app.get('/', (req, res) => {
    res.render('index'); // Assumindo que você tem um index.ejs na pasta views
});

app.get('/usuario', (req, res) => {
    res.render('p-03User');
});

app.get('/reset/:token', async (req, res) => {
    try {
        // Verifique se o token é válido e se não expirou
        const usuario = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ msg: 'Token inválido ou expirado' });
        }

        // Renderizar a página de nova senha, passando o email e o token para o formulário
        res.render('p-06novasenha', { email: usuario.email, token: req.params.token });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erro no servidor');
    }
});

// Rotas para listar os horários disponíveis e marcar agendamentos
app.get('/agendamentos', async (req, res) => {
    try {
        const datasDisponiveis = await Agendamento.find({ disponivel: true });
        res.render('agendamentos', { datasDisponiveis, user: req.user }); // Ajuste conforme necessário para autenticação
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);  // Usando as rotas do usuário
app.use('/api/auth', authRoutes);

// Rota para listar os horários disponíveis (API)
app.get('/datas-disponiveis', async (req, res) => {
    try {
        const datasDisponiveis = await Agendamento.find({ disponivel: true }).select('dataAgendamento nomeMedico');
        res.status(200).json(datasDisponiveis);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

// Rota para marcar uma data específica
app.post('/marcar-agendamento', async (req, res) => {
    const { agendamentoId, userId, nomePaciente } = req.body;

    try {
        const agendamento = await Agendamento.findById(agendamentoId);
        if (!agendamento) {
            return res.status(400).send('Agendamento não encontrado.');
        }

        if (!agendamento.disponivel) {
            return res.status(400).send('Agendamento não está disponível.');
        }

        agendamento.nomePaciente = nomePaciente;
        agendamento.userId = userId;
        agendamento.disponivel = false;
        await agendamento.save();

        res.status(200).json({ msg: 'Agendamento realizado com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

// Rota para disponibilizar novos horários de agendamento
app.post('/disponibilizar-horario', async (req, res) => {
    const { nomeMedico, dataAgendamento, tipoDeAnimal } = req.body;

    // Validações simples
    if (!nomeMedico || !dataAgendamento || !tipoDeAnimal) {
        return res.status(400).send('Por favor, preencha todos os campos.');
    }

    try {
        const novoAgendamento = new Agendamento({
            nomeMedico,
            dataAgendamento,
            tipoDeAnimal
        });

        await novoAgendamento.save();
        res.status(201).json({ msg: 'Horário disponibilizado com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

// Tratamento de erros
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Porta do servidor
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
