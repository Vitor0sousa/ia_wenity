// testarGemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

async function testarGemini() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ ERRO: Variável GEMINI_API_KEY não encontrada no .env");
    return;
  }

  console.log("🔑 Chave encontrada. Testando com API v1...");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // ✅ modelo válido para a API v1
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const result = await model.generateContent("Diga apenas 'Conexão OK ✅'");
    console.log("\n✅ Conexão bem-sucedida!");
    console.log("📤 Resposta:", result.response.text());
  } catch (err) {
    console.error("\n❌ Erro ao conectar:");
    console.error("Status:", err.status);
    console.error("Mensagem:", err.message);
  }
}

testarGemini();
