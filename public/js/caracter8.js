function validateForm() {      
    const senha = document.getElementById('senha').value
    const confirmarSenha = document.getElementById('confirmarSenha').value

    if (senha.length < 8) {
        alert('A senha deve ter pelo menos 8 caracteres.')
        return false
    } else if (senha !== confirmarSenha) {
        alert('As senhas não coincidem.')
        return false
    }
    return true    
}
