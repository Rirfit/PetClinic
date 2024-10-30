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
    },
    idade: {
        type: Number,
        required: true,        
    },
    peso: {
        type: String,
        required: true,
    },
    data: {
        type: Date,
        default: Date.now,
    },    
});


const animal = mongoose.model('Animal', animalSchema)
module.exports = animal
