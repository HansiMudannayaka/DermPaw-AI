/**
 * Veterinary RAG (Retrieval-Augmented Generation) Service for DermPaw AI
 * 
 * Provides evidence-grounded search across curated veterinary dermatological literature.
 * Preserves source metadata for all retrieved evidence snippets.
 */

const path = require("path");
const fs = require("fs");

let KNOWLEDGE_BASE = [];

try {
  const filePath = path.join(__dirname, "..", "knowledge", "veterinary_knowledge.json");
  const raw = fs.readFileSync(filePath, "utf-8");
  KNOWLEDGE_BASE = JSON.parse(raw);
} catch (err) {
  console.warn("⚠️ Warning: Could not load veterinary_knowledge.json:", err.message);
  KNOWLEDGE_BASE = [];
}

/**
 * Searches veterinary knowledge base for relevant chunks.
 * 
 * @param {string} query - User search query or symptoms string
 * @param {string} [targetDisease] - Target disease ("demodicosis" | "dermatitis" | "ringworm")
 * @param {number} [topK=3] - Number of top results to return
 * @returns {Array} List of evidence chunks with title, disease, content, source, relevance score
 */
function searchVeterinaryKnowledge(query = "", targetDisease = "", topK = 3) {
  if (!query && !targetDisease) {
    return KNOWLEDGE_BASE.slice(0, topK).map((item) => ({
      ...item,
      relevance: 1.0,
    }));
  }

  const queryTerms = (query || "")
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);

  const diseaseTerm = (targetDisease || "").toLowerCase();

  const scored = KNOWLEDGE_BASE.map((doc) => {
    let score = 0;

    // Disease match bonus
    if (diseaseTerm && doc.disease.toLowerCase() === diseaseTerm) {
      score += 4.0;
    }

    // Keyword matching
    for (const kw of doc.keywords || []) {
      for (const term of queryTerms) {
        if (kw.includes(term) || term.includes(kw)) {
          score += 2.0;
        }
      }
    }

    // Content text matching
    const contentLower = doc.content.toLowerCase();
    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        score += 1.0;
      }
    }

    return {
      id: doc.id,
      title: doc.title,
      disease: doc.disease,
      content: doc.content,
      source: doc.source,
      relevance: Number(score.toFixed(2)),
    };
  });

  // Sort descending by relevance score
  scored.sort((a, b) => b.relevance - a.relevance);

  return scored.slice(0, topK);
}

module.exports = {
  searchVeterinaryKnowledge,
  KNOWLEDGE_BASE,
};
