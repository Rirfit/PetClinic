const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const Animal = require('../models/animal')
require('dotenv').config()

// Middleware para verificar o token JWT
const verifyToken = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')  // Pegando o token de cookie ou header

  if (!token) {
    return res.status(401).json({ msg: 'Sem autorização, token não encontrado' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)  // Verificando o token com a chave secreta
    req.user = decoded.userId  // Decodificando o token para obter o userId
    next()  // Prosseguindo para a próxima função
  } catch (err) {
    return res.status(401).json({ msg: 'Token inválido' })
  }
}

// Rota protegida: /perfil
router.get('/perfil', verifyToken, async (req, res) => {
  try {
    const usuario = await User.findById(req.user).select('-senha')
    if (!usuario) {
      return res.redirect('/login')
    }
    res.render('p-09perfil', { usuario })
  } catch (err) {
    console.error(err)
    res.redirect('/login')
  }
})

// Rota protegida: /usuario
router.get('/usuario', verifyToken, (req, res) => {
  res.render('p-03User')  // Enviando o arquivo HTML protegido
})



// Rota para atualizar o perfil
router.put('/atualizar', verifyToken, async (req, res) => {
  const { nome, email, telefone } = req.body

  try {
    const camposAtualizacao = {}
    if (nome) camposAtualizacao.nome = nome
    if (email) camposAtualizacao.email = email
    if (telefone) camposAtualizacao.telefone = telefone

    const usuario = await User.findByIdAndUpdate(
      req.user,
      { $set: camposAtualizacao },
      { new: true }
    ).select('-senha')

    if (!usuario) {
      return res.status(404).json({ msg: 'Usuário não encontrado' })
    }

    res.json({ success: true, usuario })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Erro ao atualizar usuário' })
  }
})

// Rota para deletar o usuário
router.delete('/remover', verifyToken, async (req, res) => {
  try {
    const usuario = await User.findByIdAndDelete(req.user)
    if (!usuario) {
      return res.status(404).json({ msg: 'Usuário não encontrado' })
    }
    res.clearCookie('token')
    res.json({ success: true, msg: 'Usuário removido com sucesso' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ msg: 'Erro ao remover usuário' })
  }
})

// Rota de cadastro Animal
router.post('/cadastrarAnimal', verifyToken, async (req, res) => {
  const { nome, raca, rga, idade, peso } = req.body

  // Validações simples
  if (!nome || !raca || !rga || !idade || !peso) {
      return res.status(400).send('Por favor, preencha todos os campos.')
  }
  
  try {
      // Verifica se o animal já existe
      const animalExistente = await Animal.findOne({ rga: rga })
      if (animalExistente) {
          return res.status(400).send('Animal já cadastrado.')
      }

      // Cria um novo cadastro de animal
      const pet = new Animal({
          nome,
          raca,
          rga,
          idade,
          peso,
          usuario: req.user // O ID do usuário autenticado é passado como parâmetro
      }) // A senha será criptografada antes de salvar        
      // Salva o animal no banco de dados
      await pet.save()

      
      // Após o cadastro com sucesso, redirecionar para a página de login
      res.redirect('/perfil')
  } catch (err) {
      console.error(err)
      res.status(500).send('Erro no servidor')
  }
})

// Rota para listar animais do usuário
router.get('/animais', verifyToken, async (req, res) => {
  try {
      const animais = await Animal.find({ usuario: req.user });
      res.json(animais);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erro ao buscar animais' });
  }
});

// Rota para atualizar animal
router.put('/animal/:id', verifyToken, async (req, res) => {
  try {
      const { nome, raca, rga, idade, peso } = req.body;

      // Validações básicas
      if (!nome || !raca || !rga || !idade || !peso) {
        return res.status(400).json({ msg: 'Todos os campos são obrigatórios' });
      }

      // Verificar se o RGA já existe (exceto para o mesmo animal)
      const existingAnimal = await Animal.findOne({ 
        rga: rga, 
        _id: { $ne: req.params.id } 
      });
      if (existingAnimal) {
        return res.status(400).json({ msg: 'RGA já cadastrado para outro animal' });
      }

      const animal = await Animal.findOneAndUpdate({
          _id: req.params.id,
          usuario: req.user
        },
        {
          $set: { nome, raca, rga, idade, peso } 
        },
        { new: true }
      );

      if (!animal) {
        return res.status(404).json({ msg: 'Animal não encontrado' });
      }
      
      if (nome) animal.nome = nome;
      if (raca) animal.raca = raca;
      if (rga) animal.rga = rga;
      if (idade) animal.idade = idade;
      if (peso) animal.peso = peso;

      await animal.save();
      res.json(animal);
  } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Erro ao atualizar animal' })
  }
});

// Rota para deletar animal
router.delete('/animal/:id', verifyToken, async (req, res) => {
  try {
      const animal = await Animal.findOneAndDelete({
          _id: req.params.id,
          usuario: req.user
      });

      if (!animal) {
          return res.status(404).json({ msg: 'Animal não encontrado' });
      }

      res.json({ msg: 'Animal removido com sucesso' });
  } catch (err) {
      console.error(err);
      res.status(500).send('Erro ao remover animal');
  }
});

module.exports = router
