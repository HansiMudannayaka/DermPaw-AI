/**
 * Safety and Veterinarian Escalation Layer for DermPaw AI
 * 
 * IMPORTANT:
 * This is a transparent, deterministic rule-based safety mechanism.
 * It is NOT a trained statistical risk prediction model.
 * 
 * Checks for clinical red flags, severe distress signs, image quality limitations,
 * low AI confidence, or explicit user requests for professional veterinary attention.
 */

const RED_FLAG_KEYWORDS = [
  {
    category: "severe_bleeding",
    terms: ["bleeding", "blood", "hemorrhage", "dripping blood", "bloody"],
    reason: "Active or severe bleeding reported.",
    level: "VETERINARIAN_REVIEW",
  },
  {
    category: "open_wounds",
    terms: ["open wound", "deep wound", "ulcer", "raw flesh", "torn skin", "open lesion", "exposed skin"],
    reason: "Deep, ulcerated, or open wound detected.",
    level: "VETERINARIAN_REVIEW",
  },
  {
    category: "severe_pain",
    terms: ["severe pain", "crying in pain", "screaming", "whimpering when touched", "extreme pain", "cannot touch"],
    reason: "Signs of severe canine acute pain or vocalization.",
    level: "VETERINARIAN_REVIEW",
  },
  {
    category: "serious_discharge",
    terms: ["pus", "purulent", "green discharge", "yellow foul fluid", "oozing pus", "bad odor", "smelly discharge"],
    reason: "Purulent discharge indicating potential severe secondary deep infection.",
    level: "VETERINARIAN_REVIEW",
  },
  {
    category: "significant_swelling",
    terms: ["huge swelling", "swollen face", "severe swelling", "swollen throat", "rapid swelling", "edema"],
    reason: "Significant or rapid facial/cutaneous swelling.",
    level: "VETERINARIAN_REVIEW",
  },
  {
    category: "rapid_worsening",
    terms: ["spread overnight", "rapidly spreading", "sudden worsening", "spreading very fast", "worse within hours"],
    reason: "Rapidly progressive dermatological lesion.",
    level: "ATTENTION",
  },
  {
    category: "severe_discomfort",
    terms: ["cannot sleep", "scratching until bleeding", "constant biting", "self mutilation", "severe distress"],
    reason: "Severe intractable pruritus interfering with dog's rest and basic welfare.",
    level: "ATTENTION",
  },
  {
    category: "explicit_vet_request",
    terms: ["need a vet", "see a doctor", "veterinarian consultation", "talk to a doctor", "vet review", "emergency"],
    reason: "Pet owner requested direct veterinarian assistance.",
    level: "VETERINARIAN_REVIEW",
  },
];

/**
 * Runs rule-based safety evaluation on user input, reported symptoms, answers, and prediction context.
 * 
 * @param {Object} params
 * @param {string} [params.userMessage] - Recent text sent by user
 * @param {Object} [params.answers] - Key-value map of feature answers
 * @param {number} [params.confidence] - Model prediction confidence (0-100)
 * @param {string} [params.predictionStatus] - Status from prediction API ("predicted", "rejected", "unknown", "retake")
 * @returns {Object} { level: "NORMAL" | "ATTENTION" | "VETERINARIAN_REVIEW", requiresVetReview: boolean, reasons: string[] }
 */
function evaluateSafety({
  userMessage = "",
  answers = {},
  confidence = 100,
  predictionStatus = "predicted",
}) {
  const reasons = [];
  let highestLevel = "NORMAL";

  const normalizeLevel = (newLevel) => {
    const ranks = { NORMAL: 0, ATTENTION: 1, VETERINARIAN_REVIEW: 2 };
    if (ranks[newLevel] > ranks[highestLevel]) {
      highestLevel = newLevel;
    }
  };

  // 1. Text keyword search across user message and answers
  const textCorpus = [
    userMessage,
    ...Object.values(answers).map((v) => (typeof v === "string" ? v : JSON.stringify(v))),
  ].join(" ").toLowerCase();

  for (const rule of RED_FLAG_KEYWORDS) {
    for (const term of rule.terms) {
      if (textCorpus.includes(term)) {
        reasons.push(rule.reason);
        normalizeLevel(rule.level);
        break;
      }
    }
  }

  // 2. Model confidence check
  if (confidence < 45.0 && predictionStatus === "predicted") {
    reasons.push("AI prediction confidence is low (< 45%). Clinical veterinary examination is recommended.");
    normalizeLevel("ATTENTION");
  }

  // 3. Rejection / Unclear image check
  if (predictionStatus === "unknown" || predictionStatus === "rejected") {
    reasons.push("Image pattern is unrecognized or image quality was compromised; in-person veterinary inspection advised.");
    normalizeLevel("ATTENTION");
  }

  const requiresVetReview = highestLevel === "VETERINARIAN_REVIEW" || reasons.length > 0;

  return {
    level: highestLevel,
    requiresVetReview,
    reasons,
  };
}

module.exports = {
  evaluateSafety,
  RED_FLAG_KEYWORDS,
};
