import React, { useState } from 'react';
import { addBook } from '../services/bookService';
import { useSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router-dom';

const HORDE_API_KEY = process.env.REACT_APP_AI_HORDE_API_KEY;

export default function AddBook() {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const location = useLocation();

  const editingBook = location.state?.book || null;

  const [book, setBook] = useState(
    editingBook || {
      title: '',
      authors: '',
      genres: '',
      year: '',
      coverUrl: '',
      description: ''
    }
  );

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // History for undo/redo
  const [imageHistory, setImageHistory] = useState(book.coverUrl ? [book.coverUrl] : []);
  const [historyIndex, setHistoryIndex] = useState(book.coverUrl ? 0 : -1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBook(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addBook(book);
      enqueueSnackbar(editingBook ? 'Book updated successfully!' : 'Book added successfully!', { variant: 'success' });
      navigate('/mybooks');
    } catch (error) {
      console.error("Error saving book:", error);
      enqueueSnackbar('Failed to save book.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generateCover = async () => {

    setGenerating(true);

    const prompt = `A book cover for "${book.title}" by ${book.authors || 'Unknown Author'}, genre: ${book.genres || 'General'}, ${book.description}`;
    console.log("📤 Sending prompt to Horde:", prompt);

    
  
    try {
      const postRes = await fetch("https://stablehorde.net/api/v2/generate/async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": HORDE_API_KEY // store securely
        },
        body: JSON.stringify({
          prompt: prompt, // build from book data
          params: { n: 1, width: 512, height: 768, steps: 30 },
          nsfw: false,
          censor_nsfw: true
        })
      });
  
      console.log("📥 POST status code:", postRes.status);
      if (!postRes.ok) throw new Error("❌ POST request failed");
  
      const postData = await postRes.json();
      console.log("✅ Data from POST:", postData);
  
      const jobId = postData.id;
      if (!jobId) throw new Error("❌ No jobId returned");
  
      // Poll every 5 seconds, up to 9 attempts
      for (let attempt = 1; attempt <= 9; attempt++) {
        console.log(`⏳ Poll attempt #${attempt}`);
        await new Promise(res => setTimeout(res, 5000));
  
        const pollRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${jobId}`);
        console.log("📥 Poll status code:", pollRes.status);
  
        const pollData = await pollRes.json();
        console.log("📊 Poll data:", pollData);
  
        if (pollData.done && pollData.generations?.length > 0) {
          const imageUrl = pollData.generations[0].img;
          console.log("🎯 Got image URL:", imageUrl);
  
          setBook(prev => ({ ...prev, coverUrl: imageUrl }));
          setImageHistory(prev => [...prev.slice(0, historyIndex + 1), imageUrl]);
          setHistoryIndex(prev => prev + 1);
          break;
        }
  
        if (attempt === 9) {
          console.warn("⏹ Max polling attempts reached, no image generated.");
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };
  
  

  const undoImage = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setBook(prev => ({ ...prev, coverUrl: imageHistory[newIndex] }));
    }
  };

  const redoImage = () => {
    if (historyIndex < imageHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setBook(prev => ({ ...prev, coverUrl: imageHistory[newIndex] }));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto grid grid-cols-3 gap-6">
      {/* Left: Form */}
      <div className="col-span-2">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {editingBook ? "Edit Book" : "Add a New Book"}
        </h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Title</label>
            <input
              type="text"
              name="title"
              value={book.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Authors */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Authors</label>
            <input
              type="text"
              name="authors"
              value={book.authors}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Genres */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Genres</label>
            <input
              type="text"
              name="genres"
              value={book.genres}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Year */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Year</label>
            <input
              type="number"
              name="year"
              value={book.year}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Cover URL (optional manual entry) */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Cover Image URL</label>
            <input
              type="text"
              name="coverUrl"
              value={book.coverUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-bold mb-2">Description</label>
            <textarea
              name="description"
              value={book.description}
              onChange={handleChange}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>

      {/* Right: Cover image generator */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-md flex flex-col items-center">
        <div className="w-[250px] h-[375px] border border-gray-300 flex items-center justify-center mb-4 bg-white">
          {book.coverUrl ? (
            <img src={book.coverUrl} alt="Cover" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-gray-500">No cover generated yet</span>
          )}
        </div>

        <button
          onClick={generateCover}
          disabled={generating}
          className="px-4 py-2 bg-green-600 text-white rounded-lg mb-2 disabled:opacity-50"
        >
          {generating ? 'Generating...' : 'Generate Cover'}
        </button>

        <div className="flex gap-2">
          <button
            onClick={undoImage}
            disabled={historyIndex <= 0}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={redoImage}
            disabled={historyIndex >= imageHistory.length - 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Redo
          </button>
        </div>
      </div>
    </div>
  );
}
