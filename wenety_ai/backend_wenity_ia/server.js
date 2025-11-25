// server.js
require('dotenv').config();
const express = require('express');
const mariadb = require('mariadb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const auth = require('./middleware/auth');
const multer = require('multer');
const FormData = require('form-data');
const pdf = require('pdf-parse/lib/pdf-parse.js');

// --- ADICIONADO: Dependências para recuperação de senha ---
const nodemailer = require('nodemailer');
const crypto = require('crypto');
// ----------------------------------------------------

// Importa a biblioteca do Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// --- Middleware ---
app.use(express.json());
app.use(cors()); // [cite: 22]

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Configuração do Banco de Dados ---
const pool = mariadb.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'wenetyia',
    connectionLimit: 5
}); // [cite: 23]

// --- Configuração de Variáveis de Ambiente ---
const JWT_SECRET = process.env.JWT_SECRET; // [cite: 24]

// --- ADICIONADO: Armazenamento de tokens de reset ---
// Isso estava faltando no código do estagiário e causaria erros.
const resetTokens = new Map();
// --------------------------------------------------

// --- Configuração da API do Gemini ---
let model;
try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" }); // [cite: 26]
    console.log("Modelo do Gemini inicializado com sucesso.");
} catch (error) {
    console.error("ERRO ao inicializar o modelo do Gemini:", error); // [cite: 27]
    model = null;
}

// =================================
//     FUNÇÕES AUXILIARES
// =================================

// --- Função para gerar tokens JWT ---
function generateTokens(user) {
    const accessTokenPayload = {
        user: {
            id: user.id,
            email: user.email
        }
    }; // [cite: 18]
    // Access token (1 hora)
    const accessToken = jwt.sign(
        accessTokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    ); // [cite: 19]
    // Refresh token (7 dias)
    const refreshToken = jwt.sign(
        accessTokenPayload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    ); // [cite: 20]
    return { accessToken, refreshToken }; // [cite: 21]
}

// --- ADICIONADO: Função para enviar email de recuperação ---
async function sendResetEmail(email, token) {
    const publicUrl = process.env.FRONT_URL || 'http://localhost:4200'; // 
    const resetLink = `${publicUrl}/trocar-senha/${token}`; // 

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    }); // [cite: 3]

    const mailOptions = {
        from: `"Wenity IA" <${process.env.EMAIL_USER}>`, // 
        to: email, // 
        subject: 'Recuperação de senha - Wenity IA', // 
        html: `
          <h2>Recuperação de senha</h2>
          <p>Você solicitou a redefinição de sua senha.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p><a href="${resetLink}" target="_blank">${resetLink}</a></p>
          <p>Este link expira em 15 minutos.</p>
        ` // HTML corrigido para enviar o link
    };

    await transporter.sendMail(mailOptions); // [cite: 5]
    console.log(`✅ E-mail enviado para ${email} com link: ${resetLink}`);
}
// -------------------------------------------------------


// =================================
//        ROTAS DE AUTENTICAÇÃO
// =================================

// Rota de Registro
app.post('/api/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt); // [cite: 29]
        const result = await conn.query(
            "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: String(result.insertId) });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') { // [cite: 30]
            return res.status(409).json({ message: 'Este email já está em uso.' });
        }
        console.error(error); // [cite: 31]
        res.status(500).json({ message: 'Erro ao cadastrar usuário.' });
    } finally {
        if (conn) conn.release(); // [cite: 32]
    }
});

// Rota de Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios.' });
    }
    let conn;
    try {
        conn = await pool.getConnection();
        const users = await conn.query("SELECT * FROM users WHERE email = ?", [email]); // [cite: 34]
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); // [cite: 34]
        }
        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' }); // [cite: 35]
        }
        const { accessToken, refreshToken } = generateTokens(user);
        await conn.query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
            [user.id, refreshToken]
        ); // [cite: 36]
        res.json({
            token: accessToken,
            refreshToken: refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        }); // [cite: 37, 38]
    } catch (error) {
        console.error('Erro no login:', error); // [cite: 39]
        res.status(500).json({ message: 'Erro no servidor.' }); // [cite: 40]
    } finally {
        if (conn) conn.release();
    }
});

// --- ADICIONADO: Rota para solicitar recuperação de senha ---
app.post('/api/recuperar-senha', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'E-mail é obrigatório.' });

    let conn;
    try {
        conn = await pool.getConnection();
        const users = await conn.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            // Não expõe se o e-mail existe ou não
            return res.json({ message: 'Se o e-mail existir, um link de recuperação foi enviado.' });
        }

        const token = crypto.randomBytes(32).toString('hex'); // [cite: 7]
        const expires = Date.now() + 15 * 60 * 1000; // 15 minutos
        resetTokens.set(token, { email, expires });

        await sendResetEmail(email, token);

        res.json({
            message: 'E-mail enviado com sucesso!',
            // [cite: 6] (removido o redirectTo que estava no original, 
            // pois o link agora vai por email)
        });
    } catch (error) {
        console.error('❌ Erro ao enviar e-mail:', error);
        res.status(500).json({ message: 'Erro ao enviar o e-mail.' }); // [cite: 8]
    } finally {
        if (conn) conn.release();
    }
});
// ---------------------------------------------------------

// --- ADICIONADO: Rota para trocar a senha com o token ---
app.post('/api/trocar-senha', async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
    }

    const tokenData = resetTokens.get(token);
    if (!tokenData) return res.status(400).json({ message: 'Token inválido ou expirado.' });

    const { email, expires } = tokenData;
    if (Date.now() > expires) {
        resetTokens.delete(token);
        return res.status(400).json({ message: 'Token expirado.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();

        const saltRounds = 10; // [cite: 10]
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds); // [cite: 10]

        await conn.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        resetTokens.delete(token); // Invalida o token após o uso

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('❌ Erro ao trocar senha:', error);
        res.status(500).json({ message: 'Erro ao trocar a senha.' }); // [cite: 11]
    } finally {
        if (conn) conn.release();
    }
});
// ------------------------------------------------------

// Rota para renovar o token
app.post('/api/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token não fornecido.' });
    }
    let conn;
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        conn = await pool.getConnection(); // [cite: 89]
        const tokens = await conn.query(
            "SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND expires_at > NOW() AND revoked = 0",
            [refreshToken, decoded.user.id]
        ); // [cite: 90]
        if (tokens.length === 0) {
            return res.status(401).json({ message: 'Refresh token inválido ou expirado.' });
        }
        const users = await conn.query("SELECT * FROM users WHERE id = ?", [decoded.user.id]);
        if (users.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado.' }); // [cite: 91]
        }
        const user = users[0]; // [cite: 92]
        const { accessToken, refreshToken: newRefreshToken } = generateTokens(user); // [cite: 93]
        await conn.query(
            "UPDATE refresh_tokens SET revoked = 1 WHERE token = ?",
            [refreshToken]
        ); // [cite: 94]
        await conn.query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))",
            [user.id, newRefreshToken]
        ); // [cite: 95]
        res.json({
            token: accessToken,
            refreshToken: newRefreshToken
        }); // [cite: 96]
    } catch (error) {
        if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Refresh token inválido.' }); // [cite: 97]
        }
        console.error('Erro ao renovar token:', error); // [cite: 98]
        res.status(500).json({ message: 'Erro no servidor.' });
    } finally {
        if (conn) conn.release(); // [cite: 99]
    }
});

// Rota de Logout
app.post('/api/logout', auth, async (req, res) => {
    const { refreshToken } = req.body;
    let conn;
    try {
        conn = await pool.getConnection();
        if (refreshToken) {
            await conn.query(
                "UPDATE refresh_tokens SET revoked = 1 WHERE token = ? AND user_id = ?",
                [refreshToken, req.user.id]
            ); // [cite: 101]
        } else {
            await conn.query(
                "UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?",
                [req.user.id]
            ); // [cite: 102]
        }
        res.json({ message: 'Logout realizado com sucesso.' });
    } catch (error) {
        console.error('Erro no logout:', error);
        res.status(500).json({ message: 'Erro ao fazer logout.' }); // [cite: 103]
    } finally {
        if (conn) conn.release();
    }
});


// =================================
//        ROTAS DA APLICAÇÃO (IA)
// =================================

// Rota de Chat Gemini (protegida)
app.post('/api/chat', auth, async (req, res) => {
    if (!model) {
        return res.status(503).json({ error: "O modelo de IA não está disponível no momento." });
    }
    let conn; // [cite: 43]
    try {
        const { message, history } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Nenhuma mensagem foi fornecida.' }); // [cite: 44]
        }
        const userId = req.user.id; // [cite: 45]
        const chat = model.startChat({
            history: history || [],
        });
        const result = await chat.sendMessage(message); // [cite: 46]
        const response = result.response; // [cite: 47]
        const modelResponseText = response.text();

        conn = await pool.getConnection();
        await conn.query(
            "INSERT INTO chat_history (user_id, role, message_text) VALUES (?, ?, ?)",
            [userId, 'user', message]
        ); // [cite: 48]
        await conn.query(
            "INSERT INTO chat_history (user_id, role, message_text) VALUES (?, ?, ?)",
            [userId, 'model', modelResponseText]
        ); // [cite: 49]
        console.log(`Conversa salva para o usuário com ID: ${userId}`); // [cite: 50]
        res.json({ response: modelResponseText });
    } catch (error) {
        console.error("Erro na rota /api/chat:", error); // [cite: 51]
        res.status(500).json({ error: 'Ocorreu um erro ao processar sua mensagem.' }); // [cite: 52]
    } finally {
        if (conn) { // [cite: 55]
            conn.release(); // [cite: 54]
        }
    }
});

// Rota para carregar histórico do chat (protegida)
app.get('/api/chat/history', auth, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store'); // [cite: 56]
    let conn;
    try {
        conn = await pool.getConnection();
        const userId = req.user.id;
        const rows = await conn.query(
            "SELECT role, message_text FROM chat_history WHERE user_id = ? ORDER BY created_at ASC",
            [userId]
        ); // [cite: 57]
        const history = rows.map(row => ({
            role: row.role,
            parts: [{ text: row.message_text }]
        })); // [cite: 58]
        res.json(history);
    } catch (error) {
        console.error("Erro ao buscar histórico do chat:", error);
        res.status(500).json({ message: 'Erro ao buscar histórico.' }); // [cite: 59]
    } finally {
        if (conn) conn.release(); // [cite: 60]
    }
});

// Rota para Analisar Currículo (protegida)
// Rota para Analisar Múltiplos Currículos (Fase 1: Análise Estruturada)


// [CORREÇÃO FINAL] Listar todas as vagas do usuário (Dashboard)
app.get('/api/jobs', auth, async (req, res) => {
    // --- PISTA DE DEBUG 2 ---
    // Vamos ver qual usuário está pedindo a lista
    const userId = req.user.id;
    console.log(`[GET /api/jobs] Buscando vagas para o User ID: ${userId}`);
    // --- FIM DA PISTA ---

    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            SELECT j.*, COUNT(a.id) as candidate_count 
            FROM jobs j 
            LEFT JOIN applications a ON j.id = a.job_id 
            WHERE j.user_id = ? 
            GROUP BY j.id 
            ORDER BY j.created_at DESC
        `;
        
        // Esta versão (sem []) é a correta para SELECT com o seu driver
        const jobs = await conn.query(query, [userId]);
        
        // --- PISTA DE DEBUG 3 ---
        console.log(`[GET /api/jobs] Query executada. Vagas encontradas: ${jobs.length}`);
        // --- FIM DA PISTA ---

        const formattedJobs = jobs.map(job => {
            let requirements = {};
            try {
                requirements = typeof job.requirements === 'string' 
                    ? JSON.parse(job.requirements) 
                    : (job.requirements || {});
            } catch (e) {
                console.error(`JSON inválido na vaga ID ${job.id}`);
            }
            
            return {
                ...job,
                requirements: requirements,
                candidate_count: Number(job.candidate_count)
            };
        });

        res.json(formattedJobs);
    } catch (error) {
        console.error('Erro ao listar vagas:', error);
        res.status(500).json({ message: 'Erro interno ao buscar vagas.' });
    } finally {
        if (conn) conn.release();
    }
});

// [CORRIGIDO] Criar uma nova vaga
app.post('/api/jobs', auth, async (req, res) => {
    const { title, description, requirements } = req.body;
    
    // --- PISTA DE DEBUG 1 ---
    // Vamos ver qual usuário está criando a vaga
    const userId = req.user.id;
    console.log(`[POST /api/jobs] Vaga "${title}" está sendo criada pelo User ID: ${userId}`);
    // --- FIM DA PISTA ---

    if (!title || !requirements) {
        return res.status(400).json({ message: 'Título e Requisitos são obrigatórios.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        const reqString = typeof requirements === 'object' ? JSON.stringify(requirements) : requirements;
        
        const query = 'INSERT INTO jobs (user_id, title, description, requirements) VALUES (?, ?, ?, ?)';
        
        // Esta versão (sem []) é a correta para INSERT
        const result = await conn.query(query, [userId, title, description, reqString]);
        
        const newJobId = Number(result.insertId); 

        console.log(`[POST /api/jobs] Vaga criada com sucesso! ID da Vaga: ${newJobId}`);

        res.status(201).json({ 
            id: newJobId, 
            title: title, 
            description: description, 
            requirements: requirements 
        });

    } catch (error) {
        console.error('Erro ao criar vaga:', error);
        res.status(500).json({ message: 'Erro interno ao salvar a vaga.' });
    } finally {
        if (conn) conn.release();
    }
});

// Rota para Histórico de Contratação (protegida)
app.get('/api/hiring/history', auth, async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const userId = req.user.id;
        const rows = await conn.query(
            "SELECT job_title, job_requirements, analysis_result, resumes_count, created_at FROM resume_analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 5",
            [userId]
        ); // [cite: 66]
        const history = rows.map(row => ({
            jobOpening: { id: '', title: row.job_title },
            requirements: JSON.parse(row.job_requirements || '{}'),
            bestCandidate: "Análise Salva",
            analyzedResumesCount: row.resumes_count,
            analysisDate: row.created_at,
            analysisText: row.analysis_result
        })); // [cite: 67, 68]
        res.json(history);
    } catch (error) {
        console.error("Erro ao buscar histórico de análises:", error); // [cite: 69]
        res.status(500).json({ message: 'Erro ao buscar histórico.' }); // [cite: 70]
    } finally {
        if (conn) conn.release(); // [cite: 71]
    }
});





// [DESAFIO FINAL] Pegar detalhes da vaga + ANÁLISE COMPLETA dos candidatos
app.get('/api/jobs/:id', auth, async (req, res) => {
    const userId = req.user.id;
    const jobId = req.params.id;
    let conn;
    try {
        conn = await pool.getConnection();
        
        // 1. Buscar Vaga (Isso está OK)
        const jobs = await conn.query('SELECT * FROM jobs WHERE id = ? AND user_id = ?', [jobId, userId]);
        if (!jobs || jobs.length === 0) {
            return res.status(404).json({ message: 'Vaga não encontrada.' });
        }
        const job = jobs[0]; 
        
        try {
            job.requirements = typeof job.requirements === 'string' ? JSON.parse(job.requirements) : (job.requirements || {});
        } catch (e) {
            job.requirements = {};
        }

        // 2. Buscar Candidatos (AQUI ESTÁ A GRANDE MUDANÇA)
        const candidatesQuery = `
            SELECT 
                c.id as candidate_id, c.name, c.email, c.phone, 
                a.score, a.status, 
                c.created_at as applied_at,
                
                --  👇 ADICIONAMOS ISSO! 👇
                -- Puxa o JSON completo da análise que salvamos na tabela 'candidates'
                c.structured_data
                
            FROM applications a
            JOIN candidates c ON a.candidate_id = c.id
            WHERE a.job_id = ?
            ORDER BY a.score DESC
        `;
        
        const applications = await conn.query(candidatesQuery, [jobId]);

        // [NOVO] O 'applications' agora contém o 'structured_data' de cada candidato.
        // Vamos parsear esse JSON antes de enviar ao front
        const applicationsWithData = applications.map(app => {
            try {
                app.structured_data = typeof app.structured_data === 'string' 
                    ? JSON.parse(app.structured_data) 
                    : (app.structured_data || {});
            } catch (e) {
                app.structured_data = { error: 'Falha ao ler JSON da análise.' };
            }
            return app;
        });

        res.json({ ...job, applications: applicationsWithData });

    } catch (error) {
        console.error('Erro ao buscar vaga (detalhe):', error);
        res.status(500).json({ message: 'Erro interno.' });
    } finally {
        if (conn) conn.release();
    }
});



// [CORRIGIDO] Rota de Análise (Versão ATS)
app.post('/api/hiring/analyze', auth, upload.array('resumes'), async (req, res) => {
    console.log('>>> Iniciando Rota de Análise ATS');

    // 1. Validações
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Nenhum currículo enviado.' });
    if (!model) return res.status(503).json({ error: "IA indisponível." });
    
    // [CORREÇÃO DE BUG]: Agora lemos o ID, não o objeto inteiro
    const { job_id } = req.body; 
    console.log('Job ID recebido:', job_id);

    if (!job_id) {
        return res.status(400).json({ error: 'ID da vaga é obrigatório.' });
    }

    let conn;
    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // 2. Buscar a Vaga no Banco (Isso evita o erro de JSON undefined)
        const jobs = await conn.query('SELECT * FROM jobs WHERE id = ? AND user_id = ?', [job_id, req.user.id]);
        
        if (!jobs || jobs.length === 0) {
            await conn.rollback();
            return res.status(404).json({ error: 'Vaga não encontrada.' });
        }
        const jobOpening = jobs[0];
        
        // Parse seguro dos requisitos
        let requirements = {};
        try {
            requirements = typeof jobOpening.requirements === 'string' 
                ? JSON.parse(jobOpening.requirements) 
                : jobOpening.requirements;
        } catch (e) { console.error("Erro ao parsear requirements:", e); }

        // 3. Processar PDFs
        let allResumesText = "";
        for (const file of req.files) {
            const data = await pdf(file.buffer);
            allResumesText += `\n\n--- CURRÍCULO: ${file.originalname} ---\n${data.text}\n--- FIM ---\n`;
        }

        // 4. Prompt para IA
        const jsonSchemaString = `{
            "resumo_geral": "Texto...",
            "ranking_candidatos": [
                {
                    "nome_candidato": "Nome",
                    "email": "email",
                    "pontuacao_compatibilidade": 85,
                    "habilidades_encontradas": ["A", "B"],
                    "pontos_fortes": "...",
                    "pontos_fracos": "..."
                }
            ]
        }`;

        const fullPrompt = `
            Vaga: ${jobOpening.title}
            Requisitos: ${JSON.stringify(requirements)}
            Analise os currículos abaixo e retorne APENAS JSON seguindo este schema:
            ${jsonSchemaString}
            
            Currículos:
            ${allResumesText}
        `;

        const result = await model.generateContent({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        
        // Limpeza da resposta da IA
        const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const analysisData = JSON.parse(responseText);

        // 5. Salvar Análise
        const insertAnalysis = `INSERT INTO resume_analyses (user_id, job_title, job_requirements, analysis_result, resumes_count, job_id) VALUES (?, ?, ?, ?, ?, ?)`;
        
        const analysisResult = await conn.query(insertAnalysis, [
            req.user.id,
            jobOpening.title,
            JSON.stringify(requirements),
            responseText, // Salva o JSON limpo
            req.files.length,
            job_id
        ]);
        const analysisId = Number(analysisResult.insertId); // Converte BigInt

        // 6. Salvar Candidatos (Loop)
        if (analysisData.ranking_candidatos) {
            for (const cand of analysisData.ranking_candidatos) {
                const email = cand.email || `noemail_${Date.now()}_${Math.random()}@sys.com`;
                const score = typeof cand.pontuacao_compatibilidade === 'number' 
                    ? cand.pontuacao_compatibilidade 
                    : parseInt(cand.pontuacao_compatibilidade) || 0;

                // Upsert Candidato
                await conn.query(`
                    INSERT INTO candidates (name, email, structured_data) VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE name = VALUES(name), structured_data = VALUES(structured_data)
                `, [cand.nome_candidato, email, JSON.stringify(cand)]);

                // Busca ID
                const [cRows] = await conn.query('SELECT id FROM candidates WHERE email = ?', [email]);
                
                if (cRows) { // MariaDB retorna objeto direto se for 1 resultado? Melhor garantir array
                     // Nota: Com mariadb driver, query retorna array de rows por padrão para SELECT.
                     // Se for objeto único, ajuste aqui. Normalmente é array.
                     const candidateId = cRows.id || cRows; 
                     // Ajuste seguro:
                     const realCandidateId = (Array.isArray(cRows)) ? cRows[0].id : cRows.id;

                     if (realCandidateId) {
                        await conn.query(`
                            INSERT INTO applications (job_id, candidate_id, analysis_id, score, status)
                            VALUES (?, ?, ?, ?, 'TRIAGEM')
                        `, [job_id, realCandidateId, analysisId, score]);
                     }
                }
            }
        }

        await conn.commit();
        res.json({ message: 'Sucesso', analysisId });

    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Erro na análise:", error);
        res.status(500).json({ error: 'Falha ao processar.' });
    } finally {
        if (conn) conn.release();
    }
});

// =================================
//        INICIALIZAÇÃO DO SERVIDOR
// =================================

const PORT = process.env.PORT || 3000; // [cite: 104]
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));