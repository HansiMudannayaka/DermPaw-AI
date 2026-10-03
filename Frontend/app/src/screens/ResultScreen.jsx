import React, { useEffect, useRef, useState } from "react";

import {

  View, Text, StyleSheet, TouchableOpacity,

  Image, ScrollView, Animated, Alert,

} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { BACKEND_URL } from "../services/api";



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

  const { photo, base64Image, result, petId, petName } = route.params || {};



  const fadeAnim  = useRef(new Animated.Value(0)).current;

  const slideAnim = useRef(new Animated.Value(50)).current;



  const [isSaved, setIsSaved] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [showGradCam, setShowGradCam] = useState(false);

  const autoSaveAttempted = useRef(false);



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



  // ── Auto-save scan result to database when predicted ─────────────────

  useEffect(() => {

    if (result && result.status === "predicted" && !autoSaveAttempted.current) {

      autoSaveAttempted.current = true;

      saveScanToDatabase(false);

    }

  }, [result]);



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

  const diseaseInfo = result.diseaseInfo || result.disease_info || {};

  const confidence  = result.confidence;

  const allScores   = result.allScores || result.all_scores || {};

  const color       = diseaseInfo.color || "#8A2BE2";

  const iconName    = DISEASE_ICONS[result.disease] || "paw-outline";

  const advice      = DISEASE_ADVICE[result.disease] || diseaseInfo.description;



  const detectedSeverity = diseaseInfo.severity || (isHealthy ? "Low" : (confidence >= 80 ? "High" : "Moderate"));



  const getSeverityColor = () => {

    if (isHealthy) return "#4CAF50";

    if (detectedSeverity === "High") return "#FF5252";

    return "#FFD54F";

  };



  const saveScanToDatabase = async (showAlert = true) => {

    try {

      setIsSaving(true);

      const token = await AsyncStorage.getItem("token");

      const storedActivePet = await AsyncStorage.getItem("activePet");

      let fallbackPet = null;

      if (storedActivePet) {

        try { fallbackPet = JSON.parse(storedActivePet); } catch (_) {}

      }



      const finalPetId = petId || fallbackPet?._id || null;

      const finalPetName = petName || fallbackPet?.name || "";



      const severityMap = { High: "danger", Moderate: "warning", Low: "healthy" };

      const status = isHealthy ? "healthy" : (severityMap[diseaseInfo.severity] || "warning");

      const imageToSave = base64Image || photo || "";



      const res = await fetch(`${BACKEND_URL}/api/scans`, {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Authorization": `Bearer ${token}`

        },

        body: JSON.stringify({

          disease: diseaseInfo.full_name || result.disease,

          status,

          confidence,

          image: imageToSave,

          gradCamImage: result.gradcam_image || "",

          petId: finalPetId,

          petName: finalPetName,

          allScores: allScores || {},

          diseaseInfo: diseaseInfo || {},

        })

      });



      const data = await res.json();

      setIsSaving(false);



      if (data.success) {

        setIsSaved(true);

        if (showAlert) {

          Alert.alert("Saved", "Result & scan image stored successfully in database ✅");

        }

      } else {

        if (showAlert) {

          Alert.alert("Error", data.message || "Failed to save result");

        }

      }

    } catch (err) {

      setIsSaving(false);

      console.log("Error saving scan:", err);

      if (showAlert) {

        Alert.alert("Error", "Server not reachable");

      }

    }

  };



  const handleSave = () => {

    if (isSaved) {

      Alert.alert("Already Saved", "This scan result and image are already saved in your history ✅");

      return;

    }

    saveScanToDatabase(true);

  };



  return (

    <View style={styles.container}>

      {/* Photo */}

      <Image

        source={{ uri: (showGradCam && result.gradcam_image) ? result.gradcam_image : photo }}

        style={styles.image}

      />

      {/* Grad-CAM Active Label Overlay */}
      {showGradCam && result.gradcam_image ? (
        <View style={styles.gradCamBadge}>
          <Ionicons name="sparkles" size={12} color="#FBBF24" />
          <Text style={styles.gradCamBadgeText}>
            Highlighted areas that influenced the AI prediction.
          </Text>
        </View>
      ) : null}



      {/* Back button */}

      <TouchableOpacity

        style={styles.backBtn}

        onPress={() => navigation.goBack()}

      >

        <Ionicons name="arrow-back" size={22} color="white" />

      </TouchableOpacity>



      {/* Grad-CAM Toggle Button */}

      {result.gradcam_image ? (

        <TouchableOpacity

          style={styles.gradCamBtn}

          onPress={() => setShowGradCam(!showGradCam)}

        >

          <Ionicons name={showGradCam ? "eye-off" : "eye"} size={18} color="white" />

          <Text style={styles.gradCamBtnText}>{showGradCam ? "Original" : "AI Map"}</Text>

        </TouchableOpacity>

      ) : null}



      {/* Result sheet */}

      <View style={styles.sheet}>

        <ScrollView showsVerticalScrollIndicator={false}>

          <Animated.View style={{

            opacity  : fadeAnim,

            transform: [{ translateY: slideAnim }]

          }}>







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

              {["demodicosis", "dermatitis", "healthy", "ringworm"].map((cls) => {
                const rawScore = Number(allScores[cls]);
                const hasScore = Number.isFinite(rawScore);
                const score = hasScore ? Math.max(0, Math.min(100, rawScore)) : 0;
                return (
                  <View key={cls} style={styles.scoreRow}>
                    <Text style={styles.scoreCls}>
                      {cls.charAt(0).toUpperCase() + cls.slice(1)}
                    </Text>
                    <View style={styles.scoreBarBg}>
                      <View style={[styles.scoreBarFill, {
                        width: `${score}%`,
                        backgroundColor: cls === result.disease ? color : "#555",
                      }]} />
                    </View>
                    <Text style={styles.scoreVal}>
                      {hasScore ? `${score.toFixed(2)}%` : "—"}
                    </Text>
                  </View>
                );
              })}

            </View>



            {/* Grad-CAM Explanation Card */}

            {result.gradcam_image ? (

              <View style={styles.card}>

                <View style={styles.gradCamCardHeader}>

                  <Ionicons name="eye" size={16} color="#A78BFA" />

                  <Text style={styles.sectionTitle}> AI Attention Map (Grad-CAM)</Text>

                </View>

                <Text style={styles.gradCamTagline}>
                  Highlighted areas that influenced the AI prediction.
                </Text>

                <Text style={styles.gradCamDesc}>
                  Visual explanation showing regions that contributed most to this prediction. Warm colours indicate high model attention. Note: This visualizes computational attention features and is not a confirmed lesion or medical diagnosis.
                </Text>

                <TouchableOpacity

                  style={[styles.gradCamCardBtn, showGradCam && { backgroundColor: "#4B0082" }]}

                  onPress={() => setShowGradCam(!showGradCam)}

                >

                  <Ionicons name={showGradCam ? "eye-off" : "eye"} size={15} color="white" />

                  <Text style={styles.gradCamCardBtnText}>

                    {showGradCam ? "Hide AI Map" : "View AI Map"}

                  </Text>

                </TouchableOpacity>

              </View>

            ) : null}



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



            {/* AI Agent Consultation CTA */}

            <TouchableOpacity

              style={styles.aiAgentBtn}

              onPress={() =>

                navigation.navigate("DermPawAIAgent", {

                  petId,

                  petName,

                  photo,

                  prediction  : result.disease,

                  confidence  : result.confidence,

                  allScores   : allScores,

                  diseaseInfo : diseaseInfo,

                  gradCam     : result.gradcam_image || "",   // AGENT INTEGRATION

                })

              }

            >

              <Ionicons name="sparkles" size={20} color="white" />

              <Text style={styles.aiAgentBtnText}>Ask DermPaw AI</Text>

            </TouchableOpacity>



            {/* Action buttons */}

            <View style={styles.actionRow}>

              <TouchableOpacity

                style={[styles.saveBtn, isSaved && { backgroundColor: "#2E7D32" }]}

                onPress={handleSave}

                disabled={isSaving}

              >

                <Ionicons

                  name={isSaved ? "checkmark-circle" : "bookmark"}

                  size={18}

                  color="white"

                />

                <Text style={styles.btnText}>

                  {isSaved ? "Saved" : (isSaving ? "Saving..." : "Save")}

                </Text>

              </TouchableOpacity>



              <TouchableOpacity

                style={[styles.vetBtn,

                        { backgroundColor: color }]}

                onPress={() =>

                  navigation.navigate("SelectDoctor", {

                    photo,

                    base64Image,

                    result,

                    petId,

                    petName,

                  })}

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
  gradCamBadge: {
    position: "absolute",
    top: 95,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(22, 8, 43, 0.90)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.4)",
    zIndex: 10,
  },
  gradCamBadgeText: {
    color: "#E9D5FF",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 5,
  },
  gradCamTagline: {
    color: "#C084FC",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },


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



  aiAgentBtn: {

    flexDirection: "row",

    backgroundColor: "#6A0DAD",

    paddingVertical: 14,

    borderRadius: 14,

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 12,

    elevation: 4,

    borderWidth: 1,

    borderColor: "rgba(255, 255, 255, 0.2)",

    gap: 8,

  },

  aiAgentBtnText: {

    color: "white",

    fontWeight: "800",

    fontSize: 16,

    letterSpacing: 0.3,

  },



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



  // ── Grad-CAM overlay toggle button (top-right of image) ─────────────

  gradCamBtn: {

    position       : "absolute",

    top            : 50,

    right          : 20,

    flexDirection  : "row",

    alignItems     : "center",

    backgroundColor: "rgba(74,20,140,0.85)",

    paddingVertical: 7,

    paddingHorizontal: 12,

    borderRadius   : 20,

    borderWidth    : 1,

    borderColor    : "#A78BFA",

  },

  gradCamBtnText: {

    color     : "white",

    fontSize  : 13,

    fontWeight: "600",

    marginLeft: 5,

  },



  // ── Grad-CAM explanation card styles ────────────────────────────────

  gradCamCardHeader: {

    flexDirection : "row",

    alignItems    : "center",

    marginBottom  : 8,

  },

  gradCamDesc: {

    color     : "#ccc",

    fontSize  : 13,

    lineHeight: 20,

    marginBottom: 12,

  },

  gradCamCardBtn: {

    flexDirection  : "row",

    alignItems     : "center",

    backgroundColor: "#8A2BE2",

    paddingVertical: 9,

    paddingHorizontal: 16,

    borderRadius   : 10,

    alignSelf      : "flex-start",

  },

  gradCamCardBtnText: {

    color     : "white",

    fontWeight: "700",

    fontSize  : 13,

    marginLeft: 6,

  },

});