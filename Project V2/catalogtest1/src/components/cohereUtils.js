
import axios from 'axios';

export async function callCohere(message) {
  // IMPORTANT: Ensure this prompt is kept up-to-date with your desired output structure and examples.
  // The examples guide Cohere's response format.
  const fullPrompt = `You are a helpful assistant that returns JSON for book catalog operations. Your job is to extract the user's intent (add, update, delete, search, or help) and return an array of strict JSON objects like this:

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

// --- ADD EXAMPLES ---
Message: Add book titled "Sapiens" by Yuval Noah Harari published in 2011
Output: [{ "intent": "add", "data": { "title": "Sapiens", "author": "Yuval Noah Harari", "genre": null, "year": 2011, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book titled "Dune" by Frank Herbert published in 1965 of the genre Science Fiction
Output: [{ "intent": "add", "data": { "title": "Dune", "author": "Frank Herbert", "genre": "Science Fiction", "year": 1965, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book "Clean Code" by Robert C. Martin in genre Programming published in 2008
Output: [{ "intent": "add", "data": { "title": "Clean Code", "author": "Robert C. Martin", "genre": "Programming", "year": 2008, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book by George Orwell titled "1984" published in 1949 of genre sci
Output: [{ "intent": "add", "data": { "title": "1984", "author": "George Orwell", "genre": "sci", "year": 1949, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book titled "Neuromancer" by William Gibson published in 1984 of genre Cyberpunk
Output: [{ "intent": "add", "data": { "title": "Neuromancer", "author": "William Gibson", "genre": "Cyberpunk", "year": 1984, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book titled "Dune"
Output: [{ "intent": "add", "data": { "title": "Dune", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book published in 1990
Output: [{ "intent": "add", "data": { "title": null, "author": null, "genre": null, "year": 1990, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book of genre Cyberpunk
Output: [{ "intent": "add", "data": { "title": null, "author": null, "genre": "Cyberpunk", "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Add book by Isaac Asimov published in 1951
Output: [{ "intent": "add", "data": { "title": null, "author": "Isaac Asimov", "genre": null, "year": 1951, "query": null, "range": null, "fieldsToUpdate": null }}]

// --- UPDATE EXAMPLES ---
Message: Change the title of "Old Book" to "New Book"
Output: [{ "intent": "update", "data": { "title": "Old Book", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "title": "New Book" }}}]

Message: Update the genre of "Sapiens" to History and its year to 2015
Output: [{ "intent": "update", "data": { "title": "Sapiens", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "genre": "History", "year": 2015 }}}]
// IMPORTANT: For 'update' intent, 'data' fields (title, author, genre, year) should represent the CURRENT identifying properties of the book, not the new values. New values go into 'fieldsToUpdate'.

Message: Update genre of "Neuromancer" published in 1984 to Sci-Fi
Output: [{ "intent": "update", "data": { "title": "Neuromancer", "author": null, "genre": null, "year": 1984, "query": null, "range": null, "fieldsToUpdate": { "genre": "Sci-Fi" }}}]

Message: Update year of book by Robert C. Martin in Software genre to 2010
Output: [{ "intent": "update", "data": { "title": null, "author": "Robert C. Martin", "genre": "Software", "year": null, "query": null, "range": null, "fieldsToUpdate": { "year": 2010 }}}]

Message: Change the title of book by Frank Herbert published in 1965 to "Dune Saga"
Output: [{ "intent": "update", "data": { "title": null, "author": "Frank Herbert", "genre": null, "year": 1965, "query": null, "range": null, "fieldsToUpdate": { "title": "Dune Saga" }}}]

Message: Update year of "Clean Code" to 2010
Output: [{ "intent": "update", "data": { "title": "Clean Code", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "year": 2010 }}}]

Message: Update author of "Sapiens" to Yuval Harari
Output: [{ "intent": "update", "data": { "title": "Sapiens", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": { "author": "Yuval Harari" }}}]

Message: Change title of book Clean Code by Robert C. Martin in Software genre to test4
Output: [{ "intent": "update", "data": { "title": "Clean Code", "author": "Robert C. Martin", "genre": "Software", "year": null, "query": null, "range": null, "fieldsToUpdate": { "title": "test4" }}}]

// --- DELETE EXAMPLES ---
Message: Delete book of genre Cyberpunk
Output: [{ "intent": "delete", "data": { "title": null, "author": null, "genre": "Cyberpunk", "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Remove book in genre Cyberpunk published in 1984
Output: [{ "intent": "delete", "data": { "title": null, "author": null, "genre": "Cyberpunk", "year": 1984, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Delete book titled "Clean Code" by Robert C. Martin
Output: [{ "intent": "delete", "data": { "title": "Clean Code", "author": "Robert C. Martin", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Delete book titled "Sapiens" by Yuval Noah Harari published in 2011
Output: [{ "intent": "delete", "data": { "title": "Sapiens", "author": "Yuval Noah Harari", "genre": null, "year": 2011, "query": null, "range": null, "fieldsToUpdate": null }}]

// --- SEARCH EXAMPLES ---
Message: Find books published after 2000
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": null, "range": { "after": 2000, "before": null }, "fieldsToUpdate": null }}]

Message: Search books with title containing "Code"
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "Code", "range": null, "fieldsToUpdate": null }}]

Message: What is the genre of "Dune"?
Output: [{ "intent": "search", "data": { "title": "Dune", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Tell me about "Sapiens"
Output: [{ "intent": "search", "data": { "title": "Sapiens", "author": null, "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Find books by t1 and frank herbert
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "t1,frank herbert", "range": null, "fieldsToUpdate": null }}]

Message: Find books by frank herbert, Robert C. Martin and William Gibson
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "frank herbert,Robert C.Martin,William Gibson", "range": null, "fieldsToUpdate": null }}]

Message: Search for books by Frank Herbert
Output: [{"intent": "search", "data": {"title": null, "author": "Frank Herbert", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null}}]

Message: Search books with title containing clean
Output: [{"intent": "search", "data": {"title": null, "author": null, "genre": null, "year": null, "query": "clean", "range": null, "fieldsToUpdate": null}}]

Message: Find books in genre Science Fiction
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": "Science Fiction", "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Find books after 1950 and before 2010
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": null, "range": { "after": 1950, "before": 2010 }, "fieldsToUpdate": null }}]

Message: List all books
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "all", "range": null, "fieldsToUpdate": null }}]

Message: Search for Programming books published after 2000
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": "Programming", "year": null, "query": null, "range": { "after": 2000, "before": null }, "fieldsToUpdate": null }}]

Message: Search for books by author Martin
Output: [{ "intent": "search", "data": { "title": null, "author": "Martin", "genre": null, "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Find books by Robert C. Martin and William Gibson
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "Robert C. Martin,William Gibson", "range": null, "fieldsToUpdate": null }}]

Message: Find books by Robert C. Martin in genre Software
Output: [{ "intent": "search", "data": { "title": null, "author": "Robert C. Martin", "genre": "Software", "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Show software books published after 2000
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": "Software", "year": null, "query": null, "range": { "after": 2000, "before": null }, "fieldsToUpdate": null }}]

Message: List books by George Orwell published before 1950
Output: [{ "intent": "search", "data": { "title": null, "author": "George Orwell", "genre": null, "year": null, "query": null, "range": { "after": null, "before": 1950 }, "fieldsToUpdate": null }}]

Message: Find authors with genre Software
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": "Software", "year": null, "query": null, "range": null, "fieldsToUpdate": null }}]

Message: Find book having Eighty-Four in its title
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "Eighty-Four", "range": null, "fieldsToUpdate": null }}]

Message: Show me books by Yuval Noah Harari and Robert C. Martin and William Gibson
Output: [{ "intent": "search", "data": { "title": null, "author": null, "genre": null, "year": null, "query": "Yuval Noah Harari,Robert C. Martin,William Gibson", "range": null, "fieldsToUpdate": null }}]


IMPORTANT: Return ONLY valid JSON array. No extra text, no code blocks, no explanations.

User message: "${message}"
Response:`;

  try {
    console.log('Making API call to Cohere...');
    const response = await axios.post(
      'https://api.cohere.ai/v1/chat',
      {
        message: fullPrompt,
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

    console.log('Raw Cohere API response:', response.data);

    let responseText = response.data.text;
    let parsed;

    try {
      let cleanedJsonString = responseText;

      // Find the first '[' and the last ']' and take everything in between.
      //  strip surrounding junk like extra ']]' or markdown.
      const firstBracket = cleanedJsonString.indexOf('[');
      const lastBracket = cleanedJsonString.lastIndexOf(']');

      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
          cleanedJsonString = cleanedJsonString.substring(firstBracket, lastBracket + 1);
      } else {
          // If it doesn't look like an array, try to find a single object and wrap it.
          const firstBrace = cleanedJsonString.indexOf('{');
          const lastBrace = cleanedJsonString.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
              cleanedJsonString = `[${cleanedJsonString.substring(firstBrace, lastBrace + 1)}]`;
          }
      }

      // Remove any markdown code block indicators that might still be present
      cleanedJsonString = cleanedJsonString.replace(/```json\n?|```/g, '').trim();

      console.log('Cleaned Cohere response text before final parse:', cleanedJsonString); // Debug log

      parsed = JSON.parse(cleanedJsonString);

      // Ensure it's an array (redundant but safe after wrapping single objects)
      if (!Array.isArray(parsed)) {
        parsed = [parsed];
      }

      // Validate the structure
      for (const item of parsed) {
        if (!item.intent || !item.data) {
          throw new Error('Invalid response structure');
        }
      }

      return parsed;

    } catch (parseError) {
      console.error("Failed to parse Cohere response. Attempting fallback extraction from raw text.", responseText);
      console.error("Parse error:", parseError);

      const fallbackIntent = extractIntentFromMessage(message);
      let fallbackData = {
          title: null, author: null, genre: null, year: null,
          query: message, // Keep original message as query fallback
          range: null, fieldsToUpdate: null
      };

      // Helper to extract matches, handling escaped quotes and trimming
      const getMatch = (regex) => {
          const match = responseText.match(regex);
          return match && match[1] ? match[1].replace(/\\"/g, '"').trim() : null;
      };

      // Direct data fields extraction
      fallbackData.title = getMatch(/"title"\s*:\s*"(.*?)(?<!\\)"/);
      fallbackData.author = getMatch(/"author"\s*:\s*"(.*?)(?<!\\)"/);
      fallbackData.genre = getMatch(/"genre"\s*:\s*"(.*?)(?<!\\)"/);
      const yearStr = getMatch(/"year"\s*:\s*(\d+)/); // Match digits for year
      if (yearStr) {
          fallbackData.year = parseInt(yearStr);
      }

      // Extract fieldsToUpdate as a JSON string, then parse it separately
      // Use /s for dotall to match across newlines within the object
      const fieldsToUpdateJsonString = getMatch(/"fieldsToUpdate"\s*:\s*(\{.*?\})/s); 
      if (fieldsToUpdateJsonString) {
          try {
              fallbackData.fieldsToUpdate = JSON.parse(fieldsToUpdateJsonString.replace(/\\"/g, '"'));
          } catch (e) {
              console.warn("Could not parse fieldsToUpdate from fallback regex:", e);
              fallbackData.fieldsToUpdate = null;
          }
      }

      // Query and Range (if not already set by direct fields, or if specific to query/range)
      const queryMatch = getMatch(/"query"\s*:\s*"(.*?)(?<!\\)"/);
      if (queryMatch) fallbackData.query = queryMatch;

      const rangeAfterMatch = getMatch(/"range"\s*:\s*\{\s*"after"\s*:\s*(\d+)/);
      const rangeBeforeMatch = getMatch(/"range"\s*:\s*\{\s*"after":\s*\d+,\s*"before"\s*:\s*(\d+)/) || getMatch(/"range"\s*:\s*\{\s*"before"\s*:\s*(\d+)/);
      if (rangeAfterMatch || rangeBeforeMatch) {
          fallbackData.range = {
              after: rangeAfterMatch ? parseInt(rangeAfterMatch) : null,
              before: rangeBeforeMatch ? parseInt(rangeBeforeMatch) : null,
          };
      }

      if (fallbackData.title && fallbackData.query === message) { 
          fallbackData.query = null; // Clear generic query
      }
      if (fallbackData.author && fallbackData.query === message) {
          fallbackData.query = null;
      }
      
      return [{ intent: fallbackIntent, data: fallbackData }];
    }

  } catch (err) {
    console.error("Cohere API error:", {
      message: err.message,
      response: err.response?.data,
      stack: err.stack
    });
    // Re-throw the error or return a user-friendly message
    throw new Error("Failed to process request. Please try again.");
  }
}

// Fallback function to extract basic intent if Cohere's JSON is totally unparseable
function extractIntentFromMessage(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
    return 'add';
  } else if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    return 'delete';
  } else if (lowerMessage.includes('update') || lowerMessage.includes('change') || lowerMessage.includes('modify')) {
    return 'update';
  } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
    return 'help';
  } else {
    // Default to search if no specific intent keywords are found
    return 'search';
  }
}