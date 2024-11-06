const mongoose = require('mongoose');

const AgendamentoSchema = new mongoose.Schema({
    nomeMedico: {
        type: String,
        required: true,
    },
    nomePaciente: {
        type: String,
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
    tipoDeAnimal: {
        type: String,
        required: true,
    },
    disponivel: {
        type: Boolean,
        required: true,
        default: true,
    },
}, { timestamps: true });

const Agendamento = mongoose.model('Agendamento', AgendamentoSchema);

module.exports = Agendamento;
