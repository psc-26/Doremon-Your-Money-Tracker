import OpenAI from "openai";

const grok = new OpenAI({
  apiKey: process.env.GROK_API_KEY || "",
  baseURL: "https://api.x.ai/v1",
  dangerouslyAllowBrowser: true // Required for client-side usage in this environment
});

export async function parseExpense(text: string) {
  try {
    const response = await grok.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "You are a financial parsing assistant. Return ONLY a JSON object with: amount (number), reason (string), timestamp (ISO string), and suggestedCategory (one of: 'genuine', 'avoidable', 'unnecessary')."
        },
        {
          role: "user",
          content: `Parse this expense entry: "${text}". Current time is ${new Date().toISOString()}.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      amount: result.amount || 0,
      reason: result.reason || "Unknown",
      timestamp: result.timestamp ? new Date(result.timestamp).getTime() : Date.now(),
      suggestedCategory: result.suggestedCategory as any
    };
  } catch (error) {
    console.error("Grok Parsing Error:", error);
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

    const response = await grok.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        {
          role: "system",
          content: "You are a Gen Z financial advisor agent named Doremon. You use slang like 'bestie', 'no cap', 'slay', 'tea', 'vibes'. Be helpful but funny. Max 2 sentences. Use emojis."
        },
        {
          role: "user",
          content: `Analyze these expenses and provide a short, witty Gen Z style insight: ${JSON.stringify(summary.slice(0, 20))}`
        }
      ]
    });

    return response.choices[0].message.content || "Keep slaying your budget! ✨";
  } catch (error) {
    console.error("Grok Insight Error:", error);
    return "AI is taking a nap. Keep tracking! 😴";
  }
}
