// src/ai/utils/llmClients.js
// Centralized API calls for different providers

/**
 * Together AI
 * Docs: https://docs.together.ai/docs/inference
 */
export async function callTogetherAI(prompt, model = "deepseek-ai/DeepSeek-R1") {
    console.log("🔵 Together AI Request:");
    console.log("- Model:", model);
    console.log("- API Key exists:", !!process.env.REACT_APP_TOGETHER_API_KEY);
    console.log("- Prompt length:", prompt.length);
  
    try {
      const resp = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 2000,
          temperature: 0.7,
        }),
      });
  
      console.log("🔵 Together AI Response Status:", resp.status, resp.statusText);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("🔵 Together AI Error Response:", errorText);
        throw new Error(`Together AI failed: ${resp.statusText} - ${errorText}`);
      }
      
      const data = await resp.json();
      console.log("🔵 Together AI Success Response:", data);
      
      const content = data.choices?.[0]?.message?.content || "";
      console.log("🔵 Together AI Content Length:", content.length);
      return content;
    } catch (error) {
      console.error("🔵 Together AI Catch Error:", error);
      throw error;
    }
  }
  
  /**
   * Cohere
   * Updated to use the correct v2 endpoint and format
   */
  export async function callCohere(prompt, model = "command-r-plus") {
    console.log("🟡 Cohere Request:");
    console.log("- Model:", model);
    console.log("- API Key exists:", !!process.env.REACT_APP_COHERE_API_KEY);
    console.log("- Prompt length:", prompt.length);
  
    try {
      // Updated to use v2 chat endpoint with correct format
      const resp = await fetch("https://api.cohere.com/v2/chat", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 200,
          temperature: 0.7,
        }),
      });
  
      console.log("🟡 Cohere Response Status:", resp.status, resp.statusText);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("🟡 Cohere Error Response:", errorText);
        throw new Error(`Cohere failed: ${resp.statusText} - ${errorText}`);
      }
      
      const data = await resp.json();
      console.log("🟡 Cohere Success Response:", data);
      
      // Updated to match v2 response format
      const content = data.message?.content?.[0]?.text || "";
      console.log("🟡 Cohere Content Length:", content.length);
      return content;
    } catch (error) {
      console.error("🟡 Cohere Catch Error:", error);
      throw error;
    }
  }
  
  /**
   * OpenRouter
   * Docs: https://openrouter.ai/docs
   */
  export async function callOpenRouter(prompt, model = "deepseek/deepseek-chat-v3-0324") {
    console.log("🟠 OpenRouter Request:");
    console.log("- Model:", model);
    console.log("- API Key exists:", !!process.env.REACT_APP_OPENROUTER_API_KEY);
    console.log("- API Key preview:", process.env.REACT_APP_OPENROUTER_API_KEY?.substring(0, 10) + "...");
    console.log("- Prompt length:", prompt.length);
    console.log("- Origin:", window.location.origin);
  
    try {
      const requestBody = {
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.7,
      };
      
      console.log("🟠 OpenRouter Request Body:", JSON.stringify(requestBody, null, 2));
  
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.REACT_APP_OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "AI Book Generator",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
  
      console.log("🟠 OpenRouter Response Status:", resp.status, resp.statusText);
      console.log("🟠 OpenRouter Response Headers:", Object.fromEntries(resp.headers.entries()));
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("🟠 OpenRouter Error Response:", errorText);
        
        // Specific debugging for 401 errors
        if (resp.status === 401) {
          console.error("🟠 401 Debugging:");
          console.error("- Check if REACT_APP_OPENROUTER_API_KEY is set in .env");
          console.error("- Verify API key is valid on OpenRouter dashboard");
          console.error("- Ensure no extra spaces/newlines in API key");
          console.error("- Try regenerating the API key");
        }
        
        throw new Error(`OpenRouter failed: ${resp.statusText} - ${errorText}`);
      }
      
      const data = await resp.json();
      console.log("🟠 OpenRouter Success Response:", data);
      
      const content = data.choices?.[0]?.message?.content || "";
      console.log("🟠 OpenRouter Content Length:", content.length);
      return content;
    } catch (error) {
      console.error("🟠 OpenRouter Catch Error:", error);
      throw error;
    }
  }