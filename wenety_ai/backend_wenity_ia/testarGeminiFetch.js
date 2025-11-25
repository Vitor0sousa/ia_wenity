// testarGeminiFetch.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

async function testarGeminiDireto() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY não encontrada no .env");
    return;
  }

  console.log("🔑 Testando acesso direto à API v1 com a nova chave...");

  const url = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro";

  const body = {
    contents: [
      {
        parts: [{ text: "Diga apenas 'Conexão OK ✅'" }],
      },
    ],
  };

  try {
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro HTTP:", response.status, data);
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("✅ Conexão bem-sucedida!");
    console.log("📤 Resposta:", text);
  } catch (err) {
    console.error("❌ Erro de rede:", err.message);
  }
}

testarGeminiDireto();
