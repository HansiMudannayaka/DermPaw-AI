import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, ScrollView, Animated, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DISEASE_ICONS = {
  demodicosis: "bug-outline",
  dermatitis : "flame-outline",
  ringworm   : "nuclear-outline",
  healthy    : "heart-outline",
};

const DISEASE_ADVICE = {
  demodicosis: "Keep the affected area clean and dry. Avoid contact with other dogs. Consult a vet for medicated shampoo or topical treatments.",
  dermatitis : "Identify and remove allergens. Keep skin moisturized. Avoid scratching. Visit a vet for antihistamines or steroids if severe.",
  ringworm   : "Isolate your dog from other pets and humans — ringworm is contagious. Use antifungal medication prescribed by your vet.",
  healthy    : "Your dog's skin appears healthy! Continue regular grooming and annual vet checkups to maintain good skin health.",
};

export default function ResultScreen({ route, navigation }) {
  const { photo, result, petId, petName } = route.params;

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 600, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ── Handle non-predicted results ─────────────────────────────────────
  if (!result || result.status !== "predicted") {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo }} style={styles.image} />
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={22} color="white" />
        </TouchableOpacity>
        <View style={styles.sheet}>
          <View style={styles.loadingBox}>
            <Ionicons name="warning-outline" size={50} color="#FFD54F" />
            <Text style={styles.loadingTitle}>Result Unavailable</Text>
            <Text style={styles.loadingSub}>
              {result?.message || "Please retake the photo and try again."}
            </Text>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => navigation.navigate("GuideCamera")}
            >
              <Ionicons name="camera" size={18} color="white" />
              <Text style={styles.btnText}> Retake Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // ── Predicted result ──────────────────────────────────────────────────
  const isHealthy   = result.disease === "healthy";
  const diseaseInfo = result.disease_info || {};
  const confidence  = result.confidence;
  const allScores   = result.all_scores || {};
  const color       = diseaseInfo.color || "#8A2BE2";
  const iconName    = DISEASE_ICONS[result.disease] || "paw-outline";
  const advice      = DISEASE_ADVICE[result.disease] || diseaseInfo.description;

  const getSeverityColor = () => {
    if (isHealthy) return "#4CAF50";
    if (diseaseInfo.severity === "High") return "#FF5252";
    return "#FFD54F";
  };

  const handleSave = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const severityMap = { High: "danger", Moderate: "warning", Low: "healthy" };
      const status = isHealthy ? "healthy" : (severityMap[diseaseInfo.severity] || "warning");

      const res = await fetch("http://172.20.10.4:8000/api/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          disease: diseaseInfo.full_name || result.disease,
          status,
          confidence,
          image: photo || "",
          petId: petId || null,
          petName: petName || "",
        })
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert("Saved", "Result stored successfully in scan history ✅");
      } else {
        Alert.alert("Error", data.message || "Failed to save result");
      }
    } catch (err) {
      console.log("Error saving scan:", err);
      Alert.alert("Error", "Server not reachable");
    }
  };

  return (
    <View style={styles.container}>
      {/* Photo */}
      <Image source={{ uri: photo }} style={styles.image} />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={22} color="white" />
      </TouchableOpacity>

      {/* Result sheet */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Animated.View style={{
            opacity  : fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}>

            {/* Severity badge */}
            <View style={[styles.levelBadge,
                          { borderColor: getSeverityColor() }]}>
              <Text style={[styles.levelText,
                            { color: getSeverityColor() }]}>
                {isHealthy ? "✅ HEALTHY" :
                  diseaseInfo.severity === "High"
                    ? "🔴 HIGH RISK"
                    : "🟡 MODERATE RISK"}
              </Text>
            </View>

            {/* Disease name */}
            <Text style={styles.diseaseTitle}>
              {diseaseInfo.full_name || result.disease}
            </Text>

            {/* Icon */}
            <View style={[styles.iconCircle,
                          { backgroundColor: color + "22" }]}>
              <Ionicons name={iconName} size={40} color={color} />
            </View>

            {/* Confidence bar */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Confidence Level</Text>
              <View style={styles.barBg}>
                <View style={[styles.barFill, {
                  width          : `${confidence}%`,
                  backgroundColor: color,
                }]} />
              </View>
              <Text style={styles.percentText}>
                {confidence}% Match
              </Text>
            </View>

            {/* All scores */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>All Class Scores</Text>
              {Object.entries(allScores).map(([cls, score]) => (
                <View key={cls} style={styles.scoreRow}>
                  <Text style={styles.scoreCls}>
                    {cls.charAt(0).toUpperCase() + cls.slice(1)}
                  </Text>
                  <View style={styles.scoreBarBg}>
                    <View style={[styles.scoreBarFill, {
                      width          : `${score}%`,
                      backgroundColor: cls === result.disease
                                       ? color : "#555",
                    }]} />
                  </View>
                  <Text style={styles.scoreVal}>{score}%</Text>
                </View>
              ))}
            </View>

            {/* AI Advice */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>AI Advice</Text>
              <Text style={styles.adviceText}>{advice}</Text>
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Ionicons name="information-circle"
                        size={16} color="#FFD54F" />
              <Text style={styles.disclaimerText}>
                This result is AI-generated. Always consult a
                veterinarian for professional diagnosis.
              </Text>
            </View>

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSave}
              >
                <Ionicons name="bookmark" size={18} color="white" />
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.vetBtn,
                        { backgroundColor: color }]}
                onPress={() =>
                  navigation.navigate("SelectDoctor", { photo, result })}
              >
                <Ionicons name="medkit" size={18} color="white" />
                <Text style={styles.btnText}>
                  {isHealthy ? "Vet Checkup" : "Consult Vet"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scan again */}
            <TouchableOpacity
              style={styles.scanAgainBtn}
              onPress={() => navigation.navigate("GuideCamera")}
            >
              <Ionicons name="camera" size={18} color="white" />
              <Text style={styles.btnText}> Scan Again</Text>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container       : { flex: 1, backgroundColor: "#000" },
  image           : { width: "100%", height: "45%" },

  backBtn: {
    position     : "absolute",
    top          : 50,
    left         : 20,
    backgroundColor: "#4B0082",
    padding      : 10,
    borderRadius : 30,
  },

  sheet: {
    flex              : 1,
    backgroundColor   : "#2A0A4A",
    marginTop         : -25,
    borderTopLeftRadius : 30,
    borderTopRightRadius: 30,
    padding           : 20,
  },

  loadingBox      : { alignItems: "center", marginTop: 60 },
  loadingTitle    : { color: "white", fontSize: 18,
                      fontWeight: "bold", marginTop: 10 },
  loadingSub      : { color: "#ccc", marginTop: 5,
                      textAlign: "center", lineHeight: 22 },

  retakeBtn: {
    flexDirection  : "row",
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius   : 14,
    marginTop      : 20,
    alignItems     : "center",
  },

  levelBadge: {
    alignSelf        : "center",
    borderWidth      : 1.5,
    paddingVertical  : 6,
    paddingHorizontal: 14,
    borderRadius     : 20,
    marginBottom     : 10,
  },
  levelText       : { fontSize: 12, fontWeight: "bold" },

  diseaseTitle    : {
    fontSize   : 22,
    fontWeight : "bold",
    color      : "white",
    textAlign  : "center",
    marginTop  : 5,
    marginBottom: 10,
  },

  iconCircle: {
    width          : 70,
    height         : 70,
    borderRadius   : 35,
    justifyContent : "center",
    alignItems     : "center",
    alignSelf      : "center",
    marginBottom   : 16,
  },

  card: {
    backgroundColor: "rgba(75,0,130,0.35)",
    padding        : 15,
    borderRadius   : 15,
    marginBottom   : 15,
    borderWidth    : 1,
    borderColor    : "rgba(138,43,226,0.2)",
  },
  sectionTitle    : { color: "#fff", fontSize: 14,
                      fontWeight: "600", marginBottom: 10 },

  barBg: {
    width          : "100%",
    height         : 10,
    backgroundColor: "#1A0A2E",
    borderRadius   : 10,
    overflow       : "hidden",
  },
  barFill         : { height: 10, borderRadius: 10 },
  percentText     : { color: "#ccc", marginTop: 8 },

  scoreRow        : { flexDirection: "row", alignItems: "center",
                      marginBottom: 8 },
  scoreCls        : { color: "#ccc", width: 95, fontSize: 13 },
  scoreBarBg      : {
    flex           : 1,
    height         : 6,
    backgroundColor: "#333",
    borderRadius   : 3,
    overflow       : "hidden",
    marginHorizontal: 8,
  },
  scoreBarFill    : { height: "100%", borderRadius: 3 },
  scoreVal        : { color: "#ccc", fontSize: 12,
                      width: 38, textAlign: "right" },

  adviceText      : { color: "#ddd", lineHeight: 20 },

  disclaimer: {
    flexDirection  : "row",
    backgroundColor: "rgba(255,213,79,0.1)",
    borderRadius   : 12,
    padding        : 12,
    marginBottom   : 16,
    alignItems     : "flex-start",
  },
  disclaimerText  : { color: "#FFD54F", fontSize: 12,
                      marginLeft: 8, flex: 1, lineHeight: 18 },

  actionRow       : {
    flexDirection  : "row",
    justifyContent : "space-between",
    marginBottom   : 12,
  },
  saveBtn: {
    flex           : 1,
    flexDirection  : "row",
    backgroundColor: "#8A2BE2",
    padding        : 12,
    borderRadius   : 12,
    marginRight    : 10,
    justifyContent : "center",
    alignItems     : "center",
  },
  vetBtn: {
    flex           : 1,
    flexDirection  : "row",
    padding        : 12,
    borderRadius   : 12,
    justifyContent : "center",
    alignItems     : "center",
  },
  btnText         : { color: "white", fontWeight: "bold", marginLeft: 6 },

  scanAgainBtn: {
    flexDirection  : "row",
    backgroundColor: "#4B0082",
    padding        : 14,
    borderRadius   : 14,
    justifyContent : "center",
    alignItems     : "center",
    marginBottom   : 30,
  },
});