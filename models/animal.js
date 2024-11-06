const mongoose = require('mongoose')

const animalSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
    },
    raca: {
        type: String,
        required: true,        
    },
    rga: {
        type: String,
        required: true,
        unique: true,
    },
    idade: {
        type: Number,
        required: true,        
    },
    peso: {
        type: String,
        required: true,
    },
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    data: {
        type: Date,
        default: Date.now,
    },    
});

// Middleware para cascading delete
animalSchema.pre('remove', function(next) {
    this.model('User').updateOne(
        { _id: this.usuario },
        { $pull: { animais: this._id } },
        next
    );
});


const Animal = mongoose.model('Animal', animalSchema)
module.exports = Animal
