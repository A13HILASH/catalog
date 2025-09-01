import React, { useState } from 'react';
import { addBook } from '../services/bookService';
import { useSnackbar } from 'notistack';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

// Constants for Cohere API
const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;
const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

// Constants for Gemini and Cloudinary
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const CLOUDINARY_CLOUD_NAME = "dw9sohkcf";
const CLOUDINARY_UPLOAD_PRESET = "book_covers_preset"; // The name of your preset

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
      moods: '',
      year: '',
      coverUrl: '',
      openLibraryId: '',
      description: ''
    }
  );
  
  const [loading, setLoading] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  
  // State for description history from the user's original file
  const [descriptionHistory, setDescriptionHistory] = useState(['']);
  const [historyIndex, setDescriptionHistoryIndex] = useState(0);

  // State for image history from the Gemini/Cloudinary artifact
  const [imageHistory, setImageHistory] = useState(book.coverUrl ? [book.coverUrl] : []);
  const [imageHistoryIndex, setImageHistoryIndex] = useState(book.coverUrl ? 0 : -1);

  const handleUpdateDescription = (newDescription) => {
    // If the user types after an undo, it creates a new history branch
    const newHistory = descriptionHistory.slice(0, historyIndex + 1);
    setDescriptionHistory([...newHistory, newDescription]);
    setDescriptionHistoryIndex(newHistory.length);
    console.log('Description history updated:', [...newHistory, newDescription]);
    console.log('Current description history index:', newHistory.length);
    setBook(prev => ({ ...prev, description: newDescription }));
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
    setLoading(true);
    
    // Create the payload matching the exact Swagger API specification
    const bookDataToAdd = {
      title: book.title || '',
      authors: book.authors || '',
      genres: book.genres || '',
      moods: book.moods || '',
      year: book.year ? parseInt(book.year) : 0,
      coverUrl: book.coverUrl || '',
      openLibraryId: book.openLibraryId || '',
      description: book.description || '', // Use the description from the main state
    };
    
    console.log('Data being sent to addBook API:', bookDataToAdd);

    try {
      await addBook(bookDataToAdd);
      enqueueSnackbar(editingBook ? 'Book updated successfully!' : 'Book added successfully!', { variant: 'success' });
      navigate('/mybooks');
    } catch (error) {
      console.error("Error saving book:", error);
      console.error("Error response:", error.response?.data);
      enqueueSnackbar('Failed to add book.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const generateDescription = async () => {
    setGeneratingDescription(true);
    try {
      const preamble = "You are a professional book description writer. Your goal is to create a compelling, concise, and engaging book summary.";
      const prompt = `Based on the following book details, write a captivating and concise summary.
        Title: ${book.title}
        Authors: ${book.authors}
        Genres: ${book.genres}`;
      
      const generatedText = await callCohereAPI(prompt, preamble);
      const cleanedText = generatedText.replace(/^["']|["']$/g, '').trim();
      handleUpdateDescription(cleanedText);
      enqueueSnackbar('Description generated successfully!', { variant: 'success' });
    } catch (error) {
      console.error("Error generating description:", error);
      enqueueSnackbar('Failed to generate description.', { variant: 'error' });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const refineDescription = async () => {
    setGeneratingDescription(true);
    try {
      const preamble = "You are an editing assistant. Your task is to refine and improve the following book description, making it more professional and engaging. Do not add new plot points or information. The final text must be no longer than 50 words.";
      const prompt = `Refine this book description to be more professional and concise. Do not add new information. Keep the length to a maximum of 50 words. "${descriptionHistory[historyIndex]}"`;
      
      const refinedText = await callCohereAPI(prompt, preamble);
      const cleanedText = refinedText.replace(/^["']|["']$/g, '').trim();
      handleUpdateDescription(cleanedText);
      enqueueSnackbar('Description refined successfully!', { variant: 'success' });
    } catch (error) {
      console.error("Error refining description:", error);
      enqueueSnackbar('Failed to refine description.', { variant: 'error' });
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleDescriptionUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setDescriptionHistoryIndex(newIndex);
      setBook(prev => ({ ...prev, description: descriptionHistory[newIndex] }));
    }
  };

  const handleDescriptionRedo = () => {
    if (historyIndex < descriptionHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setDescriptionHistoryIndex(newIndex);
      setBook(prev => ({ ...prev, description: descriptionHistory[newIndex] }));
    }
  };

  const generateCover = async () => {
    setGeneratingCover(true);

    const prompt = `A high-quality, professional book cover design for "${book.title}" by ${book.authors || 'Unknown Author'}. 
      Only the title "${book.title}" and author name "${book.authors || 'Unknown Author'}" should be printed on the cover. 
      No other text, labels, watermarks, or extra words. 
      Focus on artistic composition, typography for title and author, and matching the mood and genre.`;

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
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
            }
          })
        }
      );

      console.log("Gemini API Response Status:", geminiRes.status);

      if (!geminiRes.ok) {
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
      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64Data}`);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'book-covers');

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
        setImageHistory(prev => [...prev.slice(0, imageHistoryIndex + 1), imageUrl]);
        setImageHistoryIndex(prev => prev + 1);
        enqueueSnackbar('Cover generated and uploaded successfully!', { variant: 'success' });
      } else {
        throw new Error("No URL received from Cloudinary.");
      }
    } catch (error) {
      console.error("Error generating or uploading cover:", error);
      enqueueSnackbar('Failed to generate cover.', { variant: 'error' });
    } finally {
      setGeneratingCover(false);
    }
  };

  const undoImage = () => {
    if (imageHistoryIndex > 0) {
      const newIndex = imageHistoryIndex - 1;
      setImageHistoryIndex(newIndex);
      setBook(prev => ({ ...prev, coverUrl: imageHistory[newIndex] }));
    }
  };

  const redoImage = () => {
    if (imageHistoryIndex < imageHistory.length - 1) {
      const newIndex = imageHistoryIndex + 1;
      setImageHistoryIndex(newIndex);
      setBook(prev => ({ ...prev, coverUrl: imageHistory[newIndex] }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-3 gap-6">
      {/* Left: Description container */}
      <div className="col-span-1">
        <h2 className="text-2xl font-bold mb-4">Description Tools</h2>
        <div className="bg-white p-4 rounded-lg shadow-md h-full">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={book.description || ''} // Bind to the main book state
            onChange={handleChange}
            rows="10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          ></textarea>
          <div className="flex flex-col space-y-2">
            <button
              type="button"
              onClick={handleDescriptionUndo}
              disabled={historyIndex === 0 || generatingDescription}
              className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleDescriptionRedo}
              disabled={historyIndex === descriptionHistory.length - 1 || generatingDescription}
              className="px-4 py-2 bg-gray-400 text-white font-medium rounded-lg shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              Redo
            </button>
            <button
              type="button"
              onClick={generateDescription}
              disabled={generatingDescription || !book.title}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              {generatingDescription ? 'Generating...' : 'Generate Description'}
            </button>
            <button
              type="button"
              onClick={refineDescription}
              disabled={generatingDescription || !book.description}
              className="px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg shadow-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
            >
              {generatingDescription ? 'Refining...' : 'Refine Description'}
            </button>
          </div>
        </div>
      </div>

      {/* Center: Main form */}
      <div className="col-span-1">
        <h1 className="text-3xl font-bold mb-6 text-center">
            {editingBook ? "Edit Book" : "Add a New Book"}
        </h1>
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md h-full">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={book.title}
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
              value={book.authors}
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
              value={book.genres}
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
              value={book.moods}
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
              value={book.year}
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
              value={book.openLibraryId}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end mt-8">
            <button
              type="submit"
              disabled={loading || generatingDescription || generatingCover}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>

      {/* Right: Cover image generator */}
      <div className="col-span-1">
        <h2 className="text-2xl font-bold mb-4">Image Generator</h2>
        <div className="bg-gray-50 p-4 rounded-lg shadow-md flex flex-col items-center">
        <div className="w-[250px] flex items-center justify-center mb-4 bg-white">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt="Cover" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-gray-500">No cover generated yet</span>
            )}
          </div>
          <button
            onClick={generateCover}
            disabled={generatingCover || !book.title || !book.authors}
            className="px-4 py-2 bg-green-600 text-white rounded-lg mb-2 disabled:opacity-50"
          >
            {generatingCover ? 'Generating...' : 'Generate Cover'}
          </button>
          <div className="flex gap-2">
            <button
              onClick={undoImage}
              disabled={imageHistoryIndex <= 0}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Undo
            </button>
            <button
              onClick={redoImage}
              disabled={imageHistoryIndex >= imageHistory.length - 1}
              className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
            >
              Redo
            </button>
          </div>
          <div className="mt-4 w-full">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="coverUrl">
              Cover Image URL
            </label>
            <input
              type="text"
              id="coverUrl"
              name="coverUrl"
              value={book.coverUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
