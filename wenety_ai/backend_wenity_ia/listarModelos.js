// listarModelos.js
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    console.log("📋 Modelos disponíveis para esta API key:\n");
    data.models?.forEach(m => console.log(" -", m.name));
  })
  .catch(err => console.error("❌ Erro:", err));
