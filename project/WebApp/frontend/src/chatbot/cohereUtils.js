// cohereUtils.js
import axios from 'axios';

export async function callCohere(message) {
  const prompt = `
You are a helpful assistant that returns JSON for book catalog operations. Your job is to extract the user's intent (add, update, delete, search, or help) and return an array of strict JSON objects like this:

{
  "intent": "add" | "update" | "delete" | "search" | "help",
  "data": {
    "title": string | null,
    "author": string | null,
    "genre": string | null,
    "year": number | null,
    "query": string | null,
    "range": { "after": number, "before": number } | null,
    "fieldsToUpdate": {
      "title"?: string,
      "author"?: string,
      "genre"?: string,
      "year"?: number
    } | null
  }
}

### Examples:

Message: Add book titled "Sapiens" by Yuval Noah Harari published in 2011 of genre History
Output: [{ "intent": "add", "data": { "title": "Sapiens", "author": "Yuval Noah Harari", "genre": "History", "year": 2011, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Delete book of genre Cyberpunk
Output: [{ "intent": "delete", "data": { "title": null, "author": null, "genre": "Cyberpunk", "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add "Dune" by Frank Herbert in 1965. Also delete book titled "Neuromancer".
Output: [
  { "intent": "add", "data": { "title": "Dune", "author": "Frank Herbert", "genre": null, "year": 1965, "query": null, "range": null, "fieldsToUpdate": null }},
  { "intent": "delete", "data": { "title": "Neuromancer", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}
]

Message: ${message}
`;

  try {
    console.log('Making API call to Cohere...'); // Debug log
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        message,
        preamble: prompt,
        model: 'command-r-plus',
        temperature: 0.3,
        max_tokens: 400,
        chat_history: [],
          
        },
      {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Raw Cohere API response:', response.data); // Debug log
    let parsed;
    try {
      const match = response.data.text.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        parsed = JSON.parse(response.data.text);
      }
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      console.error("Failed to parse Cohere response:", response.data.text);
      throw new Error("Could not parse Cohere response");
    }

  } catch (err) {
    console.error("Cohere API error:", {
      message: err.message,
      response: err.response?.data,
      stack: err.stack
    });
    throw err;
  }
}

