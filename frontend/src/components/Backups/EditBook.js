import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBook, updateBook } from '../services/bookService';
import { useSnackbar } from 'notistack';
import axios from 'axios';

// Constants for Cohere API
const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

const callCohereAPI = async (message, preamble) => {
  try {
    const payload = {
      model: 'command-r-plus',
      message: message,
      prompt_truncation: "AUTO",
      connectors: [{ "id": "web-search" }],
      preamble: preamble,
      temperature: 0.1,
      max_tokens: 1000
    };

    const response = await axios.post(COHERE_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Cohere API raw response:', response.data);

    return response.data.text;
  } catch (error) {
    console.error("Error calling Cohere API:", error);
    throw new Error("Failed to get response from AI.");
  }
};

export default function EditBook() {
  const { enqueueSnackbar } = useSnackbar();
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);

  // State for description history
  const [descriptionHistory, setDescriptionHistory] = useState(['']);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    const fetchBook = async () => {
      try {
        const response = await getBook(id);
        const bookData = response.data;
        
        // Convert arrays to comma-separated strings for form inputs
        const processedBook = {
          ...bookData,
          authors: Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors || '',
          genres: Array.isArray(bookData.genres) ? bookData.genres.join(', ') : bookData.genres || '',
          moods: Array.isArray(bookData.moods) ? bookData.moods.join(', ') : bookData.moods || '',
          description: bookData.description || '',
          coverUrl: bookData.coverUrl || '',
          openLibraryId: bookData.openLibraryId || '',
          year: bookData.year || ''
        };
        
        setBook(processedBook);
        // Initialize description history with the fetched description
        setDescriptionHistory([processedBook.description]);
        setHistoryIndex(0);
        console.log('Book data fetched and processed:', processedBook);
      } catch (error) {
        console.error("Error fetching book:", error);
        enqueueSnackbar('Failed to load book.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchBook();
  }, [id, enqueueSnackbar]);

  const handleUpdateDescription = (newDescription) => {
    // If the user types after an undo, it creates a new history branch
    const newHistory = descriptionHistory.slice(0, historyIndex + 1);
    setDescriptionHistory([...newHistory, newDescription]);
    setHistoryIndex(newHistory.length);
    console.log('Description history updated:', [...newHistory, newDescription]);
    console.log('Current history index:', newHistory.length);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description') {
      handleUpdateDescription(value);
    } else {
      setBook(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!book) return;
    setSubmitting(true);
    
    // Create the payload matching the exact Swagger API specification
    const bookDataToUpdate = {
      title: book.title || '',
      authors: book.authors || '',
      genres: book.genres || '',
      moods: book.moods || '',
      year: book.year ? parseInt(book.year) : 0,
      coverUrl: book.coverUrl || '',
      openLibraryId: book.openLibraryId || '',
      description: descriptionHistory[historyIndex] || '',
    };
    
    console.log('Data being sent to updateBook API:', bookDataToUpdate);

    try {
      await updateBook(id, bookDataToUpdate);
      enqueueSnackbar('Book updated successfully!', { variant: 'success' });
      navigate('/mybooks');
    } catch (error) {
      console.error("Error updating book:", error);
      console.error("Error response:", error.response?.data);
      enqueueSnackbar('Failed to update book.', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const generateDescription = async () => {
    setGenerating(true);
    try {
      const preamble = "You are a professional book description writer. Your goal is to create a compelling, concise, and engaging book summary.";
      const prompt = `Based on the following book details, write a captivating and concise summary, no longer than 50 words.
        Title: ${book.title}
        Authors: ${book.authors}
        Genres: ${book.genres}`;
      
      const generatedText = await callCohereAPI(prompt, preamble);
      // Clean up the generated text by removing quotes if they exist
      const cleanedText = generatedText.replace(/^["']|["']$/g, '').trim();
      handleUpdateDescription(cleanedText);
      enqueueSnackbar('Description generated successfully!', { variant: 'success' });
    } catch (error) {
      console.error("Error generating description:", error);
      enqueueSnackbar('Failed to generate description.', { variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const refineDescription = async () => {
    setGenerating(true);
    try {
      const preamble = "You are an editing assistant. Your task is to refine and improve the following book description, making it more professional and engaging. Do not add new plot points or information. The final text must be no longer than 50 words.";
      const prompt = `Refine this book description to be more professional and concise. Do not add new information. Keep the length to a maximum of 50 words. "${descriptionHistory[historyIndex]}"`;
      
      const refinedText = await callCohereAPI(prompt, preamble);
      // Clean up the refined text by removing quotes if they exist
      const cleanedText = refinedText.replace(/^["']|["']$/g, '').trim();
      handleUpdateDescription(cleanedText);
      enqueueSnackbar('Description refined successfully!', { variant: 'success' });
    } catch (error) {
      console.error("Error refining description:", error);
      enqueueSnackbar('Failed to refine description.', { variant: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < descriptionHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!book) {
    return <div className="text-center p-8 text-lg text-gray-500">Book not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto flex">
      {/* Description container on the left */}
      <div className="w-1/3 pr-6">
        <h2 className="text-2xl font-bold mb-4">Description Tools</h2>
        <div className="bg-white p-4 rounded-lg shadow-md h-full">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={descriptionHistory[historyIndex]}
            onChange={handleChange}
            rows="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          ></textarea>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyIndex === 0 || generating}
              className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={historyIndex === descriptionHistory.length - 1 || generating}
              className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={generateDescription}
              disabled={generating || !book.title}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate Description'}
            </button>
            <button
              type="button"
              onClick={refineDescription}
              disabled={generating || !descriptionHistory[historyIndex]}
              className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {generating ? 'Refining...' : 'Refine Description'}
            </button>
          </div>
        </div>
      </div>

      {/* Main form on the right */}
      <div className="w-2/3">
        <h1 className="text-3xl font-bold mb-6 text-center">Edit Book</h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={book.title || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="authors">
              Authors (comma separated)
            </label>
            <input
              type="text"
              id="authors" 
              name="authors"
              value={book.authors || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="genres">
              Genres (comma separated)
            </label>
            <input
              type="text"
              id="genres"
              name="genres"
              value={book.genres || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="moods">
              Moods (comma separated)
            </label>
            <input
              type="text"
              id="moods"
              name="moods"
              value={book.moods || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="year">
              Year
            </label>
            <input
              type="number"
              id="year"
              name="year"
              value={book.year || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="coverUrl">
              Cover Image URL
            </label>
            <input
              type="text"
              id="coverUrl"
              name="coverUrl"
              value={book.coverUrl || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="openLibraryId">
              Open Library ID
            </label>
            <input
              type="text"
              id="openLibraryId"
              name="openLibraryId"
              value={book.openLibraryId || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || generating}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}