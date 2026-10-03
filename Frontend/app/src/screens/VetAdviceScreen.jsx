import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/* ================= THEME ================= */

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const LIGHT_PURPLE = "#EBDDFF";
const CARD = "#FFFFFF";

const getSeverityStyle = (level) => {
  switch (level) {
    case "Severe":
      return { bg: "#FFE5E5", color: "#FF3B30" };
    case "Moderate":
      return { bg: "#FFF4DF", color: "#FF9800" };
    default:
      return { bg: "#E8F5E9", color: "#2E7D32" };
  }
};

export default function OwnerSummaryScreen({ route, navigation }) {
  const { consultation } = route.params || {};

  // Extract from real consultation document
  const petName = consultation?.pet?.name || consultation?.petName || route.params?.petName || "My Dog";
  
  let petImage = route.params?.petImage || require("../../../assets/images/dog1.png");
  if (consultation?.pet?.image && (consultation.pet.image.startsWith("http") || consultation.pet.image.startsWith("data:"))) {
    petImage = { uri: consultation.pet.image };
  } else if (consultation?.petImage && (consultation.petImage.startsWith("http") || consultation.petImage.startsWith("data:"))) {
    petImage = { uri: consultation.petImage };
  }

  const breed = consultation?.pet?.description || consultation?.petBreed || "Dog";
  const age = consultation?.pet?.age || "2Y";
  const gender = consultation?.pet?.gender || "Female";

  const disease = consultation?.aiResult?.disease || route.params?.disease || "Skin Scan";
  const conf = consultation?.aiResult?.confidence || 50;
  const severity = route.params?.severity || (conf > 85 ? "Severe" : conf > 70 ? "Moderate" : "Mild");

  // Parse notes/advice
  const adviceText = consultation?.advice || "";
  let notes = consultation?.advice || route.params?.notes || "No clinical notes provided yet.";
  
  let parsedNotes = notes;
  let parsedRecs = [
    { title: "Follow Veterinarian Advice", subtitle: "As written in notes below", icon: "medical-bag" }
  ];

  if (adviceText.includes("Notes: ")) {
    const parts = adviceText.split("Notes: ");
    parsedNotes = parts[1] || adviceText;
  }
  if (adviceText.includes("Recommendations: ")) {
    const recStr = adviceText.split("Recommendations: ")[1]?.split("\nNotes:")[0];
    if (recStr) {
      parsedRecs = recStr.split("\n").map(r => ({
        title: r.trim(),
        subtitle: "Prescribed advice",
        icon: "check-bold"
      })).filter(r => r.title.length > 0);
    }
  }

  const doctor = {
    doctorName: consultation?.doctor?.name || consultation?.doctor?.username || route.params?.doctor || "Dr. Veterinarian",
    clinic: consultation?.doctor?.clinic || consultation?.doctor?.specialization || "Veterinary Clinic",
    experience: consultation?.doctor?.experience || "5 Years Experience",
    specialization: consultation?.doctor?.specialization || "Veterinary Specialist",
    phone: consultation?.doctor?.phone || consultation?.doctor?.email || "+94 77 123 4567",
    location: consultation?.doctor?.location || "Colombo, Sri Lanka",
    image: consultation?.doctor?.image || consultation?.doctor?.profileImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400",
  };

  const severityStyle = getSeverityStyle(severity);
  const recommendation = route.params?.recommendation ? 
    [{ title: route.params.recommendation, subtitle: "Treatment plan", icon: "medical-bag" }] : parsedRecs;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        {/* ✅ UPDATED BACK BUTTON */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pet Health Report</Text>
      </View>

      {/* ================= PET CARD ================= */}

      <View style={styles.petCard}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <Image source={petImage} style={styles.avatar} />
          </View>
        </View>

        <Text style={styles.petName}>{petName}</Text>

        <Text style={styles.petSub}>
          {breed} • {age} • {gender}
        </Text>
      </View>

      {/* ================= ASSIGNED VET ================= */}

      <Text style={styles.mainTitle}>Assigned Veterinarian</Text>

      <TouchableOpacity
        style={styles.doctorCard}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate("DoctorPetProfile", {
            doctor: consultation?.doctor || doctor,
            consultation: consultation,
            consultationId: consultation?._id,
          })
        }
      >
        <Image
          source={{ uri: doctor.image }}
          style={styles.doctorImage}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.doctorName}>
            {doctor.doctorName}
          </Text>

          <Text style={styles.doctorText}>
            {doctor.specialization}
          </Text>

          <Text style={styles.doctorText}>
            {doctor.clinic}
          </Text>

          <Text style={styles.doctorText}>
            {doctor.experience}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={13}
              color="#777"
            />

            <Text style={styles.locationText}>
              {doctor.location}
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#aaa"
        />
      </TouchableOpacity>

      {/* ================= DIAGNOSIS ================= */}

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>

          <View
            style={[
              styles.badge,
              { backgroundColor: severityStyle.bg },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                { color: severityStyle.color },
              ]}
            >
              {severity}
            </Text>
          </View>
        </View>

        <Text style={styles.disease}>{disease}</Text>
      </View>

      {/* ================= RECOMMENDATIONS ================= */}

      <Text style={styles.mainTitle}>Vet Recommendations</Text>

      {recommendation.map((item, index) => (
        <View key={index} style={styles.recCard}>
          <View style={styles.recIcon}>
            <MaterialCommunityIcons
              name={item.icon}
              size={22}
              color={PRIMARY}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.recTitle}>{item.title}</Text>
            <Text style={styles.recSub}>{item.subtitle}</Text>
          </View>
        </View>
      ))}

      {/* ================= NOTES ================= */}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Clinical Notes</Text>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>{parsedNotes}</Text>
        </View>
      </View>

      {/* ================= ACTION BUTTONS ================= */}

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("PetOwnerChatScreen", {
              doctorId: consultation?.doctor?._id || consultation?.doctor?.id || consultation?.doctor,
              doctorName: doctor.doctorName,
              doctorImage: doctor.image,
              phone: doctor.phone,
              consultationId: consultation?._id,
              consultation: consultation,
            })
          }
        >
          <Ionicons
            name="chatbubbles-outline"
            size={20}
            color={PRIMARY}
          />
          <Text style={styles.actionText}>
            Chat with Doctor
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("OwnerArticles", {
              disease,
              petName,
            })
          }
        >
          <Ionicons
            name="newspaper-outline"
            size={20}
            color={PRIMARY}
          />
          <Text style={styles.actionText}>
            Related Articles
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() =>
            navigation.navigate("FindDoctorScreen", {
              disease,
              severity,
            })
          }
        >
          <Ionicons
            name="medkit-outline"
            size={20}
            color={PRIMARY}
          />
          <Text style={styles.actionText}>
            Find Doctors
          </Text>
        </TouchableOpacity>
      </View>
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

  /* ✅ ROUNDED BACK BUTTON */
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },

  header: {
    marginTop: 55,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY,
  },

  petCard: {
    backgroundColor: CARD,
    borderRadius: 28,
    paddingVertical: 28,
    marginTop: 25,
    alignItems: "center",
    elevation: 5,
  },

  outerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },

  innerCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#D6B6FF",
    justifyContent: "center",
    alignItems: "center",
  },

  avatar: {
    width: 115,
    height: 115,
    borderRadius: 58,
  },

  petName: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: "700",
    color: "#222",
  },

  petSub: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
  },

  mainTitle: {
    marginTop: 25,
    marginBottom: 15,
    fontSize: 18,
    fontWeight: "700",
    color: PRIMARY,
  },

  doctorCard: {
    flexDirection: "row",
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 22,
    alignItems: "center",
    elevation: 4,
  },

  doctorImage: {
    width: 70,
    height: 70,
    borderRadius: 20,
    marginRight: 14,
  },

  doctorName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },

  doctorText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  locationText: {
    marginLeft: 4,
    fontSize: 11,
    color: "#777",
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    elevation: 3,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#222",
  },

  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    fontWeight: "700",
    fontSize: 12,
  },

  disease: {
    marginTop: 12,
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },

  recCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
  },

  recIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#F0E4FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  recTitle: {
    fontWeight: "700",
    fontSize: 15,
    color: "#222",
  },

  recSub: {
    color: "#777",
    fontSize: 13,
    marginTop: 2,
  },

  noteBox: {
    backgroundColor: "#F8F2FF",
    padding: 14,
    borderRadius: 14,
    marginTop: 12,
    borderLeftWidth: 4,
    borderLeftColor: PRIMARY,
  },

  noteText: {
    lineHeight: 22,
    color: "#444",
  },

  actionContainer: {
    marginTop: 25,
    gap: 14,
  },

  actionButton: {
    backgroundColor: CARD,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
  },

  actionText: {
    marginLeft: 12,
    fontSize: 15,
    fontWeight: "700",
    color: PRIMARY,
  },
});