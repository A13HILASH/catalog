import axios from 'axios';

// Book management API endpoints
const API_BASE = "http://localhost:4540/api/books";

// Book API functions
export const getBooks = () => axios.get(API_BASE);
export const getBook = (id) => axios.get(`${API_BASE}/${id}`);
export const addBook = (book) => axios.post(API_BASE, book);
export const updateBook = (id, book) => axios.put(`${API_BASE}/${id}`, book);
export const deleteBook = (id) => axios.delete(`${API_BASE}/${id}`);

// Cohere API configuration
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';
const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;

// New, simplified system prompt for AI-driven book management
// This prompt strictly enforces the JSON output for the 'add' intent.
// CRITICAL: This prompt is updated to ensure the model only returns JSON for the LATEST command.
const BOOK_MANAGEMENT_PROMPT = `
You are an AI assistant for book catalog management. Your sole purpose is to convert the LATEST natural language request into a single structured JSON format.

CRITICAL INSTRUCTIONS:
1. You MUST respond ONLY with a single JSON object. No other text, explanations, or conversation.
2. The JSON object must have a top-level "intent" key and other keys based on the intent.
3. You MUST NOT carry over information or parameters from previous requests. Base your response solely on the latest user command.

For the "list_all_books" intent, your JSON must follow this structure:
{
  "intent": "list_all_books"
}

For the "add" intent, your JSON must follow this structure:
{
  "intent": "add",
  "bookData": {
    "title": "Book Title",
    "authors": "Author 1, Author 2",
    "genres": "Genre 1, Genre 2",
    "moods": "mood 1, mood 2",
    "year": 2024,
    "coverUrl": "https://example.com/cover.jpg",
    "openLibraryId": "OL123456"
  }
}

For the "update" intent, your JSON must follow this structure:
{
  "intent": "update",
  "searchCriteria": {
    "title": "Book Title"
  },
  "updates": {
    "authors": "New Author",
    "year": 2024
  }
}

For the "delete" intent, your JSON must follow this structure. You must provide a search criteria.
{
  "intent": "delete",
  "searchCriteria": {
    "title": "Book Title"
  }
}

For the "search" intent, your JSON must follow this flexible structure. Only include the fields that are specified by the user. If the user asks for multiple authors or genres, represent them as a comma-separated string.
{
  "intent": "search",
  "parameters": {
    "title": "partial title",
    "authors": "Author1, Author2",
    "genres": "Genre1, Genre2",
    "yearAfter": 2000,
    "yearBefore": 2020
  }
}

For the "book_help" intent (when users ask for help, assistance, general questions about the app, greetings, thanks, or other conversational messages), your JSON must follow this structure:
{
  "intent": "book_help",
  "query": "user's original question or message"
}

You should extract as much information as possible from the user's request. If a field is not provided, do not include it in the JSON object. Authors, genres, and moods should be comma-separated strings. The year should be a number.

EXAMPLE 1 (LIST ALL BOOKS):
User: List all books
Your response MUST be:
{
  "intent": "list_all_books"
}

EXAMPLE 2 (ADD):
User: Add a book called 'Dune' by Frank Herbert, published in 1965, genre Science Fiction
Your response MUST be:
{
  "intent": "add",
  "bookData": {
    "title": "Dune",
    "authors": "Frank Herbert",
    "genres": "Science Fiction",
    "year": 1965
  }
}

EXAMPLE 3 (UPDATE):
User: Find the book "Neuromancer" published in 1984 and update its genre to "Sci-Fi"
Your response MUST be:
{
  "intent": "update",
  "searchCriteria": {
    "title": "Neuromancer",
    "year": 1984
  },
  "updates": {
    "genres": "Sci-Fi"
  }
}

EXAMPLE 4 (DELETE):
User: Delete the book named 'Dune'
Your response MUST be:
{
  "intent": "delete",
  "searchCriteria": {
    "title": "Dune"
  }
}

EXAMPLE 5 (COMPLEX SEARCH):
User: Find sci-fi books by Arthur C. Clarke after 1960
Your response MUST be:
{
  "intent": "search",
  "parameters": {
    "genres": "Sci-Fi",
    "authors": "Arthur C. Clarke",
    "yearAfter": 1960
  }
}

EXAMPLE 6 (HELP/ASSISTANCE/CONVERSATION):
User: What can you do?
Your response MUST be:
{
  "intent": "book_help",
  "query": "What can you do?"
}

User: Hello
Your response MUST be:
{
  "intent": "book_help",
  "query": "Hello"
}

User: Thank you
Your response MUST be:
{
  "intent": "book_help",
  "query": "Thank you"
}

User: How do I add a book?
Your response MUST be:
{
  "intent": "book_help",
  "query": "How do I add a book?"
}

User: Hi there!
Your response MUST be:
{
  "intent": "book_help",
  "query": "Hi there!"
}

Remember: ONLY respond with the JSON object for the LATEST user command.
`;

const GENERAL_CONVERSATION_PROMPT = `You are a friendly and helpful AI assistant. Engage in natural conversations on any topic. Be informative, curious, and supportive. You can discuss a wide range of subjects including science, history, culture, technology, and more. Keep conversations engaging and provide thoughtful responses.`;

// New function to handle execution based on the new JSON format
export const executeBookOperation = async (operation) => {
  const { intent, bookData, searchCriteria, updates, parameters, query } = operation;

  try {
    switch (intent) {
      case 'add': {
        // Log the book data to be added for debugging
        console.log("Attempting to add book with data:", bookData);

        // Fetch all existing books to check for duplicates
        const existingBooksResponse = await getBooks();
        const existingBooks = existingBooksResponse.data;

        // Check if a book with the same title, authors, genres, and year already exists
        const isDuplicate = existingBooks.some(book => {
          return book.title === bookData.title &&
                 book.authors === bookData.authors &&
                 book.genres === bookData.genres &&
                 book.year === bookData.year;
        });

        if (isDuplicate) {
          return {
            success: false,
            message: `Book "${bookData.title}" by ${bookData.authors} (${bookData.year}) already exists in the catalog.`
          };
        }

        // If no duplicate is found, proceed with adding the book
        const addResponse = await addBook(bookData);

        return {
          success: true,
          message: `Book successfully added ✅\n\n**Book Details:**\n${formatBookDetails(addResponse.data)}`
        };
      }
      
      case 'update': {
        console.log("Attempting to update book with search criteria:", searchCriteria, "and updates:", updates);
        const allBooksResponse = await getBooks();
        const allBooks = allBooksResponse.data;

        // Find all books that match the search criteria
        const matchingBooks = allBooks.filter(book => {
          // Check if every criteria key/value pair matches the book
          return Object.keys(searchCriteria).every(key => {
            return book[key] === searchCriteria[key];
          });
        });

        if (matchingBooks.length === 0) {
          return {
            success: false,
            message: "No book found matching the provided criteria. Please check the title or other details."
          };
        } else if (matchingBooks.length > 1) {
          const bookList = formatBookList(matchingBooks);
          return {
            success: false,
            message: `Found multiple books matching your criteria. Please provide more specific information to select a single book.\n\nMatching books:\n\n${bookList}`
          };
        } else {
          // Exactly one book found, proceed with the update
          const bookToUpdate = matchingBooks[0];
          await updateBook(bookToUpdate.id, { ...bookToUpdate, ...updates });

          // Construct the full updated book object by merging the old and new data
          const finalUpdatedBook = { ...bookToUpdate, ...updates };

          // Build the detailed updates message
          const updatesList = Object.keys(updates).map(key => {
            // Capitalize the first letter of the key for display
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            return `${formattedKey}: ${updates[key]}`;
          }).join('\n');

          const successMessage = 
            `Book "${finalUpdatedBook.title}" successfully updated ✅\n` +
            `Updates\n` +
            `${updatesList}\n` +
            `\n` +
            `**Updated Book Details:**\n` +
            `${formatBookDetails(finalUpdatedBook)}`;

          return {
            success: true,
            message: successMessage
          };
        }
      }

      case 'delete': {
        console.log("Attempting to delete book with search criteria:", searchCriteria);
        const allBooksResponse = await getBooks();
        const allBooks = allBooksResponse.data;

        // Find all books that match the search criteria
        const matchingBooks = allBooks.filter(book => {
          // Check if every criteria key/value pair matches the book
          return Object.keys(searchCriteria).every(key => {
            return book[key] === searchCriteria[key];
          });
        });

        if (matchingBooks.length === 0) {
          return {
            success: false,
            message: "No book found matching the provided criteria. Deletion canceled."
          };
        } else if (matchingBooks.length > 1) {
          const bookList = formatBookList(matchingBooks);
          return {
            success: false,
            message: `Found multiple books matching your criteria. Please provide more specific information to select a single book for deletion.\n\nMatching books:\n\n${bookList}`
          };
        } else {
          // Exactly one book found, now we need confirmation
          const bookToDelete = matchingBooks[0];
          await deleteBook(bookToDelete.id);
          return {
            success: true,
            message: `📚 "${bookToDelete.title}" by ${bookToDelete.authors} has been successfully deleted. ✅`
          };
        }
      }

      case 'search': {
        console.log("Attempting to search with parameters:", parameters);
        const allBooksForSearch = (await getBooks()).data;
        
        const filteredBooks = allBooksForSearch.filter(book => {
          // A book must match all provided parameters to be included in the search results
          let matches = true;

          // Search by title (partial match, case-insensitive)
          if (parameters.title) {
            matches = matches && book.title.toLowerCase().includes(parameters.title.toLowerCase());
          }

          // Search by authors (one or more authors, case-insensitive, now with partial match)
          if (parameters.authors) {
            const searchAuthors = parameters.authors.split(',').map(a => a.trim().toLowerCase());
            const bookAuthors = book.authors.split(',').map(a => a.trim().toLowerCase());
            // This is the updated logic to allow partial author name searching
            const authorMatch = searchAuthors.some(searchAuthor => 
              bookAuthors.some(bookAuthor => bookAuthor.includes(searchAuthor))
            );
            matches = matches && authorMatch;
          }

          // Search by genres (one or more genres, case-insensitive)
          if (parameters.genres) {
            const searchGenres = parameters.genres.split(',').map(g => g.trim().toLowerCase());
            const bookGenres = book.genres.split(',').map(g => g.trim().toLowerCase());
            const genreMatch = searchGenres.some(searchGenre => bookGenres.includes(searchGenre));
            matches = matches && genreMatch;
          }

          // Search by year range
          if (parameters.yearAfter) {
            matches = matches && (book.year >= parameters.yearAfter);
          }
          if (parameters.yearBefore) {
            matches = matches && (book.year <= parameters.yearBefore);
          }
          
          return matches;
        });

        const formattedResults = formatBookList(filteredBooks);
        return {
          success: true,
          message: `**Search Results:**\n\n${formattedResults}`
        };
      }

      case 'list_all_books': {
        console.log("Attempting to list all books.");
        const allBooks = (await getBooks()).data;
        const formattedAllBooks = formatBookList(allBooks);
        return {
          success: true,
          message: `**All Books:**\n\n${formattedAllBooks}`
        };
      }

      case 'book_help': {
        
        console.log("Handling book help/conversation request:", operation.query);
        
        const userQuery = operation.query.toLowerCase();
        let contextualPrompt;
        
        // Determine the type of request and provide appropriate context
        if (userQuery.includes('hello') || userQuery.includes('hi') || userQuery.includes('hey')) {
          contextualPrompt = `The user greeted you with: "${operation.query}". Respond warmly and briefly introduce yourself as their book catalog management assistant. Mention that you can help them add, search, update, delete, and manage their books using natural language.`;
        } else if (userQuery.includes('thank') || userQuery.includes('thanks')) {
          contextualPrompt = `The user thanked you with: "${operation.query}". Respond politely and let them know you're happy to help with their book catalog management needs.`;
        } else if (userQuery.includes('bye') || userQuery.includes('goodbye') || userQuery.includes('see you')) {
          contextualPrompt = `The user said goodbye with: "${operation.query}". Respond warmly and let them know you'll be here whenever they need help managing their book catalog.`;
        } else {
          contextualPrompt = `You are a helpful assistant for a book catalog management system. The user asked: "${operation.query}". 
          
          Please provide a friendly, informative response about the book management system. You can help with:
          - Adding books: Users can say things like "Add Dune by Frank Herbert" or "Add a book called '1984' by George Orwell published in 1949"
          - Searching books: Users can search by title, author, genre, or year ranges like "Find sci-fi books" or "Show books by Stephen King"
          - Updating books: Users can update book details like "Update the genre of Dune to Science Fiction"
          - Deleting books: Users can remove books like "Delete the book Dune"
          - Listing all books: Users can see all books with "List all books" or "Show me all books"
          
          Keep your response helpful, friendly, and focused on book management features.`;
        }
        
        // Call Cohere API in general conversation mode for help/conversation
        const helpResponse = await callCohereAPI(
          contextualPrompt,
          [], 
          'general'
        );
        
        return {
          success: true,
          message: helpResponse
        };
      }

      default:
        return {
          success: false,
          message: "Sorry, I don't know how to handle that request yet. I can only 'add', 'update', 'delete', 'search', and 'list all books' at the moment."
        };
    }
  } catch (error) {
    console.error('Error executing book operation:', error);
    return {
      success: false,
      message: `An error occurred while processing your request: ${error.message}`
    };
  }
};


// Function to call Cohere API
export const callCohereAPI = async (message, conversationHistory = [], mode = 'general') => {
  try {
    const systemPrompt = mode === 'book_management' ? BOOK_MANAGEMENT_PROMPT : GENERAL_CONVERSATION_PROMPT;

    // Cohere's payload structure with new parameters
    const payload = {
      model: 'command-r-plus', // Specify the model for the API call
      chat_history: conversationHistory,
      message: message,
      prompt_truncation: "AUTO",
      connectors: [{ "id": "web-search" }], // Example connector, can be removed if not needed
      preamble: systemPrompt, // Use preamble for the system prompt
      temperature: 0.1, // Lower temperature for more consistent structured responses
      max_tokens: 300 // Set a token limit for the response
    };

    const response = await axios.post(COHERE_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    // Log the full API response for debugging
    console.log('Cohere API raw response:', response.data);

    if (mode === 'book_management') {
      const rawText = response.data.text;
      
      // Fix: Add a check for an unexpected success message
      if (rawText && rawText.startsWith('✅ Operation successful!')) {
          console.error("The AI model returned an unexpected success message instead of JSON. There may be a system configuration issue.");
          throw new Error("AI model returned an unexpected response format. Please report this issue.");
      }

      let jsonString;
      
      // Check if the response is wrapped in a markdown code block
      if (rawText && rawText.startsWith('```json')) {
        // Extract the JSON string from inside the markdown block
        jsonString = rawText.substring(rawText.indexOf('\n') + 1, rawText.lastIndexOf('```'));
      } else {
        // If not, assume the raw text is the JSON string
        jsonString = rawText;
      }
      
      try {
        const parsedJson = JSON.parse(jsonString);
        // Log the parsed JSON for debugging
        console.log('Parsed JSON from API:', parsedJson);
        return parsedJson;
      } catch (e) {
        console.error("Failed to parse JSON from Cohere API response:", jsonString);
        throw new Error("Invalid JSON response from AI model.");
      }
    } else {
      // General chat mode returns plain text
      return response.data.text;
    }
  } catch (error) {
    console.error('API call Error:', error.response ? error.response.data : error.message);
    throw new Error('Failed to get response from AI API. Please check your network and API key.');
  }
};


// Helper function to format the book list for display in a more compact way.
// This function now renders each book on a single line.
export const formatBookList = (books) => {
  if (!books || books.length === 0) {
    return "No books found in the catalog.";
  }
  
  return books.map((book, index) => 
    `${index + 1}. 📚${book.title}: by ${book.authors} (${book.year}) [${book.genres}]\n`
  ).join('\n');
};

// Helper function to format a single book's details
// This function no longer includes its own header to avoid redundancy
export const formatBookDetails = (book) => {
  return `📚 **Title:** ${book.title}
✍️ **Authors:** ${book.authors}
🎭 **Genres:** ${book.genres}
😊 **Moods:** ${book.moods || 'Not specified'}
📅 **Year:** ${book.year}
🆔 **ID:** ${book.id}
🌐 **Open Library ID:** ${book.openLibraryId || 'Not specified'}
`;
};
