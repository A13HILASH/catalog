import React, { useState } from 'react';
import { addBook } from '../services/bookService';
import { useSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router-dom';

// IMPORTANT: For a development and test phase only.
// This is not secure for production as API keys are exposed.
// You will need to replace these with your actual keys.
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const CLOUDINARY_CLOUD_NAME = "dw9sohkcf";
const CLOUDINARY_UPLOAD_PRESET = "book_covers_preset"; // The name of your preset

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
      // The `book` object now contains the `coverUrl` from Cloudinary.
      // This is the point where the data is sent to your backend.
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

    const prompt = `A high-quality, professional book cover design for "${book.title}" by ${book.authors || 'Unknown Author'}`;

    console.log("Generating cover with prompt:", prompt);

    try {
      // Step 1: Call the Gemini API to generate the image
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ],
            // This is the correct way to request an image from this model
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
            }
          })
        }
      );

      // Log the raw response status
      console.log("Gemini API Response Status:", geminiRes.status);

      if (!geminiRes.ok) {
        // Log the full error response for more details
        const errorBody = await geminiRes.text();
        console.error("Gemini API Full Error Body:", errorBody);
        throw new Error(`Gemini API request failed with status: ${geminiRes.status}`);
      }

      const responseData = await geminiRes.json();
      console.log("Gemini API Response Data:", responseData);
      
      const base64Data = responseData.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (!base64Data) {
        throw new Error("No image data received from Gemini API.");
      }

      // Step 2: Upload the Base64 image to Cloudinary
      // Cloudinary's unsigned upload uses a preset configured on the dashboard.
      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64Data}`);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'book-covers'); // Optional folder name

      console.log("Starting upload to Cloudinary...");
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      console.log("Cloudinary API Response Status:", cloudinaryRes.status);

      if (!cloudinaryRes.ok) {
        const errorBody = await cloudinaryRes.json();
        console.error("Cloudinary API Error:", errorBody);
        throw new Error(`Cloudinary upload failed with status: ${cloudinaryRes.status}`);
      }

      const cloudinaryData = await cloudinaryRes.json();
      console.log("Cloudinary API Response Data:", cloudinaryData);
      
      const imageUrl = cloudinaryData.secure_url;
      
      // Step 3: Update state with the permanent URL
      if (imageUrl) {
        setBook(prev => ({ ...prev, coverUrl: imageUrl }));
        setImageHistory(prev => [...prev.slice(0, historyIndex + 1), imageUrl]);
        setHistoryIndex(prev => prev + 1);
        enqueueSnackbar('Cover generated and uploaded successfully!', { variant: 'success' });
      } else {
        throw new Error("No URL received from Cloudinary.");
      }
    } catch (error) {
      console.error("Error generating or uploading cover:", error);
      enqueueSnackbar('Failed to generate cover.', { variant: 'error' });
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
