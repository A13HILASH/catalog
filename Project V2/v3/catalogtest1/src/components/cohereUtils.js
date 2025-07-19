import axios from 'axios';

export async function callCohere(message) {
  const fullPrompt = `You are BookPal, a helpful assistant for a book catalog application. Your primary function is to help users manage their book collection (add, update, delete, search). You should also be friendly and informative about your capabilities, and politely decline unrelated requests.

Your job is to understand user requests and return an array of strict JSON objects.
CRITICAL: ONLY return the JSON array and nothing else. Do NOT include any conversational text or explanations outside the JSON array.

IMPORTANT: Focus on book catalog operations. If a user mentions "update", "change", "modify" with book-related terms (title, author, genre, year), it should be classified as "update" intent, NOT "out_of_scope".

You can handle:
- Adding, updating, deleting, and searching books.
- Responding to greetings.
- Explaining your capabilities and the app's purpose.
- Indicating when a feature or query is outside your scope (weather, movies, jokes, etc.).

Prioritize "add" intent if book title and author are present.
Your output should always be an array of JSON objects like this:

{
  "intent": "add" | "update" | "delete" | "search" | "help" | "greeting" | "capability_query" | "out_of_scope",
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

// --- ADD EXAMPLES ---
Message: Add book titled "Sapiens" by Yuval Noah Harari published in 2011
Output: [{ "intent": "add", "data": { "title": "Sapiens", "author": "Yuval Noah Harari", "genre": null, "year": 2011, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book titled "Dune" by Frank Herbert published in 1965 of the genre Science Fiction
Output: [{ "intent": "add", "data": { "title": "Dune", "author": "Frank Herbert", "genre": "Science Fiction", "year": 1965, "query": null, "range": null, "fieldsToUpdate": null }}]

// --- UPDATE EXAMPLES ---
Message: Update genre of book by Robert C. Martin to Software
Output: [{ "intent": "update", "data": { "title": null, "author": "Robert C. Martin", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "genre": "Software" } }}]

Message: Update year of book by Robert C. Martin in Software genre to 2010
Output: [{ "intent": "update", "data": { "title": null, "author": "Robert C. Martin", "genre": "Software", "year": null, "query": null, "range": null, "fieldsToUpdate": { "year": 2010 } }}]

Message: Update year of "Clean Code" to 2010
Output: [{ "intent": "update", "data": { "title": "Clean Code", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "year": 2010 } }}]

Message: Change the title of book by Frank Herbert published in 1965 to "Dune Saga"
Output: [{ "intent": "update", "data": { "title": null, "author": "Frank Herbert", "genre": null, "year": 1965, "query": null, "range": null, "fieldsToUpdate": { "title": "Dune Saga" } }}]

Message: Change the genre of "Sapiens" to History
Output: [{ "intent": "update", "data": { "title": "Sapiens", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "genre": "History" } }}]

// --- DELETE EXAMPLES ---
User: Remove book in genre sci published in 1984
AI: [{"intent": "delete", "data": {"title": null, "author": null, "genre": "Sci", "year": 1984, "query": null, "range": null, "fieldsToUpdate": null}}]

User: Delete books by author A, author B, and author C
AI: [{"intent": "delete", "data": {"title": null, "author": "author A, author B, author C", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null}}]

User: Delete book titled "Neuromancer"
AI: [{"intent": "delete", "data": {"title": "Neuromancer", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null}}]

User: Delete books published between 1980 and 1990
AI: [{"intent": "delete", "data": {"title": null, "author": null, "genre": null, "year": null, "query": null, "range": {"after": 1980, "before": 1990}, "fieldsToUpdate": null}}]

Message: Delete "Sapiens"
Output: [{ "intent": "delete", "data": { "title": "Sapiens", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Remove the book by Frank Herbert
Output: [{ "intent": "delete", "data": { "title": null, "author": "Frank Herbert", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]


// --- SEARCH EXAMPLES ---
Message: Find books by Yuval Noah Harari
Output: [{ "intent": "search", "data": { "title": null, "author": "Yuval Noah Harari", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Search for science fiction books published after 2000
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": "Science Fiction", "year": null, "query": null, "range": { "after": 2000, "before": null }, "fieldsToUpdate": null }}]

// --- GREETING EXAMPLES ---
Message: Hi
Output: [{"intent": "greeting", "data": {"query": "hi"}}]

// --- CAPABILITY QUERY EXAMPLES ---
Message: What can you do?
Output: [{"intent": "capability_query", "data": {"query": "what can you do?"}}]

// --- OUT OF SCOPE EXAMPLES (ONLY for non-book related queries) ---
Message: What's the weather like today?
Output: [{"intent": "out_of_scope", "data": {"query": "what's the weather like today?"}}]
Message: Tell me a joke
Output: [{"intent": "out_of_scope", "data": {"query": "tell me a joke"}}]
Message: Can you help me find a movie?
Output: [{"intent": "out_of_scope", "data": {"query": "can you help me find a movie?"}}]

Remember: Book-related update/change/modify requests are ALWAYS "update" intent, never "out_of_scope"!

Message: ${message}
Output:`;

  try {
    const response = await axios.post(
      'https://api.cohere.ai/v1/generate',
      {
        prompt: fullPrompt,
        max_tokens: 400,
        temperature: 0.1,
        k: 0,
        p: 0.75,
        frequency_penalty: 0,
        presence_penalty: 0,
        stop_sequences: ['Message:', 'Output:', '\n\n'],
        return_likelihoods: 'NONE',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.REACT_APP_COHERE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let cohereOutput = response.data.generations[0].text.trim();
    console.log("Raw Cohere Output:", cohereOutput);

    // Find the first and last bracket to ensure only JSON is parsed
    const firstBracket = cohereOutput.indexOf('[');
    const lastBracket = cohereOutput.lastIndexOf(']');

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cohereOutput = cohereOutput.substring(firstBracket, lastBracket + 1);
    } else {
      console.warn("Cohere output does not contain a valid JSON array structure, falling back to keyword extraction:", cohereOutput);
      return extractIntentFromMessage(message);
    }

    console.log("Cleaned Cohere Output (for JSON parsing):", cohereOutput);

    // Attempt to parse as JSON
    try {
      const parsed = JSON.parse(cohereOutput);
      if (Array.isArray(parsed) && parsed.every(item => item.intent && item.data !== undefined)) {
       
        const corrected = parsed.map(item => {
          // If Cohere incorrectly classified a book update as out_of_scope, fix it
          if (item.intent === 'out_of_scope' && isBookUpdateRequest(message)) {
            console.log("Correcting misclassified update intent from out_of_scope");
            return extractIntentFromMessage(message)[0]; // Use fallback for update
          }
          return item;
        });
        return corrected;
      } else {
        console.warn("Cohere returned valid JSON but not in expected intent/data format, falling back to keyword extraction:", parsed);
        return extractIntentFromMessage(message);
      }
    } catch (jsonError) {
      console.warn("Cohere output is not valid JSON, falling back to keyword extraction:", cohereOutput, jsonError);
      return extractIntentFromMessage(message);
    }

  } catch (err) {
    console.error("Cohere API error:", {
      message: err.message,
      response: err.response?.data,
      stack: err.stack
    });
    return extractIntentFromMessage(message);
  }
}

// Helper function to detect if a message is clearly a book update request
function isBookUpdateRequest(message) {
  const lowerMessage = message.toLowerCase();
  const hasUpdateKeyword = lowerMessage.includes('update') || lowerMessage.includes('change') || lowerMessage.includes('modify');
  const hasBookContext = lowerMessage.includes('book') || lowerMessage.includes('title') || lowerMessage.includes('author') || lowerMessage.includes('genre') || lowerMessage.includes('year') || lowerMessage.includes('published');
  return hasUpdateKeyword && hasBookContext;
}

// Enhanced fallback function with better update intent detection
function extractIntentFromMessage(message) {
  const lowerMessage = message.toLowerCase();

  // Enhanced update detection
  if ((lowerMessage.includes('update') || lowerMessage.includes('change') || lowerMessage.includes('modify')) &&
      (lowerMessage.includes('book') || lowerMessage.includes('title') || lowerMessage.includes('author') || 
       lowerMessage.includes('genre') || lowerMessage.includes('year') || lowerMessage.includes('published'))) {
    
    // Try to extract update details
    let fieldsToUpdate = {};
    let title = null, author = null, genre = null, year = null;

    // Extract what to update
    if (lowerMessage.includes('title') && lowerMessage.includes(' to ')) {
      const titleMatch = message.match(/(?:title.*?to\s*["']?([^"']+)["']?)|(?:to\s*["']([^"']+)["'])/i);
      if (titleMatch) fieldsToUpdate.title = titleMatch[1] || titleMatch[2];
    }
    
    if (lowerMessage.includes('author') && lowerMessage.includes(' to ')) {
      const authorMatch = message.match(/author.*?to\s*["']?([^"']+)["']?/i);
      if (authorMatch) fieldsToUpdate.author = authorMatch[1];
    }
    
    if (lowerMessage.includes('genre') && lowerMessage.includes(' to ')) {
      const genreMatch = message.match(/genre.*?to\s*["']?([^"']+)["']?/i);
      if (genreMatch) fieldsToUpdate.genre = genreMatch[1];
    }
    
    if (lowerMessage.includes('year') && lowerMessage.includes(' to ')) {
      const yearMatch = message.match(/year.*?to\s*(\d{4})/i);
      if (yearMatch) fieldsToUpdate.year = parseInt(yearMatch[1]);
    }

    // Extract book identification criteria
    const titleQuoteMatch = message.match(/["']([^"']+)["']/);
    if (titleQuoteMatch) title = titleQuoteMatch[1];
    
    const authorMatch = message.match(/by\s+([^,\s]+(?:\s+[^,\s]+)*)/i);
    if (authorMatch) author = authorMatch[1];
    
    const genreMatch = message.match(/in\s+([^\s,]+(?:\s+[^\s,]+)*)\s+genre/i);
    if (genreMatch) genre = genreMatch[1];
    
    const yearMatch = message.match(/published\s+in\s+(\d{4})/i);
    if (yearMatch) year = parseInt(yearMatch[1]);

    return [{
      intent: 'update',
      data: {
        title,
        author,
        genre,
        year,
        query: null,
        range: null,
        fieldsToUpdate: Object.keys(fieldsToUpdate).length > 0 ? fieldsToUpdate : null
      }
    }];
  }

  // Other intent detection 
  if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
    return [{ intent: 'add', data: { query: message } }];
  } else if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    return [{ intent: 'delete', data: { query: message } }];
  } else if (lowerMessage.includes('search') || lowerMessage.includes('find') || lowerMessage.includes('list')) {
    return [{ intent: 'search', data: { query: message } }];
  }

  // Conversational intents
  if (lowerMessage.includes('hi') || lowerMessage.includes('hello') || lowerMessage.includes('good morning') || lowerMessage.includes('good afternoon') || lowerMessage.includes('good evening') || lowerMessage.includes('hey')) {
    return [{ intent: 'greeting', data: { query: message } }];
  }
  if (lowerMessage.includes('what can you do') || lowerMessage.includes('what is this app about') || lowerMessage.includes('how to use this app') || lowerMessage.includes('app about') || lowerMessage.includes('your functions')) {
    return [{ intent: 'capability_query', data: { query: message } }];
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return [{ intent: 'help', data: { query: message } }];
  }

  // Out of scope for non-book topics
  if (lowerMessage.includes('weather') || lowerMessage.includes('joke') || lowerMessage.includes('movie') || lowerMessage.includes('news')) {
    return [{ intent: 'out_of_scope', data: { query: message } }];
  }

  // Default to unrecognized if no specific intent keywords found
  return [{ intent: 'unrecognized', data: { query: message } }];
}