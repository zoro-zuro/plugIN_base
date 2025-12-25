// lib/intent.ts

/**
 * BASE KB KEYWORDS
 * Common terms that almost always indicate a need for KB retrieval
 * These are added to doc-specific keywords for better coverage
 **/
const BASE_KB_KEYWORDS = [
  // Pricing & Commerce
  "price",
  "pricing",
  "cost",
  "fee",
  "charge",
  "payment",
  "subscription",
  "plan",
  "discount",
  "refund",

  // Product & Service
  "product",
  "service",
  "feature",
  "specification",
  "spec",
  "detail",
  "information",

  // Policies & Documentation
  "policy",
  "policies",
  "terms",
  "condition",
  "conditions",
  "agreement",
  "guide",
  "manual",
  "documentation",
  "docs",
  "faq",

  // Support & Operations
  "shipping",
  "delivery",
  "return",
  "warranty",
  "support",
  "contact",
  "phone",
  "email",
  "address",

  // Business & HR (if applicable)
  "candidate",
  "employee",
  "resume",
  "cv",
  "experience",
  "qualification",
  "job",
  "position",
  "role",
  "salary",
];

/**
 * TRIVIAL PATTERNS
 * Short, conversational phrases that never need KB
 */
const TRIVIAL_EXACT = new Set([
  // Greetings
  "hi",
  "hello",
  "hey",
  "hola",
  "greetings",
  "good morning",
  "good afternoon",
  "good evening",
  "good night",

  // Farewells
  "bye",
  "goodbye",
  "cya",
  "see ya",
  "see you",
  "later",
  "have a good day",
  "have a nice day",
  "take care",

  // Acknowledgments
  "thanks",
  "thank you",
  "thankyou",
  "thx",
  "ty",
  "cool",
  "ok",
  "okay",
  "alright",
  "got it",
  "great",
  "nice",
  "awesome",
  "perfect",
  "sure",

  // Simple responses
  "yes",
  "yep",
  "yeah",
  "yup",
  "no",
  "nope",
  "nah",
]);

/**
 * META PATTERNS
 * Questions about the assistant itself (conversational, no KB)
 */
const META_PATTERNS = [
  "who are you",
  "what are you",
  "how are you",
  "are you real",
  "are you a bot",
  "are you human",
  "are you ai",
  "what can you do",
  "how do you work",
  "what is your name",
  "your name",
];

/**
 * FOLLOW-UP INDICATORS
 * Phrases that suggest using conversation history over fresh KB search
 */
const FOLLOW_UP_STARTS = [
  "tell me more",
  "can you explain",
  "what about",
  "how about",
  "what else",
  "anything else",
  "more details",
  "more info",
  "elaborate",
  "continue",
  "go on",
];

/**
 * Determines if a query needs KB retrieval
 *
 * @param tKeywords - Document-specific keywords from user's uploaded files
 * @param query - User's input query
 * @returns true if KB should be searched, false for generic conversation
 */
export const needTool = ({
  tKeywords,
  query,
}: {
  tKeywords: string[];
  query: string;
}): boolean => {
  const startTime = performance.now();
  const normalized = query.trim().toLowerCase();

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 1: FAST EXITS (trivial, meta, follow-up)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  if (!normalized || normalized.length === 0) return false;
  if (TRIVIAL_EXACT.has(normalized)) return false;

  for (const pattern of META_PATTERNS) {
    if (normalized.includes(pattern)) return false;
  }

  if (normalized.length < 15) {
    for (const start of FOLLOW_UP_STARTS) {
      if (normalized.startsWith(start)) return false;
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 2: OPTIMIZED KEYWORD CHECK
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // ✅ Optimization 1: Dedupe and filter short keywords upfront
  const allKeywords = new Set<string>();
  for (const kw of BASE_KB_KEYWORDS) {
    if (kw.length >= 3) allKeywords.add(kw.toLowerCase());
  }
  for (const kw of tKeywords) {
    if (kw && kw.length >= 3) allKeywords.add(kw.trim().toLowerCase());
  }

  // ✅ Optimization 2: Multi-word phrases first (more specific)
  const phrases: string[] = [];
  const singleWords: string[] = [];

  for (const kw of allKeywords) {
    if (kw.includes(" ")) {
      phrases.push(kw);
    } else {
      singleWords.push(kw);
    }
  }

  // ✅ Check phrases first (fast, high confidence)
  for (const phrase of phrases) {
    if (normalized.includes(phrase)) {
      logDecision(
        true,
        `Phrase: "${phrase}"`,
        query,
        performance.now() - startTime,
      );
      return true;
    }
  }

  // ✅ Optimization 3: Word boundary check for single words (regex cache)
  const queryWords = new Set(normalized.split(/\s+/));
  for (const keyword of singleWords) {
    // Stem matching: "price" matches "pricing", "priced"
    for (const word of queryWords) {
      if (word.startsWith(keyword)) {
        logDecision(
          true,
          `Word: "${keyword}"`,
          query,
          performance.now() - startTime,
        );
        return true;
      }
    }
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STEP 3: DEFAULT TO RAG
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  logDecision(
    true,
    "No keyword, defaulting to RAG",
    query,
    performance.now() - startTime,
  );
  return true;
};

/**
 * Helper: Escape special regex characters in keyword
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Conditional logging for intent decisions
 * Only logs in development or when LOG_INTENT env var is set
 */
function logDecision(
  needsKB: boolean,
  reason: string,
  query: string,
  durationMs: number,
  keywordCount?: number,
): void {
  // Skip logging in production unless explicitly enabled
  if (process.env.NODE_ENV === "production" && !process.env.LOG_INTENT) {
    return;
  }

  const icon = needsKB ? "🔍" : "💬";
  const mode = needsKB ? "KB" : "Generic";
  const queryPreview = query.length > 60 ? query.slice(0, 60) + "..." : query;
  const kwInfo =
    keywordCount !== undefined ? ` | ${keywordCount} keywords` : "";

  console.log(
    `${icon} Intent: ${mode.padEnd(8)} | ${reason.padEnd(25)} | ${durationMs.toFixed(2)}ms${kwInfo} | "${queryPreview}"`,
  );
}
