export interface GeneratedRecipe {
    name: string;
    description: string;
    instructions: Record<string, string>;
    calories: string;
    steps: number;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_AI_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.AI_KEY;

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const generateRecipeWithAI = async (
    ingredients: string,
    mood: string,
    language: string = 'en'
): Promise<GeneratedRecipe> => {
    console.log("Debug - OpenRouter Key being used:", GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 5)}...` : "UNDEFINED");

    if (!GEMINI_API_KEY) {
        throw new Error("API Key is missing. Please ensure EXPO_PUBLIC_AI_KEY is set in your .env file.");
    }

    const prompt = `
    You are an expert mixologist and chef. Create a unique recipe based on these ingredients: "${ingredients}".
    The mood/vibe is: "${mood}".
    Language: ${language === 'ar' ? 'Arabic' : 'English'}.
    
    Return ONLY a valid JSON object with the following structure (no markdown formatting, just raw JSON):
    {
      "name": "Recipe Name",
      "description": "A short, catchy description matching the mood",
      "calories": "150 kcal",
      "instructions": {
        "S1": "Step 1 text",
        "S2": "Step 2 text"
      },
      "steps": 2
    }

    NOTE: IF THE ingredients or mood IS test, RETURN name as "Test Recipe" AND description as "This is a test recipe" AND instructions as follows:
    {
      "name": "Test Recipe",
      "description": "This is a test recipe",
      "calories": "0 kcal",
      "instructions": {
         "S1": "This is a test recipe step 1"
      },
      "steps": 1
    }
    
    NOTE: If THE ingredients OR mood IS NOT provided, RETURN an error message.
    {
      "error": "Please provide ingredients and mood"
    }
    

  `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GEMINI_API_KEY.trim()}`, // Ensure no spaces
                "HTTP-Referer": "https://nomix.app",
                "X-Title": "Nomix",
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    {
                        role: "user",
                        content: prompt,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter Error Details:", JSON.stringify(errorData, null, 2));
            throw new Error(errorData.error?.message || "Failed to generate recipe via OpenRouter");
        }

        const data = await response.json();
        const generatedText = data.choices?.[0]?.message?.content;

        if (!generatedText) {
            throw new Error("No recipe generated");
        }

        const cleanedText = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse JSON:", generatedText);
            throw new Error("Failed to parse AI response");
        }

    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
};
