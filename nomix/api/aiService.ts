export interface GeneratedRecipe {
    name: string;
    description: string;
    instructions: Record<string, string>;
    calories: string;
    steps: number;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_AI_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.AI_KEY;

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const generateRecipeWithAI = async (
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

const chatWithSupportAI = async (
    messages: { role: string; content: string }[],
    language: string = 'en'
): Promise<string> => {
    // Use EXPO_PUBLIC_AI_KEY directly as requested
    const apiKey = process.env.EXPO_PUBLIC_AI_KEY;

    console.log("Debug - Chat Support - Raw Env Key:", apiKey ? "Present" : "Missing");
    if (apiKey) console.log("Debug - Key Start:", apiKey.substring(0, 8));

    // User requested to comment out the strict check for now
    // if (!GEMINI_API_KEY) {
    //     throw new Error("API Key is missing.");
    // }

    const systemPrompt = `
    You are a helpful support assistant for the Nomix app. 
    Nomix is a recipe and mixology app.
    Your goal is to help users with app-related questions or general cooking/mixology advice.
    Be polite, concise, and helpful.
    Language: ${language === 'ar' ? 'Arabic' : 'English'}.

    INFORMATION ABOUT THE APP:

    1. **Navigation & Structure**:
       - The app has 4 main tabs at the bottom: Home, Categories, Recipes, and Profile.

    2. **Home Tab**:
       - Featured mixes and trending recipes.
       - Quick access to Categories.
       - **AI Generator Button**: Navigate here to create custom recipes using AI.

    3. **Profile Tab**:
       - View your profile details.
       - Access your **Favorites** (saved recipes).
       - Access **Settings** and **Help & Support**.

    4. **Settings (Profile > Settings)**:
       - **Edit Profile**: Change your name, avatar, or bio.
       - **Change Password**: Update your security credentials.
       - **Biometric Login**: Enable/disable Fingerprint or Face ID.
       - **Notifications**: Toggle push notifications on/off.
       - **App Sounds**: Toggle sound effects.
       - **Language**: Switch between English and Arabic.
       - **Delete Account**: Scroll to the VERY BOTTOM of the Settings page to find the "Delete Account" button.

    5. **Help & Support (Profile > Help)**:
       - **FAQ**: Frequently asked questions.
       - **Contact Support**: Email us directly.
       - **Live Chat**: You are here! (This AI assistant).

    6. **AI Generator (Home > AI Generator)**:
       - Enter ingredients you have.
       - Select a "Mood" (e.g., Party, Relaxed, Romantic).
       - The AI will generate a unique recipe for you.

    7. **Authentication**:
       - Login, Register, and Forgot Password options are available on the startup screens.

    If a user asks "How do I delete my account?", tell them:
    "Go to the Profile tab > Tap on 'Settings' > Scroll down to the very bottom of the page > Tap the red 'Delete Account' button."
    `;

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                // Using the env key directly
                "Authorization": `Bearer ${apiKey ? apiKey.trim() : ''}`,
                "HTTP-Referer": "https://nomix.app",
                "X-Title": "Nomix",
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    {
                        role: "system",
                        content: systemPrompt,
                    },
                    ...messages
                ],
                temperature: 0.7,
                max_tokens: 1000,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("OpenRouter Chat Error Data:", JSON.stringify(errorData, null, 2));
            // If it's the "User not found" error, it means the API key is invalid/revoked or belongs to a deleted account
            throw new Error(errorData.error?.message || "Failed to get response from support AI");
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "I'm sorry, I couldn't understand that.";

    } catch (error) {
        console.error("Support Chat Error:", error);
        throw error;
    }
};

export { generateRecipeWithAI, chatWithSupportAI };
