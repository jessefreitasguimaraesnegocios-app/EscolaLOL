import { GoogleGenAI } from "@google/genai";
import { Vehicle, Language } from "../types";

export const generateFleetReport = async (vehicles: Vehicle[], language: Language = 'en'): Promise<string> => {
  // Directly access the API key from process.env.API_KEY as per guidelines
  if (!process.env.API_KEY) {
    return language === 'pt' 
      ? "Chave de API não configurada. Não é possível gerar insights." 
      : "API Key not configured. Unable to generate AI insights.";
  }

  // Initializing GoogleGenAI client with the required named parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const langInstruction = language === 'pt' 
    ? "Reply in Portuguese (Brazil)." 
    : "Reply in English.";

  const prompt = `
    You are an intelligent fleet management assistant for a school transportation system.
    Analyze the following vehicle data and provide a concise, professional summary report for the School Director.
    Focus on delays, efficiency, and safety.
    
    ${langInstruction}
    
    Data: ${JSON.stringify(vehicles.map(v => ({
      driver: v.driverName,
      status: v.status,
      passengers: `${v.currentPassengers}/${v.capacity}`,
      etaToNext: v.nextStopEta
    })))}

    Format:
    - **Overall Status**: [Brief Summary]
    - **Critical Alerts**: [List any delays or full capacity issues]
    - **Optimization Tip**: [One suggestion for improvement]
  `;

  try {
    // Using gemini-3-flash-preview for basic text summarization as recommended
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correctly accessing the text property from GenerateContentResponse
    return response.text || (language === 'pt' ? "Nenhum insight gerado." : "No insights generated.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'pt' 
      ? "Não foi possível gerar o relatório devido a um erro no serviço." 
      : "Unable to generate report due to a service error.";
  }
};