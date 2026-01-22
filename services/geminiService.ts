
import { GoogleGenAI, Type } from "@google/genai";

// Always use new GoogleGenAI({ apiKey: process.env.API_KEY }) as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function fetchMonsterStats(monsterName: string) {
  try {
    // Using gemini-3-pro-preview for complex structured data extraction tasks
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Fetch detailed D&D 5e combat stats for: ${monsterName}. Include saving throw proficiencies in the savingThrows field (e.g., "Str +5, Dex +3").`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            hp: { type: Type.NUMBER },
            ac: { type: Type.NUMBER },
            str: { type: Type.NUMBER },
            dex: { type: Type.NUMBER },
            con: { type: Type.NUMBER },
            int: { type: Type.NUMBER },
            wis: { type: Type.NUMBER },
            cha: { type: Type.NUMBER },
            savingThrows: { type: Type.STRING, description: "Saving throw proficiencies, e.g., 'Str +4, Con +6'" },
            actions: { type: Type.ARRAY, items: { type: Type.STRING } },
            reactions: { type: Type.ARRAY, items: { type: Type.STRING } },
            legendaryActions: { type: Type.ARRAY, items: { type: Type.STRING } },
            resistances: { type: Type.ARRAY, items: { type: Type.STRING } },
            immunities: { type: Type.ARRAY, items: { type: Type.STRING } },
            damageInfo: { type: Type.STRING, description: "Detailed damage types and modifiers" }
          },
          required: ["name", "hp", "ac", "str", "dex", "con", "int", "wis", "cha", "savingThrows"]
        }
      }
    });

    // Trimming response text property before parsing as per guidelines
    const text = response.text?.trim();
    if (!text) throw new Error("No data returned from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to fetch monster stats:", error);
    throw error;
  }
}
