import axios from 'axios';

export async function callCohere(message) {
  const prompt = `
You are a helpful assistant that returns JSON for book catalog operations.
Your job is to extract the user's intent (add, update, delete, search, or help)
and return a strict JSON object like this:

{
  "intent": "add" | "update" | "delete" | "search" | "help",
  "data": {
    "title": string | null,
    "author": string | null,
    "year": number | null,
    "query": string | null,
    "range": { "after": number, "before": number } | null,
    "fieldsToUpdate": { "title"?: string, "author"?: string, "year"?: number } | null
  }
}

### Examples:

Message: Add book titled "Sapiens" by Yuval Noah Harari published in 2011  
Output:
{
  "intent": "add",
  "data": {
    "title": "Sapiens",
    "author": "Yuval Noah Harari",
    "year": 2011,
    "query": null,
    "range": null,
    "fieldsToUpdate": null
  }
}

Message: How to add a book?  
Output:
{
  "intent": "help",
  "data": {
    "title": null,
    "author": null,
    "year": null,
    "query": "add",
    "range": null,
    "fieldsToUpdate": null
  }
}

Message: Delete book by author Orwell  
Output:
{
  "intent": "delete",
  "data": {
    "title": null,
    "author": "Orwell",
    "year": null,
    "query": null,
    "range": null,
    "fieldsToUpdate": null
  }
}

Message: ${message}
`;


  try {
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        message,            //  user message goes here
        preamble: prompt,   // system prompt
        model: 'command-r-plus',
        temperature: 0.3,
        max_tokens: 300,
        chat_history: [],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // parsing logic
    let parsed;
    try {
      const match = response.data.text.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        parsed = JSON.parse(response.data.text);
      }
      return parsed;
    } catch (e) {
      console.error("Cohere response (unparsed):", response.data.text);
      throw new Error("Could not parse Cohere response");
    }

  } catch (err) {
    console.error("Cohere API error:", err?.response?.data || err);
    throw err;
  }
}
