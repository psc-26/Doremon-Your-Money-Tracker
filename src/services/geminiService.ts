import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function parseExpense(text: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Parse this expense entry: "${text}". Extract amount (number), reason (string), time (ISO string or relative time converted to current date), and suggest a category from ['genuine', 'avoidable', 'unnecessary']. Current time is ${new Date().toISOString()}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            reason: { type: Type.STRING },
            timestamp: { type: Type.STRING, description: "ISO 8601 timestamp" },
            suggestedCategory: { type: Type.STRING, enum: ['genuine', 'avoidable', 'unnecessary'] }
          },
          required: ["amount", "reason", "timestamp", "suggestedCategory"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      amount: result.amount || 0,
      reason: result.reason || "Unknown",
      timestamp: result.timestamp ? new Date(result.timestamp).getTime() : Date.now(),
      suggestedCategory: result.suggestedCategory as any
    };
  } catch (error) {
    console.error("AI Parsing Error:", error);
    return null;
  }
}

export async function getSpendingInsight(expenses: any[]) {
  if (expenses.length === 0) return "No data to analyze yet, bestie! Start tracking to get some tea on your spending. ☕";
  
  try {
    const summary = expenses.map(ex => ({
      amount: ex.amount,
      reason: ex.reason,
      category: ex.category
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze these expenses and provide a short, witty Gen Z style insight or advice (max 2 sentences). Use emojis. Expenses: ${JSON.stringify(summary.slice(0, 20))}`,
      config: {
        systemInstruction: "You are a Gen Z financial advisor agent named Doremon. You use slang like 'bestie', 'no cap', 'slay', 'tea', 'vibes'. Be helpful but funny."
      }
    });

    return response.text || "Keep slaying your budget! ✨";
  } catch (error) {
    console.error("AI Insight Error:", error);
    return "AI is taking a nap. Keep tracking! 😴";
  }
}
