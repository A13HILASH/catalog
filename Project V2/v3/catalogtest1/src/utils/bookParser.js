// src/ai/utils/bookParser.js

/**
 * Parse AI-generated book output into structured objects.
 *
 * Expected format (from bookPrompt.js):
 * [BOOK_METADATA_JSON]
 * { ...valid JSON... }
 * [/BOOK_METADATA_JSON]
 *
 * [BOOK_CONTENT_MARKDOWN]
 * # Title
 * by Author
 *
 * ## Chapter 1: ...
 * ...
 * [/BOOK_CONTENT_MARKDOWN]
 * [END]
 *
 * Fallback: If the above format is not found, try to parse raw JSON or markdown
 */

export function parseBookOutput(rawOutput) {
  console.log("🔍 parseBookOutput called with:", {
    type: typeof rawOutput,
    length: rawOutput?.length,
    preview: rawOutput?.substring(0, 200)
  });

  if (!rawOutput || typeof rawOutput !== "string") {
    throw new Error("parseBookOutput: Invalid input");
  }

  let metadata = null;
  let contentMarkdown = null;
  let finished = false;

  // Try to extract metadata JSON block (preferred format)
  const metaMatch = rawOutput.match(
    /\[BOOK_METADATA_JSON\]([\s\S]*?)\[\/BOOK_METADATA_JSON\]/i
  );
  
  if (metaMatch) {
    console.log("✅ Found metadata block with tags");
    try {
      metadata = JSON.parse(metaMatch[1].trim());
      console.log("✅ Parsed metadata:", metadata);
    } catch (err) {
      console.error("❌ Failed to parse metadata JSON:", err);
    }
  } else {
    console.log("⚠️ No metadata block with tags found, trying fallback...");
    
    // Fallback: Try to find JSON object anywhere in the response
    // Look for complete JSON objects
    const jsonMatches = rawOutput.match(/\{[\s\S]*?\}/g);
    if (jsonMatches) {
      console.log(`🔄 Found ${jsonMatches.length} JSON-like objects, trying to parse...`);
      
      for (const jsonStr of jsonMatches) {
        try {
          const parsed = JSON.parse(jsonStr.trim());
          // Check if this looks like book metadata
          if (parsed.title || parsed.author || parsed.genres) {
            metadata = parsed;
            console.log("✅ Parsed fallback metadata:", metadata);
            break;
          }
        } catch (err) {
          console.log("⚠️ Failed to parse JSON candidate:", jsonStr.substring(0, 50) + "...");
        }
      }
    }
    
    // If still no metadata, try to extract from the raw text
    if (!metadata) {
      console.log("🔄 Attempting to extract metadata from raw text...");
      metadata = extractMetadataFromText(rawOutput);
    }
  }

  // Try to extract book content (markdown) with tags
  const contentMatch = rawOutput.match(
    /\[BOOK_CONTENT_MARKDOWN\]([\s\S]*?)\[\/BOOK_CONTENT_MARKDOWN\]/i
  );
  
  if (contentMatch) {
    console.log("✅ Found content block with tags");
    contentMarkdown = contentMatch[1].trim();
  } else {
    console.log("⚠️ No content block with tags found, trying fallback...");
    
    // Fallback: Look for markdown-style content (# headers, ## chapters)
    const lines = rawOutput.split('\n');
    let contentStartIndex = -1;
    
    // Look for markdown headers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('# ') || line.startsWith('## Chapter')) {
        contentStartIndex = i;
        break;
      }
    }
    
    if (contentStartIndex >= 0) {
      console.log("🔄 Found markdown content starting at line", contentStartIndex);
      contentMarkdown = lines.slice(contentStartIndex).join('\n').trim();
      
      // Remove any JSON from the beginning if it got mixed in
      if (contentMarkdown.startsWith('{')) {
        const firstHeaderIndex = contentMarkdown.search(/^#\s+/m);
        if (firstHeaderIndex > 0) {
          contentMarkdown = contentMarkdown.substring(firstHeaderIndex);
        }
      }
    } else {
      console.log("⚠️ No clear markdown structure found");
      
      // Last resort: if we have metadata but no clear content, 
      // try to extract everything after the JSON
      if (metadata && rawOutput.includes('}')) {
        const jsonEndIndex = rawOutput.lastIndexOf('}');
        const remainingContent = rawOutput.substring(jsonEndIndex + 1).trim();
        if (remainingContent.length > 50) { // Only if substantial content
          console.log("🔄 Using content after JSON as fallback");
          contentMarkdown = remainingContent;
        }
      }
      
      // Another fallback: look for any content that looks like a story/book
      if (!contentMarkdown) {
        const storyContent = extractStoryContent(rawOutput);
        if (storyContent) {
          console.log("🔄 Extracted story content using pattern matching");
          contentMarkdown = storyContent;
        }
      }
    }
  }

  // Check if output completed cleanly
  finished = rawOutput.includes("[END]") || rawOutput.includes("THE END") || rawOutput.includes("---END---");

  console.log("📊 Final parsing result:", {
    hasMetadata: !!metadata,
    hasContent: !!contentMarkdown,
    finished,
    contentLength: contentMarkdown?.length || 0
  });

  // If we got neither metadata nor content, create a basic structure
  if (!metadata && !contentMarkdown) {
    console.log("⚠️ No structured content found, creating basic fallback");
    
    // Try to extract a title from the raw output
    const titleMatch = rawOutput.match(/(?:title|Title):\s*["']?([^"'\n]+)["']?/i);
    const title = titleMatch?.[1]?.trim() || "Generated Story";
    
    metadata = {
      title,
      author: "AI Generated",
      year: new Date().getFullYear(),
      genres: ["Fiction"],
      moods: ["Creative"],
      short_description: "An AI-generated story"
    };
    
    // Use the raw output as markdown content
    contentMarkdown = `# ${title}\nby AI Generated\n\n## Chapter 1: The Story Begins\n\n${rawOutput}`;
  }

  return {
    metadata,          // object { title, author, year, genres[], moods[], short_description }
    contentMarkdown,   // string (Markdown chapters)
    finished,          // boolean
    raw: rawOutput     // keep original text if needed
  };
}

/**
 * Helper function to extract metadata from unstructured text
 */
function extractMetadataFromText(text) {
  console.log("🔍 Extracting metadata from text...");
  
  const titleMatch = text.match(/(?:title|Title):\s*["']?([^"'\n,}]+)["']?/i);
  const authorMatch = text.match(/(?:author|Author):\s*["']?([^"'\n,}]+)["']?/i);
  const genresMatch = text.match(/(?:genres?|Genres?):\s*\[([^\]]+)\]/i);
  const moodsMatch = text.match(/(?:moods?|Moods?):\s*\[([^\]]+)\]/i);
  const descMatch = text.match(/(?:description|Description):\s*["']?([^"'\n,}]+)["']?/i);
  
  const title = titleMatch?.[1]?.trim() || "Generated Story";
  const author = authorMatch?.[1]?.trim() || "AI Generated";
  
  let genres = ["Fiction"];
  if (genresMatch) {
    genres = genresMatch[1].split(',').map(g => g.trim().replace(/['"]/g, ''));
  }
  
  let moods = ["Creative"];
  if (moodsMatch) {
    moods = moodsMatch[1].split(',').map(m => m.trim().replace(/['"]/g, ''));
  }
  
  const description = descMatch?.[1]?.trim() || "An AI-generated story";
  
  const extractedMetadata = {
    title,
    author,
    year: new Date().getFullYear(),
    genres,
    moods,
    short_description: description
  };
  
  console.log("🔍 Extracted metadata:", extractedMetadata);
  return extractedMetadata;
}

/**
 * Helper function to extract story content from unstructured text
 */
function extractStoryContent(text) {
  console.log("🔍 Extracting story content...");
  
  // Remove JSON blocks first
  let cleanText = text.replace(/\{[\s\S]*?\}/g, '').trim();
  
  // Look for content that seems like a story
  const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length < 3) {
    console.log("⚠️ Not enough content lines found");
    return null;
  }
  
  // If we have substantial content, format it as a story
  const content = lines.join('\n\n');
  
  if (content.length > 100) {
    console.log("✅ Found story content, length:", content.length);
    return `# Generated Story\nby AI\n\n## Chapter 1: The Beginning\n\n${content}`;
  }
  
  return null;
}