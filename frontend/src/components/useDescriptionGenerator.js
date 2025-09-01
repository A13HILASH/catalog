// src/hooks/useDescriptionGenerator.js

// This custom hook manages the state and logic for the book description generator.
// It keeps track of the description history for undo/redo functionality and
// provides functions to generate and refine the description using the Cohere API.

import { useState } from 'react';
import { callCohereAPI } from './apiUtils';
import { useSnackbar } from 'notistack';

/**
 * Custom hook for managing book description generation and history.
 * @param {object} initialDescription The initial description to set in the history.
 * @param {function} updateBookState The function to update the description in the parent component's book state.
 * @returns {object} An object containing state and functions for the description tool.
 */
export default function useDescriptionGenerator(initialDescription, updateBookState) {
  const { enqueueSnackbar } = useSnackbar();

  // State for description history
  const [descriptionHistory, setDescriptionHistory] = useState([initialDescription || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [generatingDescription, setGeneratingDescription] = useState(false);

  // Updates the description and its history
  const handleUpdateDescription = (newDescription) => {
    // If the user types after an undo, it creates a new history branch
    const newHistory = descriptionHistory.slice(0, historyIndex + 1);
    setDescriptionHistory([...newHistory, newDescription]);
    setHistoryIndex(newHistory.length);
    updateBookState('description', newDescription);
  };

  // Generates a new description using Cohere API
  const generateDescription = async (book) => {
    setGeneratingDescription(true);
    try {
      const preamble = "You are a professional book description writer. Your goal is to create a compelling, concise, and engaging book summary.";
      const prompt = `Based on the following book details, write a captivating and concise summary, no longer than 50 words.
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

  // Refines the current description using Cohere API
  const refineDescription = async () => {
    setGeneratingDescription(true);
    try {
      const preamble = "You are an editing assistant. Your task is to refine and improve the following book description, making it more professional and engaging. Do not add new plot points or information. The final text must be no longer than 50 words.";
      const prompt = `Refine this book description to be more professional and concise. Do not add new information. Keep the length to a maximum of 150 words. "${descriptionHistory[historyIndex]}"`;
      
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

  // Undoes the last description change
  const handleDescriptionUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateBookState('description', descriptionHistory[newIndex]);
    }
  };

  // Redoes the last description change
  const handleDescriptionRedo = () => {
    if (historyIndex < descriptionHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateBookState('description', descriptionHistory[newIndex]);
    }
  };

  return {
    description: descriptionHistory[historyIndex],
    generatingDescription,
    generateDescription,
    refineDescription,
    handleDescriptionUndo,
    handleDescriptionRedo,
    historyIndex,
    descriptionHistoryLength: descriptionHistory.length,
    handleUpdateDescription,
    setDescriptionHistory,
    setHistoryIndex
  };
}
