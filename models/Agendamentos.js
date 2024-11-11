const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    nomeMedico: {
        type: String,
        required: true,
    },
    nomePaciente: {
        type: String,
    },
    tipoDeAnimal: {
        type: String,
        required: true,
        enum: ['gato', 'cachorro'], // Limita o campo a 'gato' ou 'cachorro'
    },
    dataAgendamento: {
        type: Date,
        required: true,
        validate: {
            validator: function(value) {
                return value > new Date();
            },
            message: 'Data de agendamento deve ser no futuro',
        },
    },
    disponivel: {
        type: Boolean,
        default: true,
    },
    pacienteId: {
        type: mongoose.Schema.Types.ObjectId,  // Referência ao ID do paciente
        ref: 'User',  // Nome do modelo que é referenciado
        default: null,
    },
}, { timestamps: true });

const Agendamento = mongoose.model('Agendamento', AgendamentoSchema);
module.exports = Agendamento;
