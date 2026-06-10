import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const PRIMARY = "#3A0070";
const BG = "#F4F5FA";

export default function AddReviewScreen({ navigation }) {
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(
    "Hot Spot (Acute Moist Dermatitis)"
  );
  const [customDiagnosis, setCustomDiagnosis] = useState("");
  const [severity, setSeverity] = useState("Severe");
  const [notes, setNotes] = useState("");

  const [recommendations, setRecommendations] = useState({
    vet: true,
    exam: true,
    monitor: false,
    followup: false,
  });

  const toggleCheck = (key) => {
    setRecommendations({ ...recommendations, [key]: !recommendations[key] });
  };

  const isOtherSelected = selectedDiagnosis === "Other";

  /* ================= SUBMIT ================= */

  const handleSubmit = () => {
    // ✅ FIX: lock correct diagnosis value
    const diagnosisToSend =
      selectedDiagnosis === "Other"
        ? customDiagnosis.trim()
        : selectedDiagnosis;

    if (selectedDiagnosis === "Other" && !diagnosisToSend) {
      Alert.alert("Validation", "Please enter custom diagnosis");
      return;
    }

    if (!notes.trim()) {
      Alert.alert("Validation", "Please enter clinical notes");
      return;
    }

    const recommendationMap = {
      vet: "Immediate vet consultation",
      exam: "In-person examination",
      monitor: "Monitor at home",
      followup: "Follow up in 2-3 days",
    };

    const selectedRecommendations = Object.keys(recommendations)
      .filter((key) => recommendations[key])
      .map((key) => recommendationMap[key]);

    const finalRecommendations =
      selectedRecommendations.length > 0
        ? selectedRecommendations
        : ["Immediate vet consultation"];

    console.log("DIAGNOSIS SENT:", diagnosisToSend);

    navigation.navigate("Summary", {
      diagnosis: diagnosisToSend, // ✅ FIXED
      severity: severity,
      recommendation: finalRecommendations.join("\n"),
      notes: notes,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Expert Review</Text>

        <View style={{ width: 40 }} />
      </View>

      {/* PET INFO */}
      <View style={styles.petCard}>
        <Image
          source={require("../../../assets/images/dog1.png")}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.petName}>Luna</Text>
          <Text style={styles.petSub}>
            Golden Retriever • 2Y • Female
          </Text>
        </View>
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clinical Assessment</Text>

        <Text style={styles.label}>Diagnosis</Text>

        {["Hot Spot (Acute Moist Dermatitis)", "Ringworm", "Other"].map(
          (item) => {
            const active = selectedDiagnosis === item;

            return (
              <TouchableOpacity
                key={item}
                style={styles.radioRow}
                onPress={() => setSelectedDiagnosis(item)}
              >
                <View style={[styles.radioOuter, active && styles.radioActive]}>
                  {active && <View style={styles.radioInner} />}
                </View>

                <Text style={styles.radioText}>{item}</Text>
              </TouchableOpacity>
            );
          }
        )}

        {isOtherSelected && (
          <TextInput
            style={styles.input}
            placeholder="Write custom diagnosis..."
            value={customDiagnosis}
            onChangeText={setCustomDiagnosis}
          />
        )}

        <Text style={styles.label}>Severity</Text>

        <View style={styles.severityRow}>
          {["Mild", "Moderate", "Severe"].map((item) => {
            const active = severity === item;

            return (
              <TouchableOpacity
                key={item}
                style={[styles.severityBtn, active && styles.severityActive]}
                onPress={() => setSeverity(item)}
              >
                <Text
                  style={[
                    styles.severityText,
                    active && { color: "#fff" },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.notes}
          multiline
          placeholder="Enter clinical notes..."
          value={notes}
          onChangeText={setNotes}
        />

        <Text style={styles.sectionTitle}>Recommendations</Text>

        {[
          { key: "vet", label: "Immediate vet consultation" },
          { key: "exam", label: "In-person examination" },
          { key: "monitor", label: "Monitor at home" },
          { key: "followup", label: "Follow up in 2-3 days" },
        ].map((item) => {
          const checked = recommendations[item.key];

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.checkRow}
              onPress={() => toggleCheck(item.key)}
            >
              <Ionicons
                name={checked ? "checkbox" : "square-outline"}
                size={20}
                color={checked ? PRIMARY : "#aaa"}
              />
              <Text style={styles.checkText}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        activeOpacity={0.85}
        onPress={handleSubmit}
      >
        <Text style={styles.submitText}>Submit Review</Text>
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
    justifyContent: "space-between",
    marginTop: 50,
    alignItems: "center",
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
  label: {
    fontSize: 13,
    color: "#666",
    marginTop: 12,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#ccc",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  radioActive: {
    borderColor: PRIMARY,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
  },
  radioText: {
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  severityRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  severityBtn: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: "#F1F2F6",
    alignItems: "center",
  },
  severityActive: {
    backgroundColor: PRIMARY,
  },
  severityText: {
    color: "#555",
  },
  notes: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    marginTop: 10,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  checkText: {
    marginLeft: 10,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 3,
  },
  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});