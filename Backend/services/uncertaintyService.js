/**
 * Uncertainty Service for DermPaw AI
 * Computes Shannon entropy and normalized uncertainty from model probability distribution.
 * 
 * Note: These thresholds represent model output distribution spread / uncertainty,
 * not clinically validated medical risk thresholds.
 */

const DEFAULT_CONFIG = {
  // Normalized entropy thresholds
  lowThreshold: 0.38,    // Below this, prediction is concentrated (LOW uncertainty)
  mediumThreshold: 0.72, // Above this, prediction is dispersed / competing (HIGH uncertainty)
  epsilon: 1e-12,
  numClasses: 4, // demodicosis, dermatitis, ringworm, healthy
};

/**
 * Normalizes scores (percentages or raw probabilities) so sum is 1.0.
 * @param {Object} allScores - e.g. { demodicosis: 88.5, dermatitis: 8.2, ringworm: 2.1, healthy: 1.2 }
 * @returns {Object} normalized probabilities map
 */
function normalizeScores(allScores) {
  if (!allScores || typeof allScores !== "object" || Object.keys(allScores).length === 0) {
    return {
      demodicosis: 0.25,
      dermatitis: 0.25,
      ringworm: 0.25,
      healthy: 0.25,
    };
  }

  const keys = Object.keys(allScores);
  const rawSum = keys.reduce((acc, k) => acc + (Number(allScores[k]) || 0), 0);

  if (rawSum <= 0) {
    const uniform = 1 / keys.length;
    const res = {};
    keys.forEach((k) => (res[k] = uniform));
    return res;
  }

  const normalized = {};
  keys.forEach((k) => {
    normalized[k] = Math.max(0, (Number(allScores[k]) || 0) / rawSum);
  });

  return normalized;
}

/**
 * Calculates Shannon entropy and normalized uncertainty level.
 * H(D) = - Σ p_i * log2(p_i)
 * H_max = log2(N)
 * H_norm = H(D) / H_max
 * 
 * @param {Object} allScores - class probabilities or percentages
 * @param {Object} customConfig - optional threshold overrides
 * @returns {Object} { entropy, normalizedEntropy, uncertaintyLevel, probabilities }
 */
function calculateUncertainty(allScores, customConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  const probs = normalizeScores(allScores);
  const probValues = Object.values(probs);
  const numClasses = Math.max(probValues.length, config.numClasses);

  let entropy = 0;
  for (const p of probValues) {
    if (p > config.epsilon) {
      entropy -= p * Math.log2(p);
    }
  }

  // Maximum entropy for uniform distribution across numClasses
  const maxEntropy = Math.log2(numClasses);
  const normalizedEntropy = maxEntropy > 0 ? Math.min(1.0, Math.max(0, entropy / maxEntropy)) : 0;

  let uncertaintyLevel = "LOW";
  if (normalizedEntropy >= config.mediumThreshold) {
    uncertaintyLevel = "HIGH";
  } else if (normalizedEntropy >= config.lowThreshold) {
    uncertaintyLevel = "MEDIUM";
  }

  return {
    entropy: Number(entropy.toFixed(4)),
    normalizedEntropy: Number(normalizedEntropy.toFixed(4)),
    uncertaintyLevel,
    probabilities: probs,
  };
}

module.exports = {
  calculateUncertainty,
  normalizeScores,
  DEFAULT_CONFIG,
};
