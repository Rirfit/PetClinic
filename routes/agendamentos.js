const express = require('express');
const router = express.Router();
const Agendamento = require('../models/Agendamentos'); // Ajuste o caminho conforme necessário
const User = require('../models/User');  // Importando o modelo de User para pegar o ID do paciente
const verifyToken = require('./user');
// Rota para associar o paciente ao agendamento
// Rota para associar o paciente ao agendamento
router.post('/agendar', verifyToken, async (req, res) => {
    const { agendamentoId } = req.body;  // Agora não precisamos mais do pacienteId no corpo da requisição, pois ele vem do token

    try {
        // O pacienteId agora está disponível através do req.user (decodificado do token JWT)
        const pacienteId = req.user;

        // Verifica se o paciente existe
        const paciente = await User.findById(pacienteId);
        if (!paciente) {
            return res.status(404).send('Paciente não encontrado');
        }

        // Atualiza o agendamento
        const agendamento = await Agendamento.findByIdAndUpdate(
            agendamentoId,
            { 
                pacienteId: pacienteId,  // Adiciona o ID do paciente ao agendamento
                disponivel: false,        // Define o agendamento como não disponível
            },
            { new: true }  // Retorna o agendamento atualizado
        );

        if (!agendamento) {
            return res.status(404).send('Agendamento não encontrado');
        }

        res.send({ message: 'Agendamento atualizado com sucesso', agendamento });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});


// Rota para listar todos os agendamentos disponíveis = true
router.get('/', async (req, res) => {
    try {
        // Recuperando apenas os agendamentos com 'disponivel' igual a true
        const agendamentosDisponiveis = await Agendamento.find({ disponivel: true });

        // Formatação dos agendamentos
        const agendamentosFormatados = agendamentosDisponiveis.map(agendamento => {
            return {
                ...agendamento.toObject(),
                disponivel: agendamento.disponivel ? 'Sim' : 'Não'
            };
        });

        // Enviando os agendamentos disponíveis para a página
        res.render('agendamentos', { agendamentos: agendamentosFormatados });

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor');
    }
});

// Outras rotas de agendamentos podem ser adicionadas aqui

module.exports = router;
