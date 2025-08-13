// src/hooks/useImageGenerator.js

// This custom hook manages the state and logic for the image generator.
// It handles generating a cover via the Gemini API, uploading to Cloudinary,
// and managing the image history for undo/redo.

import { useState } from 'react';
import { useSnackbar } from 'notistack';
import { GEMINI_API_KEY, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './apiUtils';

/**
 * Custom hook for managing book cover generation and history.
 * @param {string} initialCoverUrl The initial cover URL to set in the history.
 * @param {function} updateBookState The function to update the coverUrl in the parent component's book state.
 * @returns {object} An object containing state and functions for the image tool.
 */
export default function useImageGenerator(initialCoverUrl, updateBookState) {
  const { enqueueSnackbar } = useSnackbar();

  // State for image history
  const [imageHistory, setImageHistory] = useState(initialCoverUrl ? [initialCoverUrl] : []);
  const [imageHistoryIndex, setImageHistoryIndex] = useState(initialCoverUrl ? 0 : -1);
  const [generatingCover, setGeneratingCover] = useState(false);

  // Generates a new cover using the Gemini API
  const generateCover = async (book) => {
    setGeneratingCover(true);

    const prompt = `A high-quality, professional book cover design for "${book.title}" by ${book.authors || 'Unknown Author'}.
      Only the title "${book.title}" and author name "${book.authors || 'Unknown Author'}" should be printed on the cover.
      No other text, labels, watermarks, or extra words.
      Focus on artistic composition, typography for title and author, and matching genre.`;

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
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              responseModalities: ["IMAGE", "TEXT"],
            }
          })
        }
      );

      if (!geminiRes.ok) {
        const errorBody = await geminiRes.text();
        console.error("Gemini API Full Error Body:", errorBody);
        throw new Error(`Gemini API request failed with status: ${geminiRes.status}`);
      }

      const responseData = await geminiRes.json();
      const base64Data = responseData.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;

      if (!base64Data) {
        throw new Error("No image data received from Gemini API.");
      }

      // Step 2: Upload the Base64 image to Cloudinary
      const formData = new FormData();
      formData.append('file', `data:image/jpeg;base64,${base64Data}`);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', 'book-covers');

      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!cloudinaryRes.ok) {
        const errorBody = await cloudinaryRes.json();
        console.error("Cloudinary API Error:", errorBody);
        throw new Error(`Cloudinary upload failed with status: ${cloudinaryRes.status}`);
      }

      const cloudinaryData = await cloudinaryRes.json();
      const imageUrl = cloudinaryData.secure_url;

      // Step 3: Update state with the permanent URL
      if (imageUrl) {
        // Update the book state in the parent component
        updateBookState('coverUrl', imageUrl);
        // Update history
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

  // Undoes the last image change
  const undoImage = () => {
    if (imageHistoryIndex > 0) {
      const newIndex = imageHistoryIndex - 1;
      setImageHistoryIndex(newIndex);
      updateBookState('coverUrl', imageHistory[newIndex]);
    }
  };

  // Redoes the last image change
  const redoImage = () => {
    if (imageHistoryIndex < imageHistory.length - 1) {
      const newIndex = imageHistoryIndex + 1;
      setImageHistoryIndex(newIndex);
      updateBookState('coverUrl', imageHistory[newIndex]);
    }
  };

  return {
    generatingCover,
    generateCover,
    undoImage,
    redoImage,
    imageHistoryIndex,
    imageHistoryLength: imageHistory.length,
    setImageHistory,
    setImageHistoryIndex
  };
}
