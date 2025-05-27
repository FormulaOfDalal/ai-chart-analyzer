
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { AnalysisData } from './types'; // Updated import path

let ai: GoogleGenAI | null = null;
const GEMINI_API_KEY_LOCAL_STORAGE_KEY = 'geminiApiKey_aiChartAnalyzer';

const modelName = "gemini-2.5-flash-preview-04-17";

export const setGeminiApiKey = (key: string): void => {
  if (!key || key.trim() === "") {
    ai = null;
    localStorage.removeItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY);
    console.warn("API key removed or empty.");
    throw new Error("API key cannot be empty.");
  }
  try {
    ai = new GoogleGenAI({ apiKey: key });
    localStorage.setItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY, key);
    console.log("Gemini API Key has been set and saved to local storage.");
  } catch (error: any) {
    ai = null;
    // Do not remove from local storage here, user might want to retry with the same key
    // or it might be a temporary issue not related to the key itself.
    // Let the user decide to clear/change it.
    console.error("Failed to initialize GoogleGenAI with the provided key:", error.message);
    throw new Error(`Invalid API Key or failed to initialize Gemini client: ${error.message}`);
  }
};

export const loadApiKeyFromStorage = (): string | null => {
  const storedKey = localStorage.getItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY);
  if (storedKey) {
    try {
      ai = new GoogleGenAI({ apiKey: storedKey });
      console.log("Gemini API Key loaded from local storage and client initialized.");
      return storedKey;
    } catch (error: any) {
      console.warn("Failed to initialize GoogleGenAI with stored key:", error.message, "The key might be invalid or expired.");
      // Do not remove from local storage automatically. User might fix it or API service might be temporarily down.
      // ai instance will remain null if initialization fails.
      ai = null; 
      return storedKey; // Return the key so UI can show it, but client is not initialized
    }
  }
  ai = null; // Ensure ai is null if no key is loaded or initialization failed
  return null;
};

export const isGeminiClientInitialized = (): boolean => {
  return ai !== null;
};

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY);
}

export const clearGeminiApiKey = (): void => {
  ai = null;
  localStorage.removeItem(GEMINI_API_KEY_LOCAL_STORAGE_KEY);
  console.log("Gemini API Key has been cleared from service and local storage.");
}

const getAnalysisPrompt = (): string => {
  return `
Analyze the provided financial chart image. Provide a detailed analysis for each of the following categories. 
Respond strictly in JSON format with the following keys: 'resistanceSupport', 'trends', 'chartPatterns', 'candlestickPatterns', 'volumeAnalysis', 'momentum'.

Each key should have a string value containing the analysis. For example:
{
  "resistanceSupport": "Price shows strong resistance near $100 and support around $90. A key support zone is identified at the 50-day moving average.",
  "trends": "The chart indicates a primary uptrend, confirmed by higher highs and higher lows. A short-term consolidation phase is currently observed.",
  "chartPatterns": "A bullish flag pattern appears to be forming, suggesting a potential continuation of the uptrend upon a breakout.",
  "candlestickPatterns": "A series of doji candles near the recent high suggests indecision. A bullish engulfing pattern was observed 3 periods ago, indicating strong buying pressure at that level.",
  "volumeAnalysis": "Volume has been decreasing during the consolidation phase, which is typical for a flag pattern. A surge in volume on breakout would confirm the pattern.",
  "momentum": "RSI (Relative Strength Index) is above 50, indicating bullish momentum, but it has been declining, suggesting a potential weakening of the uptrend or an upcoming pullback."
}

Ensure the entire response is a single valid JSON object. Do not use markdown like \`\`\`json.
`;
};

export const analyzeChartWithGemini = async (
  imageBase64Data: string,
  mimeType: string
): Promise<AnalysisData> => {
  if (!ai) {
    // Attempt to load from storage one last time if not initialized
    const keyFromStorage = loadApiKeyFromStorage();
    if (!keyFromStorage || !ai) {
         throw new Error(
        "Gemini API client is not initialized. Please set your API key."
      );
    }
  }

  try {
    const imagePart = {
      inlineData: {
        mimeType: mimeType,
        data: imageBase64Data,
      },
    };

    const textPart = {
      text: getAnalysisPrompt(),
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        temperature: 0.3,
      }
    });
    
    const responseText = response.text;
    
    if (!responseText) {
        throw new Error("Received an empty response from the AI.");
    }

    let jsonStr = responseText.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    try {
      const parsedData: AnalysisData = JSON.parse(jsonStr);
      return parsedData;
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      console.error("Raw response text:", responseText);
      throw new Error(`Failed to parse analysis data from AI. Raw response: ${responseText.substring(0,200)}...`);
    }

  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    if (error.message && error.message.toLowerCase().includes("api key not valid") || error.message.toLowerCase().includes("invalid api key")) {
        // Invalidate the client if API key is confirmed bad by the API
        ai = null; 
        throw new Error("Invalid Gemini API Key. Please check your key and set it again.");
    }
    // Check for specific quota errors or other actionable messages
    if (error.message && error.message.includes('quota')) {
      throw new Error(`Gemini API request failed due to quota limits: ${error.message}`);
    }
    throw new Error(`Error analyzing chart with Gemini: ${error.message || 'Unknown error'}`);
  }
};
