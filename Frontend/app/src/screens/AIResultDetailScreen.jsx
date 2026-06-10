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

export default function AIResultScreen({ navigation }) {
  const resultData = {
    petName: "Luna",
    condition: "Hot Spot",
    confidence: "92%",
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
            })
          }
        >
          <Image
            source={{
              uri: "https://images.dog.ceo/breeds/retriever-golden/n02099601_3004.jpg",
            }}
            style={styles.petImage}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.petName}>Luna</Text>

            <Text style={styles.petDetails}>
              Golden Retriever • 2Y • Female
            </Text>

            <Text style={styles.owner}>
              Owner: Priya Sharma
            </Text>

            <Text style={styles.time}>
              Received: 20 May 2024, 09:15 AM
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
            source={{
              uri: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e",
            }}
            style={styles.diseaseImage}
          />

          <Text style={styles.label}>AI Detection</Text>

          <Text style={styles.detection}>
            Hot Spot (Acute Moist Dermatitis)
          </Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Confidence Score</Text>

            <Text style={styles.percent}>92%</Text>
          </View>

          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: "92%" },
              ]}
            />
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Severity</Text>

            <View style={styles.severityRow}>
              <View style={styles.dot} />

              <Text style={styles.severityText}>High</Text>
            </View>
          </View>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Affected Area</Text>

            <Text style={styles.value}>
              Left Shoulder
            </Text>
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

        <View style={{ height: 30 }} />

        {/* REVIEW BUTTON */}
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate("AddReview", {
              result: resultData,
            })
          }
        >
          <Text style={styles.submitText}>
            Review & Add Opinion
          </Text>
        </TouchableOpacity>

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
});