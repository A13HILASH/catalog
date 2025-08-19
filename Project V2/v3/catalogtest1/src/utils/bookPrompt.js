// src/ai/prompts/bookPrompt.js

/**
 * Default engineered template for AI-generated books.
 * - Produces clean, machine-parseable metadata (JSON) + readable chapters (Markdown).
 * - Enforces SFW content, originality (no copyrighted IPs), and a deterministic structure.
 * - Uses a closing sentinel [END] so you know when the output is complete.
 *
 * Placeholders:
 *   {{USER_IDEA}}         -> user's short request (what kind of book)
 *   {{CHAPTER_COUNT}}     -> integer (e.g., 2)
 *   {{WORDS_PER_CHAPTER}} -> integer target (e.g., 600)
 *   {{LANGUAGE}}          -> output language (e.g., "English")
 *   {{CURRENT_YEAR}}      -> integer (e.g., 2025)
 */
export const BOOK_PROMPT_TEMPLATE = `
You are a creative, detail-oriented **novelist and editor**. Write an **original, safe-for-work** short book that strictly follows the format and rules below.

## FORMAT (exactly this order)
[BOOK_METADATA_JSON]
{
  "title": "<AI invented, compelling, unique>",
  "author": "<AI invented pen name>",
  "year": {{CURRENT_YEAR}},
  "genres": ["<genre-1>", "<genre-2>"],
  "moods": ["<mood-1>", "<mood-2>"],
  "short_description": "<2-3 sentence blurb about the book>"
}
[/BOOK_METADATA_JSON]

[BOOK_CONTENT_MARKDOWN]
# <Title>
by <Author>

## Chapter 1: <Chapter title>
<~{{WORDS_PER_CHAPTER}} words of engaging prose>

## Chapter 2: <Chapter title>
<~{{WORDS_PER_CHAPTER}} words>

{{# If more chapters were requested, continue the same pattern up to {{CHAPTER_COUNT}} chapters #}}
[/BOOK_CONTENT_MARKDOWN]
[END]

## RULES (mandatory)
- Output **only** the sections above — no explanations, no system messages, no code fences.
- **Language**: {{LANGUAGE}}.
- **Chapters**: exactly **{{CHAPTER_COUNT}}** chapters (numbered 1..{{CHAPTER_COUNT}}).
- Target **~{{WORDS_PER_CHAPTER}} words per chapter** (it's OK to be ±20%).
- **SFW**: No explicit sexual content, graphic violence, self-harm instructions, slurs, or hateful content.
- **Originality**: No copyrighted characters, storylines, or settings from existing franchises. No song lyrics or poetry quotations.
- **Consistency**: Keep POV and tense consistent throughout. Ensure character names, facts, and stakes remain coherent.
- **Style**: Vivid, show-don't-tell prose; strong sensory details; natural dialogue; clear pacing; satisfying mini-arcs per chapter.
- **Typography**: Use the exact headings shown; do not add extra subtitles or decorative symbols.
- **JSON**: The metadata block must be **valid JSON** (double quotes, no trailing commas), not wrapped in \` or fences.

## USER REQUEST (use as inspiration, not as a quote)
"{{USER_IDEA}}"
`.trim();

/**
 * Helper to build a ready-to-send prompt from the template.
 * Safe defaults are chosen for small/medium models (e.g., OPT on AI Horde).
 */
export function buildBookPrompt({
  userIdea,
  chapterCount = 2,
  wordsPerChapter = 600,
  language = "English",
  currentYear = new Date().getFullYear(),
} = {}) {
  const sanitizedIdea = String(userIdea || "").trim();
  const tpl = BOOK_PROMPT_TEMPLATE
    .replaceAll("{{USER_IDEA}}", sanitizedIdea || "Write an original short book that fits the constraints.")
    .replaceAll("{{CHAPTER_COUNT}}", String(chapterCount))
    .replaceAll("{{WORDS_PER_CHAPTER}}", String(wordsPerChapter))
    .replaceAll("{{LANGUAGE}}", language)
    .replaceAll("{{CURRENT_YEAR}}", String(currentYear));
  return tpl;
}

