document.getElementById('form-cadastro').addEventListener('submit', function(event) {
    const senha = document.getElementById('senha').value
    const confirmarSenha = document.getElementById('confirmarSenha').value

    // Verificar se as senhas coincidem
    if (senha !== confirmarSenha) {
        // Mostrar mensagem de erro
        document.getElementById('erro-senhas').style.display = 'block'

        // Impedir o envio do formulário
        event.preventDefault()
    } else {
        // Caso as senhas coincidam, esconder a mensagem de erro
        document.getElementById('erro-senhas').style.display = 'none'
    }
})