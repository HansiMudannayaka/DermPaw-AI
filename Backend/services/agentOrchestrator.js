/**
 * Chatbot Orchestrator for DermPaw AI
 * 
 * Coordinates tools:
 * 1. getDogProfile
 * 2. getLatestPrediction
 * 3. computeSessionUncertainty
 * 4. searchVeterinaryKnowledge
 * 5. safetyCheck
 * 6. createVeterinarianReview
 * 7. initializeSession
 * 8. processUserMessage
 */

const Pet = require("../models/Pet");
const Scan = require("../models/Scan");
const Consultation = require("../models/Consultation");
const AgentSession = require("../models/AgentSession");
const AgentEvaluationLog = require("../models/AgentEvaluationLog");

const { calculateUncertainty } = require("./uncertaintyService");
const { evaluateSafety } = require("./safetyEscalationService");
const { searchVeterinaryKnowledge } = require("./veterinaryRagService");
const { generateResponse } = require("./llmService");

/**
 * 1. Tool: getDogProfile
 */
async function getDogProfile(petId) {
  if (!petId) return null;
  try {
    return await Pet.findById(petId);
  } catch {
    return null;
  }
}

/**
 * 2. Tool: getLatestPrediction
 */
function getLatestPrediction(session) {
  if (!session || !session.prediction) return null;
  return {
    disease: session.prediction.disease,
    confidence: session.prediction.confidence,
    allScores: session.prediction.allScores,
    diseaseInfo: session.prediction.diseaseInfo,
  };
}

/**
 * 3. Tool: calculateUncertainty
 */
function computeSessionUncertainty(allScores) {
  return calculateUncertainty(allScores);
}

/**
 * 4. Tool: searchVeterinaryKnowledge
 */
function searchKnowledge(query, disease) {
  return searchVeterinaryKnowledge(query, disease, 3);
}

/**
 * 5. Tool: safetyCheck
 */
function runSafetyCheck({ userMessage, confidence, predictionStatus }) {
  return evaluateSafety({ userMessage, confidence, predictionStatus });
}

/**
 * 6. Tool: createVeterinarianReview
 */
async function createVeterinarianReview({ session, doctorId, adviceNotes }) {
  if (!session) throw new Error("Session required for veterinarian escalation");

  const petName = session.pet ? (await Pet.findById(session.pet))?.name : "My Dog";

  const consultation = new Consultation({
    doctor: doctorId,
    owner: session.owner,
    petName,
    petImage: session.prediction?.image || "",
    aiResult: {
      disease: session.prediction?.disease,
      confidence: session.prediction?.confidence,
      allScores: session.prediction?.allScores,
      uncertainty: session.uncertainty,
      safety: session.safety,
      gradCam: session.prediction?.gradCamImage || "",
    },
    status: "pending",
    advice: adviceNotes || "AI Chatbot Escalation: Requires clinical veterinarian examination.",
  });

  await consultation.save();

  session.status = "escalated";
  session.consultation = consultation._id;
  session.safety.requiresVetReview = true;
  if (!session.safety.reasons.includes("Case escalated to veterinarian for review.")) {
    session.safety.reasons.push("Case escalated to veterinarian for review.");
  }
  await session.save();

  return consultation;
}

/**
 * 7. Initial Session Creator
 */
async function initializeSession({
  ownerId,
  petId = null,
  scanId = null,
  prediction = {},
  image = "",
  gradCamImage = "",
}) {
  const disease = prediction?.disease || null;
  const confidence = Number(prediction?.confidence) || 0;
  const allScores = prediction?.allScores || {};
  const diseaseInfo = prediction?.diseaseInfo || {};

  const uncertainty = calculateUncertainty(allScores);
  const dogProfile = await getDogProfile(petId);
  const dogName = dogProfile ? dogProfile.name : "your dog";

  const safety = runSafetyCheck({
    confidence,
    predictionStatus: disease ? "predicted" : "unknown",
  });

  // Initial introductory message explaining result context and inviting questions
  let greetingContent = "";
  if (!disease) {
    greetingContent =
      `Hello! I am your DermPaw AI Assistant.\n\n` +
      `Skin image prediction is currently unavailable. Feel free to ask me any questions about dog skin conditions, symptoms, or when to see a veterinarian.`;
  } else if (disease === "healthy") {
    greetingContent =
      `Hello! I am your DermPaw AI Assistant.\n\n` +
      `The DermPaw AI model analyzed the skin image and identified it as **Healthy Skin** with **${confidence}% confidence**.\n\n` +
      `• The AI model did not identify one of the three target skin conditions (Demodicosis, Dermatitis, Ringworm) with high confidence.\n` +
      `• Feel free to ask me any questions or use the quick buttons below.`;
  } else {
    greetingContent =
      `Hello! I am your DermPaw AI Assistant.\n\n` +
      `The image-based model identified **${diseaseInfo.full_name || disease}** as the most likely condition with **${confidence}% confidence**.\n\n` +
      `• **Model Uncertainty**: ${uncertainty.uncertaintyLevel} (Normalized Entropy: ${uncertainty.normalizedEntropy})\n` +
      `• **Notice**: This AI result is informational and not a confirmed veterinary diagnosis.\n\n` +
      `What would you like to know about ${dogName}'s skin result?`;
  }

  const initialMessages = [
    {
      role: "agent",
      type: "text",
      content: greetingContent,
      timestamp: new Date(),
    },
  ];

  const session = new AgentSession({
    owner: ownerId,
    pet: petId || null,
    scan: scanId || null,
    prediction: {
      disease,
      confidence,
      allScores,
      diseaseInfo,
      image: image || "",
      gradCamImage: gradCamImage || "",
    },
    uncertainty: {
      entropy: uncertainty.entropy,
      normalizedEntropy: uncertainty.normalizedEntropy,
      level: uncertainty.uncertaintyLevel,
    },
    messages: initialMessages,
    safety,
    status: "active",
  });

  await session.save();

  return {
    session,
    messages: session.messages,
    uncertainty: session.uncertainty,
    safety: session.safety,
  };
}

/**
 * 8. Main User Message Processor (Free-Text Chat)
 */
async function processUserMessage({ session, messageText = "", actionIntent = "" }) {
  const dogProfile = await getDogProfile(session.pet);
  const dogName = dogProfile ? dogProfile.name : "your dog";
  const pred = session.prediction || {};
  const disease = pred.disease || null;
  const confidence = Number(pred.confidence) || 0;
  const allScores = pred.allScores || {};

  // 1. Safety check
  const safety = runSafetyCheck({
    userMessage: messageText,
    confidence,
    predictionStatus: disease ? "predicted" : "unknown",
  });
  session.safety = safety;

  // 2. Identify intent if applicable
  const lowerMsg = (messageText || "").toLowerCase();
  let intent = "general";

  if (actionIntent) {
    intent = actionIntent;
  } else if (lowerMsg.includes("what does") || lowerMsg.includes("result mean") || lowerMsg.includes("explain")) {
    intent = "what_does_result_mean";
  } else if (lowerMsg.includes("tell me about") || lowerMsg.includes("information") || lowerMsg.includes("about this condition")) {
    intent = "tell_about_condition";
  } else if (lowerMsg.includes("should i see") || lowerMsg.includes("doctor") || lowerMsg.includes("vet")) {
    intent = "should_see_vet";
  }

  // 3. Search RAG
  const evidence = searchKnowledge(messageText || disease || "", disease || "");

  // 4. Generate LLM response with conversational context
  const llmResult = await generateResponse({
    intent,
    prediction: pred,
    uncertainty: session.uncertainty,
    evidence,
    safety,
    userMessage: messageText,
    petName: dogName,
    dogProfile,
    conversationHistory: session.messages,
  });

  const responseContent = typeof llmResult === "string" ? llmResult : llmResult.content;
  const evidenceSources = (llmResult && llmResult.evidenceSources) || evidence.map((e) => ({ title: e.title, source: e.source }));

  // Record user message
  if (messageText) {
    session.messages.push({
      role: "user",
      type: "text",
      content: messageText,
      timestamp: new Date(),
    });
  }

  // Record agent response
  const isEscalation = safety.requiresVetReview && (intent === "should_see_vet" || safety.level === "VETERINARIAN_REVIEW");
  session.messages.push({
    role: "agent",
    type: isEscalation ? "escalation" : "text",
    content: responseContent,
    evidenceSources,
    timestamp: new Date(),
  });

  await session.save();

  // 5. Log evaluation entry
  try {
    await AgentEvaluationLog.create({
      sessionId: session._id,
      userQuery: messageText || actionIntent || "",
      initialPrediction: {
        disease,
        confidence,
        allScores,
      },
      uncertainty: session.uncertainty,
      ragSources: evidence,
      agentActions: [
        { tool: "evaluateSafety" },
        { tool: "searchVeterinaryKnowledge" },
        { tool: "generateResponse" },
      ],
      safetyResult: safety,
      veterinarianEscalation: {
        escalated: session.status === "escalated",
        consultationId: session.consultation,
      },
    });
  } catch (err) {
    console.error("Evaluation log error on message:", err);
  }

  return {
    sessionId: session._id,
    type: isEscalation ? "escalation" : "answer",
    message: responseContent,
    prediction: {
      disease,
      confidence,
      allScores,
      diseaseInfo: pred.diseaseInfo,
    },
    uncertainty: session.uncertainty,
    safety: session.safety,
    messages: session.messages,
  };
}

module.exports = {
  getDogProfile,
  getLatestPrediction,
  computeSessionUncertainty,
  searchKnowledge,
  runSafetyCheck,
  createVeterinarianReview,
  initializeSession,
  processUserMessage,
};
