document.getElementById('form-cadastro').addEventListener('submit', function(event) {
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;    


if (senha !== confirmarSenha) {
    // Exibir popup de erro
    alert('As senhas não coincidem!');
    
    // Impedir o envio do formulário
    event.preventDefault();
}

});
