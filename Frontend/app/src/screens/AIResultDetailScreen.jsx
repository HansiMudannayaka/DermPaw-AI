import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const PRIMARY = "#4B0082";

export default function AIResultScreen({ navigation, route }) {
  const { consultation, item, reviewId, petName: passedPetName, diagnosis: passedDiagnosis, selectedTab } = route.params || {};

  const activeConsultation = consultation || item?.original;
  const isReviewed = Boolean(
    route.params?.isReviewed ||
    activeConsultation?.status === "approved" ||
    activeConsultation?.status === "reviewed" ||
    activeConsultation?.status === "completed" ||
    activeConsultation?.advice ||
    item?.status === "approved" ||
    item?.status === "reviewed"
  );

  // Parse review details from advice
  const rawAdvice = activeConsultation?.advice || "";
  let doctorDiagnosis = "";
  let doctorSeverity = "Severe";
  let doctorRecommendations = [];
  let doctorNotes = "";

  if (rawAdvice) {
    const diagMatch = rawAdvice.match(/Diagnosis:\s*(.*?)(?=\n|$)/i);
    if (diagMatch && diagMatch[1]) doctorDiagnosis = diagMatch[1].trim();

    const sevMatch = rawAdvice.match(/Severity:\s*(.*?)(?=\n|$)/i);
    if (sevMatch && sevMatch[1]) doctorSeverity = sevMatch[1].trim();

    const recMatch = rawAdvice.match(/Recommendations:\s*([\s\S]*?)(?=\nNotes:|$)/i);
    if (recMatch && recMatch[1]) {
      doctorRecommendations = recMatch[1].trim().split("\n").map(r => r.trim()).filter(Boolean);
    }

    const notesMatch = rawAdvice.match(/Notes:\s*([\s\S]*)/i);
    if (notesMatch && notesMatch[1]) {
      doctorNotes = notesMatch[1].trim();
    } else if (!recMatch && !diagMatch) {
      doctorNotes = rawAdvice.trim();
    }
  }

  const petName = activeConsultation?.pet?.name || activeConsultation?.petName || item?.name || passedPetName || "My Dog";
  const breed = activeConsultation?.pet?.description || activeConsultation?.petBreed || item?.breed || "Dog";
  const ownerName = activeConsultation?.owner?.name || activeConsultation?.owner?.username || "Pet Owner";
  const disease = activeConsultation?.aiResult?.disease || item?.issue || passedDiagnosis || "Skin Condition";
  if (!doctorDiagnosis) doctorDiagnosis = disease;
  const confidence = activeConsultation?.aiResult?.confidence ? `${activeConsultation.aiResult.confidence}%` : (item?.confidence || "92%");
  const confidenceNum = parseInt(confidence, 10) || 85;
  const severity = activeConsultation?.aiResult?.severity || selectedTab || item?.priority || (confidenceNum > 85 ? "High" : "Medium");
  const affectedArea = activeConsultation?.aiResult?.affectedArea || "Skin Area";
  const receivedTime = activeConsultation?.createdAt ? new Date(activeConsultation.createdAt).toLocaleString() : "Recently";

  let petImage = require("../../../assets/images/dog1.png");
  if (activeConsultation?.pet?.image && (activeConsultation.pet.image.startsWith("http") || activeConsultation.pet.image.startsWith("data:"))) {
    petImage = { uri: activeConsultation.pet.image };
  } else if (activeConsultation?.petImage && (activeConsultation.petImage.startsWith("http") || activeConsultation.petImage.startsWith("data:"))) {
    petImage = { uri: activeConsultation.petImage };
  } else if (item?.image && typeof item.image === "object") {
    petImage = item.image;
  }

  let diseaseImage = { uri: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e" };
  const gradcamUri = activeConsultation?.aiResult?.gradcam_image || activeConsultation?.aiResult?.gradcamImage;
  if (gradcamUri && (gradcamUri.startsWith("http") || gradcamUri.startsWith("data:"))) {
    diseaseImage = { uri: gradcamUri };
  } else if (activeConsultation?.petImage && (activeConsultation.petImage.startsWith("http") || activeConsultation.petImage.startsWith("data:"))) {
    diseaseImage = { uri: activeConsultation.petImage };
  }

  const resultData = {
    petName,
    condition: disease,
    confidence,
    consultation: activeConsultation,
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        {/* BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>AI Analysis Result</Text>

        <Ionicons name="ellipsis-vertical" size={20} color="#111" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PET INFO CARD → NAVIGATE TO PET PROFILE */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.petCard}
          onPress={() =>
            navigation.navigate("DoctorPetDetails", {
              pet: resultData,
              consultation,
            })
          }
        >
          <Image
            source={petImage}
            style={styles.petImage}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.petName}>{petName}</Text>

            <Text style={styles.petDetails}>
              {breed}
            </Text>

            <Text style={styles.owner}>
              Owner: {ownerName}
            </Text>

            <Text style={styles.time}>
              Received: {receivedTime}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#8A2BE2"
          />
        </TouchableOpacity>

        {/* AI SUMMARY */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            AI Analysis Summary
          </Text>

          <Image
            source={diseaseImage}
            style={styles.diseaseImage}
          />

          <Text style={styles.label}>AI Detection</Text>

          <Text style={styles.detection}>
            {disease}
          </Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Confidence Score</Text>

            <Text style={styles.percent}>{confidence}</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${confidenceNum}%` },
              ]}
            />
          </View>



          <View style={styles.alertBox}>
            <MaterialIcons
              name="warning"
              size={20}
              color="#D32F2F"
            />

            <Text style={styles.alertText}>
              Immediate veterinary consultation recommended
              based on AI analysis.
            </Text>
          </View>
        </View>

        {/* DOCTOR EXPERT REVIEW (DISPLAY ONLY IF REVIEWED) */}
        {isReviewed && (
          <View style={styles.card}>
            <View style={styles.reviewHeaderRow}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="checkmark-circle" size={22} color="#16A34A" />
                <Text style={[styles.sectionTitle, { marginBottom: 0, marginLeft: 8 }]}>
                  Your Expert Review
                </Text>
              </View>
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>Completed</Text>
              </View>
            </View>

            <View style={styles.reviewDivider} />

            {/* DIAGNOSIS */}
            <View style={styles.reviewInfoRow}>
              <Text style={styles.reviewLabel}>Diagnosis</Text>
              <Text style={styles.reviewValue}>{doctorDiagnosis}</Text>
            </View>

            {/* SEVERITY */}
            <View style={styles.reviewInfoRow}>
              <Text style={styles.reviewLabel}>Severity</Text>
              <View style={styles.severityTag}>
                <Text style={styles.severityTagText}>{doctorSeverity}</Text>
              </View>
            </View>

            {/* RECOMMENDATIONS */}
            {doctorRecommendations.length > 0 && (
              <View style={styles.reviewInfoCol}>
                <Text style={styles.reviewLabel}>Recommendations</Text>
                {doctorRecommendations.map((rec, index) => (
                  <View key={index} style={styles.recRow}>
                    <Ionicons name="checkmark-circle-outline" size={16} color="#16A34A" />
                    <Text style={styles.recText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* CLINICAL NOTES */}
            <View style={styles.reviewInfoCol}>
              <Text style={styles.reviewLabel}>Clinical Notes</Text>
              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  {doctorNotes || "No notes provided."}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />

        {/* IF REVIEWED: SHOW BACK BUTTON ONLY (NO ADD REVIEW BUTTON) */}
        {isReviewed ? (
          <TouchableOpacity
            style={styles.backActionBtn}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={18} color="#4B0082" />
            <Text style={styles.backActionText}>Back to Review Requests</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.submitBtn}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("AddReview", {
                result: resultData,
                consultation: activeConsultation,
              })
            }
          >
            <Text style={styles.submitText}>
              Review & Add Opinion
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5FA",
    paddingHorizontal: 20,
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
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

  /* PET CARD */
  petCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    alignItems: "center",
    elevation: 4,
  },

  petImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
    marginRight: 15,
  },

  petName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  petDetails: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },

  owner: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  time: {
    fontSize: 11,
    color: "#aaa",
    marginTop: 2,
  },

  /* MAIN CARD */
  card: {
    backgroundColor: "#fff",
    marginTop: 20,
    borderRadius: 18,
    padding: 18,
    elevation: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    color: "#222",
  },

  diseaseImage: {
    width: "100%",
    height: 320,
    borderRadius: 14,
    marginBottom: 14,
  },

  label: {
    fontSize: 13,
    color: "#666",
    marginTop: 10,
  },

  detection: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    marginTop: 2,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  percent: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8A2BE2",
  },

  progressBar: {
    height: 7,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginTop: 8,
  },

  progressFill: {
    height: 7,
    backgroundColor: "#8A2BE2",
    borderRadius: 10,
  },

  severityRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D32F2F",
    marginRight: 6,
  },

  severityText: {
    fontSize: 14,
    color: "#D32F2F",
    fontWeight: "700",
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  alertBox: {
    flexDirection: "row",
    backgroundColor: "#FFEAEA",
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
  },

  alertText: {
    marginLeft: 10,
    color: "#D32F2F",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },

  /* BUTTON */
  submitBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },

  submitText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.4,
  },

  /* REVIEW CARD (VIEW ONLY) */
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  completedBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  completedBadgeText: {
    color: "#16A34A",
    fontSize: 12,
    fontWeight: "700",
  },

  reviewDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 14,
  },

  reviewInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F7F7",
  },

  reviewInfoCol: {
    marginTop: 12,
  },

  reviewLabel: {
    fontSize: 13,
    color: "#777",
    fontWeight: "600",
  },

  reviewValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },

  severityTag: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  severityTagText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },

  recRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },

  recText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },

  noteBox: {
    backgroundColor: "#F8F9FD",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginTop: 8,
  },

  noteText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },

  backActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EDE9FE",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: "#DDD6FE",
  },

  backActionText: {
    color: "#4B0082",
    fontWeight: "700",
    fontSize: 15,
  },
});