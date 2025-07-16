
import React, { useState, useRef, useEffect } from 'react';
import { addBook, updateBook, deleteBook } from '../services/bookService'; 
import { callCohere } from './cohereUtils';
import './chatbot.css'; 

function CohereChatbot({ books, loadBooks }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [localBooks, setLocalBooks] = useState(books); // In-memory copy of books

  const chatBoxRef = useRef(null);

  // Define help replies for different intents
  const helpReplies = {
    add: 'To add a book, type: Add book titled "Book Name" by Author Name in Genre, published in 2020.',
    delete: 'To delete a book, type: Delete book titled "Book Name" or by author "Author Name".',
    update: 'To update a book, say: Change the title of "Old Title" to "New Title" or update genre/year.',
    search: 'To search for books, type: Find books by "Author Name", genre, or books published after 2000.'
  };

  // Scroll to bottom of chat box on new messages
  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  // Update localBooks when prop books changes (e.g., after an API call)
  useEffect(() => {
    setLocalBooks(books);
  }, [books]);

  const handleSend = async () => {
    if (!input.trim()) return; // Don't send empty messages

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput(''); // Clear input field

    try {
      console.log("Sending message to Cohere:", userMessage);
      const result = await callCohere(userMessage);  
      console.log("Parsed Cohere result:", result);

      // Ensure result is an array, even if Cohere returns a single object
      const intentsArray = Array.isArray(result) ? result : [result];

      for (const { intent, data } of intentsArray) {
        // --- REFINED CRITERIA EXTRACTION FOR FINDING (used by update/delete/search) ---
        // These variables represent the *current* properties of the book we're trying to find.

        // For title and author, we should ONLY use data.title and data.author for finding.
        // If Cohere returns null for data.title, it means the original title was not extracted,
        // and we CANNOT use fieldsToUpdate.title as it's the *new* title.
        const titleCriteria = data?.title?.trim() || '';
        const authorCriteria = data?.author?.trim() || '';
        
        // Determine genre and year criteria for FINDING the book,
        // distinguishing from values meant for UPDATE (fieldsToUpdate).
        // If Cohere puts the *new* genre/year in data.genre/data.year, we should NOT use it for finding.
        let genreCriteriaForFindingBook = null;
        let yearCriteriaForFindingBook = null;

        // Logic for genreCriteriaForFindingBook
        if (data?.genre?.trim()) {
            // Use data.genre as a finding criterion if:
            // 1. It's not an 'update' intent.
            // 2. OR, if it IS an 'update' intent, but data.fieldsToUpdate.genre is UNDEFINED 
            //    (meaning Cohere put the current genre in data.genre as a lookup key, not a new value).
            if (intent !== 'update' || data?.fieldsToUpdate?.genre === undefined) {
                genreCriteriaForFindingBook = data.genre.trim();
            }
        }

        // Logic for yearCriteriaForFindingBook
        if (data?.year !== null && !isNaN(parseInt(data.year))) {
            const parsedYear = parseInt(data.year);
            // Similar to genre, if it's an update and fieldsToUpdate.year is present, assume data.year is the NEW one.
            if (intent !== 'update' || data?.fieldsToUpdate?.year === undefined) { 
                yearCriteriaForFindingBook = parsedYear;
            }
        }
       
        // For search queries and update *new* values (these come directly from Cohere's data object)
        const query = data?.query?.toLowerCase?.() || ''; // Generic search query (e.g., keywords, multi-authors)
        const after = data?.range?.after;
        const before = data?.range?.before;
        const fieldsToUpdate = data?.fieldsToUpdate; // The *new* values for update operations

        // --- Handle Help Intent ---
        if (intent === 'help') {
          const helpMatches = [];
          if (/how.*add/i.test(userMessage)) helpMatches.push('add');
          if (/how.*delete/i.test(userMessage)) helpMatches.push('delete');
          if (/how.*update/i.test(userMessage)) helpMatches.push('update');
          if (/how.*(search|find|filter)/i.test(userMessage)) helpMatches.push('search');
          if (helpMatches.length === 0 && userMessage.toLowerCase().includes('how')) helpMatches.push('search'); // Generic 'how' defaults to search help

          const helpMessages = helpMatches.length
            ? helpMatches.map(k => helpReplies[k])
            : ['You can ask me how to add, delete, update, or search books.'];

          setMessages(m => [...m, { role: 'bot', text: helpMessages.join('\n') }]);
          continue; // Move to next intent if multiple or finish
        }

        // --- Helper function to find existing books based on refined criteria ---
        const findBooksMatchingCriteria = (currentBooks) => {
          return currentBooks.filter(b => {
            const matchesTitle = titleCriteria ? b.title?.toLowerCase() === titleCriteria.toLowerCase() : true;
            const matchesAuthor = authorCriteria ? b.author?.toLowerCase() === authorCriteria.toLowerCase() : true;
            
            // Use refined genreCriteriaForFindingBook
            const matchesGenre = genreCriteriaForFindingBook ? b.genre?.toLowerCase() === genreCriteriaForFindingBook.toLowerCase() : true;
            
            // Use refined yearCriteriaForFindingBook
            const matchesYear = yearCriteriaForFindingBook !== null ? b.year === yearCriteriaForFindingBook : true;
            
            // A book matches if all PROVIDED criteria match exactly
            return (titleCriteria ? matchesTitle : true) &&
                   (authorCriteria ? matchesAuthor : true) &&
                   (genreCriteriaForFindingBook ? matchesGenre : true) && // Use refined variable
                   (yearCriteriaForFindingBook !== null ? matchesYear : true); // Use refined variable
          });
        };

        // --- Handle Add Intent (Restored Original Logic) ---
        if (intent === 'add') {
          // Use data directly for newBook construction, applying defaults as before
          const newBook = {
            title: data?.title?.trim() || 'Unknown',
            author: data?.author?.trim() || 'Unknown',
            genre: data?.genre?.trim() || 'Unknown',
            year: !isNaN(parseInt(data?.year)) ? parseInt(data.year) : 0
          };

          const alreadyExists = localBooks.some(b =>
            b.title?.toLowerCase() === newBook.title.toLowerCase() &&
            b.author?.toLowerCase() === newBook.author.toLowerCase() &&
            b.year === newBook.year
          );

          if (alreadyExists) {
            setMessages(m => [...m, {
              role: 'bot',
              text: `Book "${newBook.title}" by ${newBook.author} (${newBook.year}) already exists.`
            }]);
          } else {
            try {
              await addBook(newBook); // Send the book data to the backend
              await loadBooks(); // Reload books to update local state after successful add
              setMessages(m => [...m, {
                role: 'bot',
                text: `Added: "${newBook.title}" by ${newBook.author} (${newBook.year}) [${newBook.genre}]`
              }]);
            } catch (addError) {
              console.error("Error adding book to backend:", addError);
              // Provide a more specific error message if the backend provides one
              const errorMessage = addError.response && addError.response.data && addError.response.data.message
                                   ? addError.response.data.message
                                   : addError.message || "An unexpected error occurred while adding the book.";
              setMessages(m => [...m, {
                role: 'bot',
                text: `Failed to add book: ${errorMessage} Please ensure all details are valid.`
              }]);
            }
          }
        }

        // --- Handle Delete Intent ---
        else if (intent === 'delete') {
          const matches = findBooksMatchingCriteria(localBooks);
          if (matches.length === 1) {
            await deleteBook(matches[0].id);
            await loadBooks(); // Reload books
            setMessages(m => [...m, {
              role: 'bot',
              text: `Deleted book "${matches[0].title}" by ${matches[0].author}.`
            }]);
          } else if (matches.length > 1) {
            const matchedTitles = matches.map(b => `"${b.title}" by ${b.author} (${b.year})`).join(', ');
            setMessages(m => [...m, { role: 'bot', text: `Multiple books matched: ${matchedTitles}. Please be more specific.` }]);
          } else {
            setMessages(m => [...m, { role: 'bot', text: 'Book to delete not found.' }]);
          }
        }

        // --- Handle Update Intent ---
        else if (intent === 'update') {
          const matches = findBooksMatchingCriteria(localBooks);
          console.log("Update matches for criteria:", {titleCriteria, authorCriteria, genreCriteria: genreCriteriaForFindingBook, yearCriteriaForFindingBook}, "Found:", matches.map(b => b.title)); // Debug
          if (matches.length === 1) {
            const book = matches[0];
            const updated = {
              id: book.id,
              title: fieldsToUpdate?.title || book.title,
              author: fieldsToUpdate?.author || book.author,
              genre: fieldsToUpdate?.genre || book.genre,
              // Only update year if fieldsToUpdate.year is specifically provided and valid
              year: fieldsToUpdate?.year !== undefined && !isNaN(fieldsToUpdate.year) ? fieldsToUpdate.year : book.year,
            };
            await updateBook(book.id, updated);
            await loadBooks(); // Reload books
            setMessages(m => [...m, { role: 'bot', text: `Updated book "${updated.title}".` }]);
          } else if (matches.length > 1) {
            const matchedTitles = matches.map(b => `"${b.title}" by ${b.author} (${b.year})`).join(', ');
            setMessages(m => [...m, { role: 'bot', text: `Multiple books matched: ${matchedTitles}. Please be more specific.` }]);
          } else {
            setMessages(m => [...m, { role: 'bot', text: 'Book to update not found.' }]);
          }
        }

        // --- Handle Search Intent ---
        else if (intent === 'search') {
          const lowerTitle = titleCriteria?.toLowerCase();
          const lowerAuthor = authorCriteria?.toLowerCase(); // This will contain Cohere's parsed author, could be multi-part
          const lowerGenre = genreCriteriaForFindingBook?.toLowerCase(); 
          const lowerQuery = query?.toLowerCase() || ''; 
          
          // Check if all explicit criteria are empty AND no general query/range
          const allFieldsEmpty = !lowerTitle && !lowerAuthor && genreCriteriaForFindingBook === null && yearCriteriaForFindingBook === null && !lowerQuery && !after && !before;
          const isListAll = lowerQuery === 'all' || lowerQuery.includes('list all');

          let results = [];

          if (isListAll || allFieldsEmpty) {
            results = localBooks; // If no specific criteria, list all
          } else {
            let searchAuthors = []; // Authors derived from Cohere's data.author or data.query
            let genericKeywords = []; // Keywords derived from Cohere's data.query

            // Prioritize Cohere's data.author for author searches
            if (lowerAuthor) {
                // If data.author contains multiple names (e.g., "author1, author2"), split it
                if (lowerAuthor.includes(',') || lowerAuthor.includes(' and ') || lowerAuthor.includes(' or ')) {
                    searchAuthors = lowerAuthor.split(/,|\band\b|\bor\b/).map(a => a.trim()).filter(a => a);
                } else {
                    // Otherwise, it's a single author from data.author
                    searchAuthors = [lowerAuthor];
                }
            }
            
            // If data.author was NOT provided by Cohere, check data.query for authors or generic keywords
            if (!lowerAuthor && lowerQuery) {
                const queryParts = lowerQuery.split(/,|\band\b|\bor\b/).map(p => p.trim()).filter(p => p);
                // Heuristic: If query has multiple parts or explicitly mentions 'author', assume it's multi-author
                if (queryParts.length > 1 || userMessage.toLowerCase().includes('author')) {
                    searchAuthors = queryParts; // Overwrite if data.author was empty
                } else {
                    // Otherwise, it's a generic keyword search
                    genericKeywords = [lowerQuery]; // Treat the whole query as a single keyword
                }
            }
            // If lowerTitle is present, it's an explicit title search, don't put it in genericKeywords
            if (lowerTitle && genericKeywords.length === 0) {
                // If Cohere gave us a specific title, and no other generic keywords, use that title as a keyword
                // This handles "Search book title starting with cle" where data.title="cle" and data.query=null
                genericKeywords = [lowerTitle];
            }


            console.log("Searching with:", {lowerTitle, lowerAuthor, lowerGenre, lowerQuery, searchAuthors, genericKeywords, yearCriteriaForFindingBook, after, before}); // Debug search inputs
            console.log("Current localBooks:", localBooks); // Debug current state of books

            results = localBooks.filter(b => {
              console.log("Checking book:", b.title, b.author, b.genre, b.year); // Debug book being checked

              // Match by explicit title/genre criteria from Cohere's data object
              const matchesTitle = lowerTitle ? b.title?.toLowerCase().includes(lowerTitle) : true;
              const matchesGenre = lowerGenre ? b.genre?.toLowerCase().includes(lowerGenre) : true;
              
              // Author matching: If searchAuthors list is populated, check if any match. Otherwise, it's true.
              const matchesAnySearchAuthor = searchAuthors.length > 0 ?
                                             searchAuthors.some(sa => b.author?.toLowerCase().includes(sa)) :
                                             true; 

              // Generic keyword matching (OR logic: matches keyword in title OR genre)
              const matchesGenericKeyword = genericKeywords.length > 0 ?
                                            genericKeywords.some(kw => 
                                                b.title?.toLowerCase().includes(kw) || 
                                                b.genre?.toLowerCase().includes(kw)
                                            ) : true;
              
              // Year matching
              const matchesYear = yearCriteriaForFindingBook !== null ? b.year === yearCriteriaForFindingBook : true;
              
              // Range matching
              const matchesRange = after || before ? (
                (after ? b.year > after : true) && (before ? b.year < before : true)
              ) : true;
            
              // Combine conditions for final query match
              // All author-related matches (matchesAnySearchAuthor) AND all generic keyword matches must be true.
              const finalQueryMatch = matchesAnySearchAuthor && matchesGenericKeyword;

              console.log(`  Title(${matchesTitle}) Genre(${matchesGenre}) SearchAuthors(${matchesAnySearchAuthor}) GenericKeyword(${matchesGenericKeyword}) FinalQuery(${finalQueryMatch}) Year(${matchesYear}) Range(${matchesRange})`); // Debug individual matches

              // Overall filter: all relevant conditions must be true
              return matchesTitle && matchesGenre && finalQueryMatch && matchesYear && matchesRange;
            });
          }            

          if (results.length) {
            const text = results.map(b => `- ${b.title} by ${b.author} (${b.year}) [${b.genre}]`).join('\n');
            setMessages(m => [...m, { role: 'bot', text: `Found ${results.length} book(s):\n${text}` }]);
          } else {
            setMessages(m => [...m, { role: 'bot', text: 'No matching books found.' }]);
          }
        }
      }
    } catch (error) {
      console.error("Error handling input:", error);
      setMessages(m => [...m, { role: 'bot', text: error.message || "Something went wrong." }]);
    }
  };

  // Allow sending messages with Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="chat-container">
      <h3>Ask something...</h3>
      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={msg.role === 'user' ? 'chat-user' : 'chat-bot'}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default CohereChatbot;
