// src/components/BookGenerator.js
import { useState } from "react";
import { buildBookPrompt } from "../utils/bookPrompt";
import { parseBookOutput } from "../utils/bookParser";
import ReactMarkdown from "react-markdown";
import { addBook } from "../services/bookService"; // ✅ DB integration
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from './apiUtils';

import { callTogetherAI, callCohere, callOpenRouter } from "../utils/llmClients";

export default function BookGenerator() {
  const [idea, setIdea] = useState("");
  const [chapterCount, setChapterCount] = useState(2);
  const [wordsPerChapter, setWordsPerChapter] = useState(600);
  const [provider, setProvider] = useState("together");
  const [model, setModel] = useState("togethercomputer/llama-2-70b-chat");
  const [loading, setLoading] = useState(false);
  const [book, setBook] = useState(null);
  const [error, setError] = useState(null);

  // model options per provider
  const modelOptions = {
    together: [
      { value: "arcee-ai/virtuoso-large", label: "Virtuoso" },
      { value: "mistralai/Mistral-7B-Instruct-v0.1", label: "Mistral-7B-Instruct-v0.1" },
      { value: "deepseek-ai/DeepSeek-R1", label: "DeepSeek-R1" },
    ],
    cohere: [
      { value: "command-r-plus", label: "Command R Plus" },
      { value: "command-r", label: "Command R" },
      { value: "command", label: "Command" },
    ],
    openrouter: [
      { value: "deepseek/deepseek-chat-v3-0324", label: "deepseek-chat-v3" },
      { value: "moonshotai/kimi-k2:free", label: "kimi-k2" },
      { value: "google/gemini-2.0-flash-exp:free", label: "Gemini-2.0-flash" },
      { value: "meta-llama/llama-3.3-70b-instruct:free", label: "meta-llama" },
      { value: "google/gemma-3-27b-it:free", label: "gemma-3-27b-it" },
    ],
  };

  // 📤 Upload book content (.md) to Cloudinary
  async function uploadBookToCloudinary(bookContent, title) {
    const blob = new Blob([bookContent], { type: "text/markdown" });
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "books");
    formData.append("public_id", title.replace(/\s+/g, "_").toLowerCase());

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (!res.ok) {
      const errorBody = await res.json();
      console.error("Cloudinary API Error:", errorBody);
      throw new Error(`Cloudinary upload failed with status: ${res.status}`);
    }

    const data = await res.json();
    return data.secure_url; // ✅ public URL to store in DB
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setBook(null);

    try {
      const prompt = buildBookPrompt({
        userIdea: idea,
        chapterCount,
        wordsPerChapter,
      });

      let rawOutput = "";
      if (provider === "together") {
       rawOutput = await callTogetherAI(prompt, model);
      }
       else if (provider === "cohere") {
        rawOutput = await callCohere(prompt, model);
      } else if (provider === "openrouter") {
        rawOutput = await callOpenRouter(prompt, model);
      } else {
        throw new Error(`Unknown provider: ${provider}`);
      }

      if (!rawOutput || rawOutput.length === 0) {
        throw new Error("API returned empty response");
      }

      const parsed = parseBookOutput(rawOutput);
      setBook(parsed);

      // ✅ Upload book content (.md) to Cloudinary
      const bookUrl = await uploadBookToCloudinary(
        parsed.contentMarkdown,
        parsed.metadata?.title || "untitled"
      );

      // ✅ Prepare payload for DB
      const bookDataToAdd = {
        title: parsed.metadata?.title || "Untitled",
        authors: parsed.metadata?.author || "AI Generated",
        genres: parsed.metadata?.genres?.join(", ") || "",
        moods: parsed.metadata?.moods?.join(", ") || "",
        year: parsed.metadata?.year ? parseInt(parsed.metadata.year) : new Date().getFullYear(),
        coverUrl: parsed.metadata?.coverUrl || "",
        openLibraryId: parsed.metadata?.openLibraryId || "",
        description: parsed.metadata?.short_description || "",
        bookUrl: bookUrl, // ✅ Cloudinary public URL
      };

      // ✅ Save in SQL DB
      await addBook(bookDataToAdd);

    } catch (err) {
      console.error("❌ Book generation failed:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 pt-20 pb-12">
      <div className="max-w-5xl mx-auto p-6">
        
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            📚 AI Book Generator
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Generate complete books with AI-powered chapters, descriptions, and formatting.
          </p>
        </div>
  
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 p-8 border border-white/20 space-y-8">
          
          {/* Book Idea */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2" htmlFor="idea">
              Book Idea
            </label>
            <input
              id="idea"
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              type="text"
              placeholder="Describe your book idea..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
          </div>
  
          {/* Chapter & Word Settings */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
  <div>
    <label htmlFor="chapters" className="block mb-1 text-sm font-medium text-slate-700">
      Chapters
    </label>
    <input
      id="chapters"
      className="px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
      type="number"
      min="1"
      placeholder="Chapters"
      value={chapterCount}
      onChange={(e) => setChapterCount(Number(e.target.value))}
    />
  </div>

  <div>
    <label htmlFor="wordsPerChapter" className="block mb-1 text-sm font-medium text-slate-700">
      Words per Chapter
    </label>
    <input
      id="wordsPerChapter"
      className="px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
      type="number"
      min="100"
      placeholder="Words/Chapter"
      value={wordsPerChapter}
      onChange={(e) => setWordsPerChapter(Number(e.target.value))}
    />
  </div>

  <div>
    <label htmlFor="provider" className="block mb-1 text-sm font-medium text-slate-700">
      AI Provider
    </label>
    <select
      id="provider"
      className="px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm h-[46px]"
      value={provider}
      onChange={(e) => {
        const newProvider = e.target.value;
        setProvider(newProvider);
        setModel(modelOptions[newProvider][0].value);
      }}
    >
      <option value="together">Together AI</option>
      <option value="cohere">Cohere</option>
      <option value="openrouter">OpenRouter</option>
    </select>
  </div>
</div>

          {/* Model selection */}
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2" htmlFor="model">
              AI Model
            </label>
            <select
              id="model"
              className="w-full px-4 py-3 bg-white/80 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              {modelOptions[provider].map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
  
          {/* Generate Button */}
          <button
            className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2"
            onClick={handleGenerate}
            disabled={loading || !idea}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate & Save Book</span>
              </>
            )}
          </button>
  
          {/* Error Box */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl shadow-sm">
              <p className="font-semibold">⚠️ Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}
  
          {/* Book Output */}
          {book && (
            <div className="mt-10 space-y-6">
              {book.metadata && (
                <div className="p-6 bg-gradient-to-br from-white to-slate-50 border border-slate-200 rounded-2xl shadow-md">
                  <h2 className="text-2xl font-bold text-slate-800">{book.metadata.title}</h2>
                  <p className="text-sm text-slate-500">by {book.metadata.author}</p>
                  <p className="mt-3 italic text-slate-700">{book.metadata.short_description}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Genres: {book.metadata.genres?.join(", ")} | Moods: {book.metadata.moods?.join(", ")}
                  </p>
                </div>
              )}
              {book.contentMarkdown && (
                <div className="prose prose-lg max-w-none bg-white/70 p-6 rounded-2xl shadow-md">
                  <ReactMarkdown>{book.contentMarkdown}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}  