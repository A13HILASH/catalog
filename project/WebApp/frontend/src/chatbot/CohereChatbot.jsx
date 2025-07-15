// CohereChatbot.jsx
import React, { useState, useRef, useEffect } from 'react';
import { addBook, updateBook, deleteBook } from '../services/bookService';
import { callCohere } from './cohereUtils';
import './chatbot.css';

function CohereChatbot({ books, loadBooks }) {
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState('');
  const [localBooks, setLocalBooks] = useState(books);
  const chatBoxRef = useRef(null);

  const helpReplies = {
    add: 'To add a book, type: Add book titled "Book Name" by Author Name in Genre, published in 2020.',
    delete: 'To delete a book, type: Delete book titled "Book Name" or by author "Author Name".',
    update: 'To update a book, say: Change the title of "Old Title" to "New Title" or update genre/year.',
    search: 'To search for books, type: Find books by "Author Name", genre, or books published after 2000.'
  };

  useEffect(() => {
    chatBoxRef.current?.scrollTo({
      top: chatBoxRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  useEffect(() => {
    setLocalBooks(books);
  }, [books]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');

    

    try {
      console.log("Sending message to Cohere:", userMessage);
      const result = await callCohere(userMessage);  
      console.log("Parsed Cohere result:", result);


      const intentsArray = Array.isArray(result) ? result : [result];

      for (const { intent, data } of intentsArray) {
        const title = data?.title?.trim() || '';
        const author = data?.author?.trim() || '';
        const genre = data?.genre?.trim() || '';
        const year = parseInt(data?.year);
        const query = data?.query?.toLowerCase?.() || '';
        const after = data?.range?.after;
        const before = data?.range?.before;
        const fieldsToUpdate = data?.fieldsToUpdate;

        if (intent === 'help') {
          const helpMatches = [];
          if (/how.*add/i.test(userMessage)) helpMatches.push('add');
          if (/how.*delete/i.test(userMessage)) helpMatches.push('delete');
          if (/how.*update/i.test(userMessage)) helpMatches.push('update');
          if (/how.*(search|find|filter)/i.test(userMessage)) helpMatches.push('search');
          if (helpMatches.length === 0 && userMessage.toLowerCase().includes('how')) helpMatches.push('search');

          const helpMessages = helpMatches.length
            ? helpMatches.map(k => helpReplies[k])
            : ['You can ask me how to add, delete, update, or search books.'];

          setMessages(m => [...m, { role: 'bot', text: helpMessages.join('\n') }]);
          continue;
        }

        const matchBooks = () => {
          return localBooks.filter(b => {
            const matchesTitle = title && (!fieldsToUpdate?.title || fieldsToUpdate.title !== title)
              ? b.title?.toLowerCase() === title.toLowerCase() : true;
            const matchesAuthor = author && (!fieldsToUpdate?.author || fieldsToUpdate.author !== author)
              ? b.author?.toLowerCase() === author.toLowerCase() : true;
            const matchesYear = !isNaN(year) && (!fieldsToUpdate?.year || fieldsToUpdate.year !== year)
              ? b.year === year : true;
            const matchesGenre = genre && (!fieldsToUpdate?.genre || fieldsToUpdate.genre !== genre)
              ? b.genre?.toLowerCase() === genre.toLowerCase() : true;
            return matchesTitle && matchesAuthor && matchesYear && matchesGenre;
          });
        };

        if (intent === 'add') {
          const newBook = {
            title: title || 'Unknown',
            author: author || 'Unknown',
            genre: genre || 'Unknown',
            year: !isNaN(year) ? year : 0
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
            await addBook(newBook);
            await loadBooks();
            setMessages(m => [...m, {
              role: 'bot',
              text: `Added: "${newBook.title}" by ${newBook.author} (${newBook.year}) [${newBook.genre}]`
            }]);
          }
        }

        else if (intent === 'delete') {
          const matches = matchBooks();
          if (matches.length === 1) {
            await deleteBook(matches[0].id);
            await loadBooks();
            setMessages(m => [...m, {
              role: 'bot',
              text: `Deleted book "${matches[0].title}" by ${matches[0].author}.`
            }]);
          } else if (matches.length > 1) {
            throw new Error('Multiple books matched. Be more specific.');
          } else {
            throw new Error('Book to delete not found.');
          }
        }

        else if (intent === 'update') {
          const matches = matchBooks();
          if (matches.length === 1) {
            const book = matches[0];
            const updated = {
              id: book.id,
              title: fieldsToUpdate?.title || book.title,
              author: fieldsToUpdate?.author || book.author,
              genre: fieldsToUpdate?.genre || book.genre,
              year: fieldsToUpdate?.year !== undefined ? fieldsToUpdate.year : book.year,
            };
            await updateBook(book.id, updated);
            await loadBooks();
            setMessages(m => [...m, { role: 'bot', text: `Updated book "${updated.title}".` }]);
          } else if (matches.length > 1) {
            throw new Error('Multiple books matched. Be more specific.');
          } else {
            throw new Error('Book to update not found.');
          }
        }

        else if (intent === 'search') {
          const lowerTitle = title?.toLowerCase();
          const lowerAuthor = author?.toLowerCase();
          const lowerGenre = genre?.toLowerCase();
          const lowerQuery = query?.toLowerCase() || '';
          const allFieldsEmpty = !title && !author && !genre && isNaN(year) && !query && !after && !before;
          const isListAll = lowerQuery === 'all' || lowerQuery.includes('list all');

          let results = [];

          if (isListAll || allFieldsEmpty) {
            results = localBooks;
          } else {
            results = books.filter(b => {
              const matchesTitle = lowerTitle ? b.title?.toLowerCase() === lowerTitle : true;
              const matchesAuthor = lowerAuthor ? b.author?.toLowerCase().includes(lowerAuthor) : true;
              const matchesGenre = lowerGenre ? b.genre?.toLowerCase().includes(lowerGenre) : true;
              const matchesQuery = lowerQuery ? (
                b.title?.toLowerCase().includes(lowerQuery) ||
                b.author?.toLowerCase().includes(lowerQuery) ||
                b.genre?.toLowerCase().includes(lowerQuery)
              ) : true;
              const matchesYear = !isNaN(year) ? b.year === year : true;
              const matchesRange = after || before ? (
                (after ? b.year > after : true) && (before ? b.year < before : true)
              ) : true;
            
              return matchesTitle && matchesAuthor && matchesGenre && matchesQuery && matchesYear && matchesRange;
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

