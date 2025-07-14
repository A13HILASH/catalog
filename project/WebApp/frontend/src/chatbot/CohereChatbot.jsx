import React, { useState } from 'react';
import { addBook, updateBook, deleteBook } from '../services/bookService';
import { callCohere } from './cohereUtils';
import './chatbot.css';

function CohereChatbot({ books, loadBooks }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const helpReplies = {
    add: 'To add a book, type: Add book titled "Book Name" by Author Name, published in 2020.',
    delete: 'To delete a book, type: Delete book titled "Book Name" or by author "Author Name".',
    update: 'To update a book, say: Change the title of "Old Title" to "New Title" or Update publication year of "Book Name" to 2020.',
    search: 'To search for books, type: Find books by "Author Name" or books published after 2000.'
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    try {
      const result = await callCohere(userMessage);
      console.log("Parsed result from Cohere:", result);

      const { intent, data } = result || {};
      const title = data?.title?.trim() || '';
      const author = data?.author?.trim() || '';
      const year = parseInt(data?.year);
      const query = data?.query?.toLowerCase?.() || '';
      

      // Help Queries
    
      if (intent === 'help') {
        const helpTopics = ['add', 'delete', 'update', 'search'];
        const helpKeyMatches = helpTopics.filter(topic =>
          userMessage.toLowerCase().includes(topic)
        );
      
        const helpMessages = helpKeyMatches.length
          ? helpKeyMatches.map(k => helpReplies[k])
          : ['You can ask me how to add, delete, update, or search books.'];
      
        setMessages(m => [...m, { role: 'bot', text: helpMessages.join('\n') }]);
        return;
      }
      


      // Helper to find matching book
      const matchBook = () => books.find(b =>
        (title && b.title?.toLowerCase() === title.toLowerCase()) ||
        (author && b.author?.toLowerCase() === author.toLowerCase()) ||
        (!isNaN(year) && b.year === year)
      );

      // ADD
      if (intent === 'add') {
        const newBook = {
          title: title || 'Unknown',
          author: author || 'Unknown',
          year: !isNaN(year) ? year : 0//new Date().getFullYear()
        };
        await addBook(newBook);
        setMessages(m => [...m, { role: 'bot', text: `Added: "${newBook.title}" by ${newBook.author} (${newBook.year})` }]);
      }

      // DELETE
      else if (intent === 'delete') {
        const book = matchBook();
        if (book) {
          await deleteBook(book.id);
          setMessages(m => [...m, { role: 'bot', text: `Deleted book "${book.title}" by ${book.author}.` }]);
        } else {
          throw new Error('Book to delete not found.');
        }
      }

     // UPDATE
else if (intent === 'update') {
  const book = books.find(b =>
    (title && b.title?.toLowerCase() === title.toLowerCase()) ||
    (author && b.author?.toLowerCase() === author.toLowerCase()) ||
    (!isNaN(year) && b.year === year)
  );

  if (book) {
    const updated = {
      id: book.id,
      title: data.fieldsToUpdate?.title || book.title,
      author: data.fieldsToUpdate?.author || book.author,
      year: data.fieldsToUpdate?.year !== undefined ? data.fieldsToUpdate.year : book.year,
    };

    await updateBook(book.id, updated);
    setMessages(m => [...m, { role: 'bot', text: `Updated book "${updated.title}".` }]);
  } else {
    throw new Error('Book to update not found.');
  }
}


// SEARCH
else if (intent === 'search') {
  let results = [];

  const lowerQuery = query?.toLowerCase?.() || '';
  const lowerTitleSearch = title?.toLowerCase?.() || '';
  const lowerAuthorSearch = author?.toLowerCase?.() || '';
  const isListAll = lowerQuery === 'all' || lowerQuery.includes('list all');

  if (isListAll) {
    results = books;
  } else {
    // Helper: normalize book values
    results = books.filter(b => {
      const lowerTitle = b.title?.toLowerCase?.() || '';
      const lowerAuthor = b.author?.toLowerCase?.() || '';

      const matchExactTitle = lowerTitleSearch && lowerTitle === lowerTitleSearch;
      const matchStartsWithTitle = lowerQuery.includes("start") || lowerQuery.includes("begin")
        ? lowerTitle.startsWith(lowerTitleSearch || lowerQuery)
        : false;
      const matchTitleIncludes = lowerQuery.includes("title") || lowerQuery.includes("having") || lowerQuery.includes("with")
        ? lowerTitle.includes(lowerTitleSearch || lowerQuery)
        : false;

      const matchAuthor = lowerAuthorSearch && lowerAuthor.includes(lowerAuthorSearch);
      const matchQueryAnywhere = lowerQuery && (lowerTitle.includes(lowerQuery) || lowerAuthor.includes(lowerQuery));
      const matchYear = !isNaN(year) && b.year === year;

      const after = data.range?.after;
      const before = data.range?.before;
      const matchRange = (() => {
        if (!after && !before) return false;
        if (after && before) return b.year > after && b.year < before;
        if (after) return b.year > after;
        if (before) return b.year < before;
      })();


      return (
        matchExactTitle || // exact match (first priority)
        matchStartsWithTitle ||
        matchTitleIncludes ||
        matchAuthor ||
        matchYear ||
        matchRange ||
        matchQueryAnywhere
      );
    });

    // ❗ Special: If an exact match exists, return only it
    const exact = books.find(b => b.title?.toLowerCase() === lowerTitleSearch);
    if (exact && !lowerQuery.includes("start") && !lowerQuery.includes("begin") && !lowerQuery.includes("having") && !lowerQuery.includes("title")) {
      results = [exact];
    }
  }

  const noFiltersActive =
    !title && !author && isNaN(year) && !query && !data.range;

  const finalResults = noFiltersActive ? books : results;

  if (finalResults.length) {
    const text = finalResults.map(b => `- ${b.title} by ${b.author} (${b.year})`).join('\n');
    setMessages(m => [...m, { role: 'bot', text: `Found ${finalResults.length} book(s):\n${text}` }]);
  } else {
    setMessages(m => [...m, { role: 'bot', text: 'No matching books found.' }]);
  }
}


      await loadBooks();
    } catch (error) {
      console.error("Error handling input:", error);
      setMessages(m => [...m, { role: 'bot', text: error.message || "Something went wrong." }]);
    }
  };

  return (
    <div className="chat-container">
      <h3>Ask something...</h3>
      <div className="chat-box">
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
        placeholder="Type your message..."
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default CohereChatbot;
