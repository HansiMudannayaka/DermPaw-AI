import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#3A0070";
const BG = "#F4F5FA";

export default function SummaryScreen({ route, navigation }) {
  const [submitted, setSubmitted] = useState(false);

  const {
    consultation,
    diagnosis,
    severity = "Severe",
    recommendation,
    notes = "Large area of inflammation with moist lesions. Immediate treatment required.",
  } = route.params || {};

  const petName = consultation?.petName || route.params?.petName || "Luna";

  let petImage = route.params?.petImage || require("../../../assets/images/dog1.png");
  if (consultation?.petImage && consultation.petImage.startsWith("http")) {
    petImage = { uri: consultation.petImage };
  }

  const breed = "Golden Retriever";
  const age = "2Y";
  const gender = "Female";

  const disease = consultation?.aiResult?.disease || route.params?.disease || "Skin Scan";
  const confidence = consultation?.aiResult?.confidence ? `${consultation.aiResult.confidence}%` : (route.params?.confidence || "92%");

  const handleNotify = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const adviceText = `Diagnosis: ${diagnosis}\nSeverity: ${severity}\nRecommendations: ${recommendation}\nNotes: ${notes}`;
      
      const res = await fetch(`http://172.20.10.4:8000/api/consultations/${consultation._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          status: "approved",
          advice: adviceText
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        Alert.alert("Error", data.message || "Failed to submit review");
      }
    } catch (err) {
      console.log("Error submitting vet review:", err);
      Alert.alert("Error", "Server not reachable");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Review Summary</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* PET CARD */}
      <View style={styles.petCard}>
        <Image source={petImage} style={styles.avatar} />
        <View>
          <Text style={styles.petName}>{petName}</Text>
          <Text style={styles.petSub}>
            {breed} • {age} • {gender}
          </Text>
        </View>
      </View>

      {/* AI ANALYSIS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>AI Analysis</Text>

        <Text style={styles.disease}>{disease}</Text>
        <Text style={styles.confidence}>Confidence: {confidence}</Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>High</Text>
        </View>
      </View>

      {/* EXPERT REVIEW */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Expert Review</Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Diagnosis</Text>
          <Text style={styles.value}>{diagnosis || disease}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Severity</Text>
          <Text style={styles.severe}>{severity}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Recommendation</Text>
          <Text style={styles.value}>
            {typeof recommendation === "string"
              ? recommendation
              : (recommendation || []).join("\n")}
          </Text>
        </View>

        {/* ================= HCI IMPROVED NOTES ONLY ================= */}
        <View style={styles.infoRow}>
          <Text style={styles.label}>Clinical Notes</Text>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              {notes?.trim()
                ? notes
                : "No clinical notes provided by the doctor."}
            </Text>
          </View>
        </View>
      </View>

      {/* SUCCESS BOX */}
      {submitted && (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.successText}>
              Review Submitted Successfully!
            </Text>
            <Text style={styles.successSub}>
              Pet owner will be notified.
            </Text>
          </View>
        </View>
      )}

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!submitted) {
            handleNotify();
          } else {
            navigation.navigate("DoctorHome");
          }
        }}
      >
        <Ionicons name="paper-plane" size={18} color="#fff" />
        <Text style={styles.buttonText}>
          {submitted ? "Continue" : "Notify Pet Owner"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  petCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    elevation: 4,
  },

  avatar: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginRight: 12,
  },

  petName: {
    fontSize: 18,
    fontWeight: "700",
  },

  petSub: {
    fontSize: 13,
    color: "#777",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    marginTop: 15,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  disease: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },

  confidence: {
    fontSize: 12,
    color: "#666",
  },

  badge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  infoRow: {
    marginTop: 12,
  },

  label: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    lineHeight: 20,
  },

  severe: {
    color: "#FF3B30",
    fontWeight: "700",
    fontSize: 14,
  },

  /* ================= HCI NOTE BOX ================= */
  noteBox: {
    marginTop: 6,
    backgroundColor: "#F7F7FB",
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },

  noteText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },

  successBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    padding: 14,
    borderRadius: 14,
    marginTop: 15,
  },

  successText: {
    fontWeight: "700",
    color: "#2E7D32",
  },

  successSub: {
    fontSize: 12,
    color: "#2E7D32",
  },

  button: {
    marginTop: 20,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 3,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});