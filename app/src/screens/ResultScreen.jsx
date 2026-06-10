import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ResultScreen({ route, navigation }) {
  const { photo } = route.params;

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    setTimeout(() => {
      setResult({
        disease: "Canine Atopic Dermatitis",
        label: "Skin Allergy Detected",
        confidence: 87,
        status: "warning",
        advice:
          "Keep affected area clean, avoid scratching, and monitor spreading. Visit a vet if symptoms worsen.",
      });
      setLoading(false);
    }, 2000);
  }, []);

  const getColor = () => {
    if (!result) return "#fff";
    if (result.status === "healthy") return "#69F0AE";
    if (result.status === "warning") return "#FFD54F";
    return "#FF5252";
  };

  const getLevelText = () => {
    if (!result) return "";
    if (result.status === "healthy") return "LOW RISK";
    if (result.status === "warning") return "MODERATE RISK";
    return "HIGH RISK";
  };

  return (
    <View style={styles.container}>
      {/* IMAGE */}
      <Image source={{ uri: photo }} style={styles.image} />

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="white" />
      </TouchableOpacity>

      {/* SHEET */}
      <View style={styles.sheet}>
        {loading ? (
          <View style={styles.loadingBox}>
            <Ionicons name="scan" size={45} color="#8A2BE2" />
            <Text style={styles.loadingTitle}>AI Scanning...</Text>
            <Text style={styles.loadingSub}>
              Detecting skin condition patterns
            </Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* LEVEL BADGE */}
            <View style={[styles.levelBadge, { borderColor: getColor() }]}>
              <Text style={[styles.levelText, { color: getColor() }]}>
                {getLevelText()}
              </Text>
            </View>

            {/* DISEASE */}
            <Text style={styles.diseaseTitle}>{result.disease}</Text>

            {/* LABEL */}
            <Text style={[styles.resultLabel, { color: getColor() }]}>
              {result.label}
            </Text>

            {/* CONFIDENCE */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Confidence Level</Text>

              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${result.confidence}%`,
                      backgroundColor: getColor(),
                    },
                  ]}
                />
              </View>

              <Text style={styles.percentText}>
                {result.confidence}% Match
              </Text>
            </View>

            {/* ADVICE */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AI Advice</Text>
              <Text style={styles.adviceText}>{result.advice}</Text>
            </View>

            {/* ACTIONS */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={() =>
                  Alert.alert("Saved", "Result stored successfully")
                }
              >
                <Ionicons name="bookmark" size={18} color="white" />
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>

              {/* ✅ VET REVIEW NAVIGATION FIXED */}
              <TouchableOpacity
                style={styles.vetBtn}
                onPress={() =>
                  navigation.navigate("SelectDoctor", {
                    photo,
                    result,
                  })
                }
              >
                <Ionicons name="medkit" size={18} color="white" />
                <Text style={styles.btnText}>Vet Review</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  image: {
    width: "100%",
    height: "50%",
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#4B0082",
    padding: 10,
    borderRadius: 30,
  },

  sheet: {
    flex: 1,
    backgroundColor: "#2A0A4A",
    marginTop: -25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  loadingBox: {
    alignItems: "center",
    marginTop: 60,
  },

  loadingTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },

  loadingSub: {
    color: "#ccc",
    marginTop: 5,
  },

  levelBadge: {
    alignSelf: "center",
    borderWidth: 1.5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 10,
  },

  levelText: {
    fontSize: 12,
    fontWeight: "bold",
  },

  diseaseTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginTop: 5,
  },

  resultLabel: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
    marginTop: 5,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "rgba(75,0,130,0.35)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(138,43,226,0.2)",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 10,
  },

  barBg: {
    width: "100%",
    height: 10,
    backgroundColor: "#1A0A2E",
    borderRadius: 10,
  },

  barFill: {
    height: 10,
    borderRadius: 10,
  },

  percentText: {
    color: "#ccc",
    marginTop: 8,
  },

  adviceText: {
    color: "#ddd",
    lineHeight: 20,
  },

  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  saveBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#8A2BE2",
    padding: 12,
    borderRadius: 12,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  vetBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#6A1B9A",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 6,
  },
});