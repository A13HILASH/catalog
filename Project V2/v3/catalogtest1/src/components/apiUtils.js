// src/utils/apiUtils.js

// This file centralizes API configuration and a shared function for Cohere.
// The key constants are defined here, making them easy to manage in one place.

import axios from 'axios';

// Constants for Cohere API
export const COHERE_API_KEY = process.env.REACT_APP_COHERE_API_KEY;
export const COHERE_API_URL = 'https://api.cohere.ai/v1/chat';

// Constants for Gemini and Cloudinary
export const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
export const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
/**
 * Calls the Cohere API to generate text based on a prompt and preamble.
 * @param {string} message The main prompt message.
 * @param {string} preamble The system prompt to set the AI's persona.
 * @returns {Promise<string>} The generated text response.
 */
export const callCohereAPI = async (message, preamble) => {
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

    return response.data.text;
  } catch (error) {
    console.error("Error calling Cohere API:", error);
    throw new Error("Failed to get response from AI.");
  }
};
