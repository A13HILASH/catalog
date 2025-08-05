import React, { useState, useRef, useEffect } from 'react';
import { addBook, updateBook, deleteBook } from '../services/bookService';
import { callCohere } from './cohereUtils';
import { Typography, TextField, Button, Box } from '@mui/material';
import { useSnackbar } from 'notistack';

function CohereChatbot({ books, loadBooks }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const chatBoxRef = useRef(null);

  // Define help and conversational replies
  const botReplies = {
    add: 'To add a book, type: Add book titled "Book Name" by Author Name in Genre, published in 2020.',
    delete: 'To delete a book, type: Delete book titled "Book Name" or by author "Author Name".',
    update: 'To update a book, say: Change the title of "Old Title" to "New Title" or update genre/year.',
    search: 'To search for books, type: Find books by "Author Name", genre, or books published after 2000.',
    greeting: 'Hello there! I\'m BookPal, your assistant for managing your book collection. How can I help you today?',
    capability_query: 'I can help you add, update, delete, and search for books in your collection. What would you like to do?',
    out_of_scope: "I'm sorry, I can only assist with managing your book catalog. I don't have information about other topics like recommendation systems or general knowledge.",
    unrecognized: "I'm not sure how to handle that request. Please try rephrasing or ask for 'help' to see what I can do."
  };

  // Scroll to bottom of chat box on new messages
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setMessages(m => [...m, { role: 'user', text: userMessage }]);
    setInput(''); // Clear input field

    try {
      console.log("Sending message to Cohere:", userMessage);
      const intentsArray = await callCohere(userMessage);
      console.log("Parsed Cohere result:", intentsArray);

      let allSearchResults = new Set(); // Use a Set to store unique books by stringified objects
      let hasSearchIntent = false; // Flag to track if any search intent was processed
      let recognizedIntentProcessed = false; // Flag to track if any recognized intent (conversational or transactional) was processed

      for (const { intent, data } of intentsArray) {
        // --- Handle conversational and help intents first, and mark as processed ---
        if (intent === 'greeting') {
            setMessages(m => [...m, { role: 'bot', text: botReplies.greeting }]);
            enqueueSnackbar("Hello!", { variant: 'info' });
            recognizedIntentProcessed = true;
            continue;
        } else if (intent === 'capability_query') {
            setMessages(m => [...m, { role: 'bot', text: botReplies.capability_query }]);
            enqueueSnackbar("Explaining capabilities!", { variant: 'info' });
            recognizedIntentProcessed = true;
            continue;
        } else if (intent === 'out_of_scope') {
            setMessages(m => [...m, { role: 'bot', text: botReplies.out_of_scope }]);
            enqueueSnackbar("Out of scope!", { variant: 'warning' });
            recognizedIntentProcessed = true;
            continue;
        } else if (intent === 'help') {
          const lowerUserMessage = userMessage.toLowerCase();
          let replyMessage = botReplies.unrecognized;

          if (lowerUserMessage.includes('add')) {
            replyMessage = botReplies.add;
          } else if (lowerUserMessage.includes('delete')) {
            replyMessage = botReplies.delete;
          } else if (lowerUserMessage.includes('update') || lowerUserMessage.includes('change')) {
            replyMessage = botReplies.update;
          } else if (lowerUserMessage.includes('search') || lowerUserMessage.includes('find')) {
            replyMessage = botReplies.search;
          } else {
            replyMessage = botReplies.capability_query;
          }
          setMessages(m => [...m, { role: 'bot', text: replyMessage }]);
          enqueueSnackbar("Providing help!", { variant: 'info' });
          recognizedIntentProcessed = true;
          continue;
        }

        // --- Handle transactional intents (add, update, delete, search) ---
        // Mark as processed if it's one of these
        if (['add', 'update', 'delete', 'search'].includes(intent)) {
            recognizedIntentProcessed = true;
        }

        //  Handle "null" string from Cohere for search and delete intent criteria
        const titleCriteria = data?.title === "null" ? '' : data?.title?.trim() || '';
        const authorCriteria = data?.author === "null" ? '' : data?.author?.trim() || '';

        let genreCriteriaForFindingBook = null;
        let yearCriteriaForFindingBook = null;

        if (data?.genre?.trim() && data.genre.trim() !== "null") { // Added check for "null" string
            if (intent !== 'update' || data?.fieldsToUpdate?.genre === undefined) {
                genreCriteriaForFindingBook = data.genre.trim();
            }
        }

        if (data?.year !== null && !isNaN(parseInt(data.year))) {
            const parsedYear = parseInt(data.year);
            if (intent !== 'update' || data?.fieldsToUpdate?.year === undefined) {
                yearCriteriaForFindingBook = parsedYear;
            }
        }

        // Handle "null" string from Cohere
        const query = data?.query === "null" ? '' : data?.query?.toLowerCase?.() || '';

        const fieldsToUpdate = data?.fieldsToUpdate;

        // Helper function inside handleSend to access `data` and `books` easily
        // and adapted it to be more flexible for search/delete
        const filterBooksByCriteria = (currentBooks, filterData, isStrictTitleMatch = false, isDeleteIntent = false) => {
            const lowerTitle = filterData.title === "null" ? '' : filterData.title?.toLowerCase?.() || '';
            const lowerAuthor = filterData.author === "null" ? '' : filterData.author?.toLowerCase?.() || '';
            const lowerGenre = filterData.genre === "null" ? '' : filterData.genre?.toLowerCase?.() || '';
            const queryCleaned = filterData.query === "null" ? '' : filterData.query?.toLowerCase?.() || '';

            const afterYear = filterData.range?.after;
            const beforeYear = filterData.range?.before;

            let searchAuthors = [];
            if (lowerAuthor) {
                searchAuthors = lowerAuthor.split(/(?:,\s*| and | or )/i).map(a => a.trim()).filter(a => a);
            } else if (queryCleaned && isDeleteIntent) { // For delete, if author is not explicit, but query is there
                 // Try to infer authors from query if "by Author A, Author B" is in query
                const authorMatch = userMessage.toLowerCase().match(/by\s+([a-z0-9,\s&]+)/);
                if (authorMatch && authorMatch[1]) {
                    searchAuthors = authorMatch[1].split(/(?:,\s*| and | or )/i).map(a => a.trim()).filter(a => a);
                }
            }


            let genericKeywords = [];
            // If the query is not specifically an author search and there's a general query
            if (!searchAuthors.length && queryCleaned && queryCleaned !== 'all' && !queryCleaned.includes('list all')) {
                genericKeywords = queryCleaned.split(/\s*,\s*|\s+and\s+|\s+or\s+/).map(k => k.trim()).filter(k => k);
            }


            return currentBooks.filter(b => {
                // Title matching: strict for add/update context, includes for search/delete queries
                const matchesTitle = lowerTitle
                    ? (isStrictTitleMatch ? b.title?.toLowerCase() === lowerTitle : b.title?.toLowerCase().includes(lowerTitle))
                    : (queryCleaned ? b.title?.toLowerCase().includes(queryCleaned) : true);

                // Author matching: direct match or includes if multiple authors specified or general query
                const matchesAuthor = lowerAuthor
                    ? (lowerAuthor.includes(',') || lowerAuthor.includes(' and ') || lowerAuthor.includes(' or ')
                        ? lowerAuthor.split(/(?:,\s*| and | or )/i).some(sa => b.author?.toLowerCase().includes(sa.trim()))
                        : b.author?.toLowerCase().includes(lowerAuthor))
                    : true;

                const matchesGenre = lowerGenre ? b.genre?.toLowerCase().includes(lowerGenre) : true;
                const matchesYear = filterData.year !== null ? b.year === filterData.year : true;

                const matchesRange = (afterYear || beforeYear) ? (
                    (afterYear ? b.year >= afterYear : true) && (beforeYear ? b.year <= beforeYear : true)
                ) : true;

                const matchesAnySearchAuthor = searchAuthors.length > 0 ?
                                               searchAuthors.some(sa => b.author?.toLowerCase().includes(sa)) :
                                               true;

                const matchesGenericKeyword = genericKeywords.length > 0 ?
                                              genericKeywords.some(kw =>
                                                  b.title?.toLowerCase().includes(kw) ||
                                                  b.genre?.toLowerCase().includes(kw) ||
                                                  b.author?.toLowerCase().includes(kw)
                                              ) : true;
                
                // Combining conditions for flexible search/delete
                // A book matches if it meets the specific title/author/genre/year criteria AND
                // it matches any provided range criteria AND
                // it matches any general keywords or explicit author searches from the query field
                return (
                    (lowerTitle ? matchesTitle : true) &&
                    (lowerAuthor ? matchesAuthor : true) &&
                    (lowerGenre ? matchesGenre : true) &&
                    (filterData.year !== null ? matchesYear : true) &&
                    matchesRange &&
                    matchesAnySearchAuthor &&
                    matchesGenericKeyword
                );
            });
        };

        if (intent === 'add') {
          const newBook = {
            title: data?.title?.trim() || 'Unknown',
            author: data?.author?.trim() || 'Unknown',
            genre: data?.genre?.trim() || 'Unknown',
            year: !isNaN(parseInt(data?.year)) ? parseInt(data.year) : 0
          };

          const alreadyExists = books.some(b =>
            b.title?.toLowerCase() === newBook.title.toLowerCase() &&
            b.author?.toLowerCase() === newBook.author.toLowerCase() &&
            b.year === newBook.year
          );

          if (alreadyExists) {
            setMessages(m => [...m, {
              role: 'bot',
              text: `Book "${newBook.title}" by ${newBook.author} (${newBook.year}) already exists.`
            }]);
            enqueueSnackbar(`Book "${newBook.title}" already exists.`, { variant: 'warning' });
          } else {
            try {
              await addBook(newBook);
              await loadBooks();
              setMessages(m => [...m, {
                role: 'bot',
                text: `Added: "${newBook.title}" by ${newBook.author} (${newBook.year}) [${newBook.genre}]`
              }]);
              enqueueSnackbar(`Added "${newBook.title}"`, { variant: 'success' });
            } catch (addError) {
              console.error("Error adding book to backend:", addError);
              const errorMessage = addError.response && addError.response.data && addError.response.data.message
                                   ? addError.response.data.message
                                   : addError.message || "An unexpected error occurred while adding the book.";
              setMessages(m => [...m, {
                role: 'bot',
                text: `Failed to add book: ${errorMessage} Please ensure all details are valid.`
              }]);
              enqueueSnackbar(`Failed to add book: ${errorMessage}`, { variant: 'error' });
            }
          }
        }

        else if (intent === 'delete') {
          // Use the more flexible filterBooksByCriteria for deletion
          const matches = filterBooksByCriteria(books, data, false, true); // isStrictTitleMatch=false, isDeleteIntent=true
          
          if (matches.length === 1) {
            try {
              await deleteBook(matches[0].id);
              await loadBooks();
              setMessages(m => [...m, {
                role: 'bot',
                text: `Deleted book "${matches[0].title}" by ${matches[0].author}.`
              }]);
              enqueueSnackbar(`Deleted "${matches[0].title}"`, { variant: 'info' });
            } catch (deleteError) {
              console.error("Error deleting book from backend:", deleteError);
              const errorMessage = deleteError.response && deleteError.response.data && deleteError.response.data.message
                                   ? deleteError.response.data.message
                                   : deleteError.message || "An unexpected error occurred while deleting the book.";
              setMessages(m => [...m, {
                role: 'bot',
                text: `Failed to delete book: ${errorMessage}`
              }]);
              enqueueSnackbar(`Failed to delete book: ${errorMessage}`, { variant: 'error' });
            }
          } else if (matches.length > 1) {
            const matchedTitles = matches.map(b => `"${b.title}" by ${b.author} (${b.year})`).join(', ');
            setMessages(m => [...m, { role: 'bot', text: `Multiple books matched: ${matchedTitles}. Please be more specific.` }]);
            enqueueSnackbar(`Multiple books matched. Please be more specific.`, { variant: 'warning' });
          } else {
            setMessages(m => [...m, { role: 'bot', text: 'Book to delete not found.' }]);
            enqueueSnackbar('Book to delete not found.', { variant: 'warning' });
          }
        }

        else if (intent === 'update') {
          // Identify criteria for finding the *original* book.
          const findTitle = (data?.title === "null" || fieldsToUpdate?.title !== undefined) ? '' : data?.title?.trim() || '';
          const findAuthor = (data?.author === "null" || fieldsToUpdate?.author !== undefined) ? '' : data?.author?.trim() || '';
          const findGenre = (data?.genre?.trim() && data.genre.trim() !== "null" && fieldsToUpdate?.genre === undefined) ? data.genre.trim() : null;
          const findYear = (data?.year !== null && !isNaN(parseInt(data.year)) && fieldsToUpdate?.year === undefined) ? parseInt(data.year) : null;

          const matches = books.filter(b => {
            const matchesTitle = findTitle ? b.title?.toLowerCase() === findTitle.toLowerCase() : true;
            const matchesAuthor = findAuthor ? b.author?.toLowerCase() === findAuthor.toLowerCase() : true;
            const matchesGenre = findGenre ? b.genre?.toLowerCase() === findGenre.toLowerCase() : true;
            const matchesYear = findYear !== null ? b.year === findYear : true;

            return matchesTitle && matchesAuthor && matchesGenre && matchesYear;
          });

          console.log("Update matches for criteria (refined):", {findTitle, findAuthor, findGenre, findYear}, "Found:", matches.map(b => b.title));

          if (matches.length === 1) {
            const book = matches[0];
            const updated = {
              id: book.id,
              title: fieldsToUpdate?.title || book.title,
              author: fieldsToUpdate?.author || book.author,
              genre: fieldsToUpdate?.genre || book.genre,
              year: fieldsToUpdate?.year !== undefined && !isNaN(fieldsToUpdate.year) ? fieldsToUpdate.year : book.year,
            };
            try {
              await updateBook(book.id, updated);
              await loadBooks();
              setMessages(m => [...m, { role: 'bot', text: `Updated book "${updated.title}".` }]);
              enqueueSnackbar(`Updated "${updated.title}"`, { variant: 'success' });
            } catch (updateError) {
              console.error("Error updating book in backend:", updateError);
              const errorMessage = updateError.response && updateError.response.data && updateError.response.data.message
                                   ? updateError.response.data.message
                                   : updateError.message || "An unexpected error occurred while updating the book.";
              setMessages(m => [...m, {
                role: 'bot',
                text: `Failed to update book: ${errorMessage}`
              }]);
              enqueueSnackbar(`Failed to update book: ${errorMessage}`, { variant: 'error' });
            }
          } else if (matches.length > 1) {
            const matchedTitles = matches.map(b => `"${b.title}" by ${b.author} (${b.year})`).join(', ');
            setMessages(m => [...m, { role: 'bot', text: `Multiple books matched: ${matchedTitles}. Please be more specific.` }]);
            enqueueSnackbar(`Multiple books matched. Please be more specific.`, { variant: 'warning' });
          } else {
            setMessages(m => [...m, { role: 'bot', text: 'Book to update not found.' }]);
            enqueueSnackbar('Book to update not found.', { variant: 'warning' });
          }
        }

        else if (intent === 'search') {
          hasSearchIntent = true; // Set flag
          // Use the flexible filterBooksByCriteria for searching
          let currentSearchQueryResult = filterBooksByCriteria(books, data);

          // Handle "list all" or empty search
          const allFieldsEmpty = !titleCriteria && !authorCriteria && genreCriteriaForFindingBook === null && yearCriteriaForFindingBook === null && !query && !data?.range?.after && !data?.range?.before;
          const isListAll = query === 'all' || query.includes('list all');

          if (isListAll || allFieldsEmpty) {
            currentSearchQueryResult = books;
          }

          currentSearchQueryResult.forEach(book => allSearchResults.add(JSON.stringify(book))); // Add stringified book to set for uniqueness
        }
      }

      // After processing all intents, display aggregated search results if any search intent was found
      if (hasSearchIntent) {
        const uniqueResults = Array.from(allSearchResults).map(s => JSON.parse(s));
        if (uniqueResults.length) {
          const text = uniqueResults.map(b => `- ${b.title} by ${b.author} (${b.year}) [${b.genre}]`).join('\n');
          setMessages(m => [...m, { role: 'bot', text: `Found ${uniqueResults.length} book(s):\n${text}` }]);
          enqueueSnackbar(`Found ${uniqueResults.length} book(s)`, { variant: 'info' });
        } else {
          setMessages(m => [...m, { role: 'bot', text: 'No matching books found.' }]);
          enqueueSnackbar('No matching books found.', { variant: 'info' });
        }
      }
      // If no recognized intent (conversational or transactional) was processed
      else if (!recognizedIntentProcessed) {
          setMessages(m => [...m, { role: 'bot', text: botReplies.unrecognized }]);
          enqueueSnackbar("Could not understand your request.", { variant: 'warning' });
      }

    } catch (error) {
      console.error("Error handling input:", error);
      setMessages(m => [...m, { role: 'bot', text: error.message || "Something went wrong." }]);
      enqueueSnackbar(`Error: ${error.message || "Something went wrong."}`, { variant: 'error' });
    }
  };

  return (
    <Box className="chat-container" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h6" component="h3" sx={{ p: 1, borderBottom: '1px solid #eee' }}>
        BookPal  {/*  CHANGE BOT NAME HERE */}
      </Typography>
      <Box className="chat-box" ref={chatBoxRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
        {messages.map((msg, idx) => (
          <Box key={idx} sx={{
            mb: 1,
            p: 1,
            borderRadius: 1,
            bgcolor: msg.role === 'user' ? 'primary.light' : 'grey.200',
            color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '80%',
            wordBreak: 'break-word',
          }}>
            <Typography variant="body2">
              <strong>{msg.role === 'user' ? 'You' : 'BookPal'}:</strong> {msg.text} {/* <--- CHANGED BOT NAME HERE */}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 1, borderTop: '1px solid #eee', display: 'flex' }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          sx={{ mr: 1 }}
        />
        <Button variant="contained" onClick={handleSend}>Send</Button>
      </Box>
    </Box>
  );
}

export default CohereChatbot;