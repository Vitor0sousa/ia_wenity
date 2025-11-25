// middleware/auth.js

const jwt = require('jsonwebtoken');
// 1. ADICIONADO: Carrega as variáveis de ambiente do .env
require('dotenv').config();

// 2. CORRIGIDO: Usa a MESMA chave secreta que o server.js
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function(req, res, next) {
    // 3. CORRIGIDO: Procura o token no cabeçalho 'Authorization'
    const authHeader = req.header('Authorization');

    // Verifica se o cabeçalho de autorização existe
    if (!authHeader) {
        return res.status(401).json({ message: 'Acesso negado. O token de autorização não foi fornecido.' });
    }

    // O header deve ser no formato "Bearer [token]"
    // Nós separamos a palavra "Bearer" do token em si
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ message: 'Formato de token inválido. Use o formato "Bearer".' });
    }
    
    const token = parts[1];

    try {
        // Verifica se o token é válido usando a chave do .env
        const decoded = jwt.verify(token, JWT_SECRET);

        // Adiciona a informação do usuário à requisição
        req.user = decoded.user;
        next(); // Tudo certo, pode prosseguir para a rota do chat

    } catch (error) {
        res.status(401).json({ message: 'Token não é válido.' });
    }
};