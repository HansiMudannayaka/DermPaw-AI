import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/* ================= COLORS ================= */

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD = "#FFFFFF";

export default function DoctorProfileScreen({
  route,
  navigation,
}) {
  /* ================= GET SELECTED DOCTOR ================= */

  const passedDoc = route?.params?.doctor;

  const doctor = {
    id: passedDoc?._id || passedDoc?.id || "doc-1",
    doctorName: passedDoc?.name || passedDoc?.username || passedDoc?.doctorName || "Dr. Veterinarian",
    clinic: passedDoc?.clinic || "PetCare Veterinary Clinic",
    experience: passedDoc?.experience || "5 Years Experience",
    specialization: passedDoc?.specialization || "Veterinary Specialist",
    phone: passedDoc?.phone || "0770000000",
    location: passedDoc?.location || "Colombo, Sri Lanka",
    image: passedDoc?.image || passedDoc?.profileImage || null,
  };

  /* ================= CALL ================= */

  const handleCall = () => {
    Linking.openURL(`tel:${doctor.phone}`);
  };

  /* ================= CHAT ================= */

  const handleChat = () => {
    navigation.navigate("PetOwnerChatScreen", {
      doctorId: doctor.id,
      doctorName: doctor.doctorName,
      doctorImage: doctor.image,
      phone: doctor.phone,
      consultationId: route?.params?.consultationId || route?.params?.consultation?._id,
      consultation: route?.params?.consultation,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Doctor Profile
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* ================= PROFILE CARD ================= */}

      <View style={styles.profileCard}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              doctor.image
                ? { uri: doctor.image }
                : require("../../../assets/images/doctor.jpg")
            }
            style={styles.avatarImage}
          />
        </View>

        <Text style={styles.name}>
          {doctor.doctorName}
        </Text>

        <Text style={styles.speciality}>
          {doctor.specialization}
        </Text>

        <View style={styles.badge}>
          <MaterialCommunityIcons
            name="medical-bag"
            size={15}
            color="#fff"
          />

          <Text style={styles.badgeText}>
            Verified Vet
          </Text>
        </View>
      </View>

      {/* ================= INFO CARDS ================= */}

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="hospital-building"
            size={20}
            color={PRIMARY}
          />
        </View>

        <View>
          <Text style={styles.cardLabel}>Clinic</Text>
          <Text style={styles.cardText}>
            {doctor.clinic}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons
            name="briefcase"
            size={20}
            color={PRIMARY}
          />
        </View>

        <View>
          <Text style={styles.cardLabel}>
            Experience
          </Text>
          <Text style={styles.cardText}>
            {doctor.experience}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons
            name="location-outline"
            size={20}
            color={PRIMARY}
          />
        </View>

        <View>
          <Text style={styles.cardLabel}>
            Location
          </Text>
          <Text style={styles.cardText}>
            {doctor.location}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons
            name="call-outline"
            size={20}
            color={PRIMARY}
          />
        </View>

        <View>
          <Text style={styles.cardLabel}>Phone</Text>
          <Text style={styles.cardText}>
            {doctor.phone}
          </Text>
        </View>
      </View>

      {/* ================= CHAT BUTTON ================= */}

      <LinearGradient
        colors={[PRIMARY, SECONDARY]}
        style={styles.button}
      >
        <TouchableOpacity
          style={styles.innerBtn}
          onPress={handleChat}
        >
          <Ionicons
            name="chatbubble-ellipses"
            size={18}
            color="#fff"
          />

          <Text style={styles.buttonText}>
            Chat with Doctor
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* ================= CALL BUTTON ================= */}

      <TouchableOpacity
        style={styles.callButton}
        onPress={handleCall}
      >
        <Ionicons
          name="call"
          size={18}
          color={PRIMARY}
        />

        <Text style={styles.callText}>
          Call Now
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
    marginTop: 55,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: PRIMARY,
  },

  profileCard: {
    backgroundColor: CARD,
    borderRadius: 28,
    paddingVertical: 28,
    alignItems: "center",
    marginTop: 25,
    elevation: 5,
  },

  avatarWrapper: {
    borderWidth: 4,
    borderColor: "#EEE6FF",
    borderRadius: 70,
    padding: 4,
  },

  avatarImage: {
    width: 115,
    height: 115,
    borderRadius: 60,
  },

  name: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
  },

  speciality: {
    marginTop: 4,
    fontSize: 14,
    color: "#666",
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 30,
    marginTop: 14,
  },

  badgeText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
    fontWeight: "600",
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    padding: 16,
    borderRadius: 18,
    marginTop: 14,
    elevation: 3,
  },

  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1EAFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  cardLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 3,
  },

  cardText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },

  button: {
    marginTop: 28,
    borderRadius: 18,
    overflow: "hidden",
  },

  innerBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  callButton: {
    marginTop: 14,
    marginBottom: 35,
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1.2,
    borderColor: PRIMARY,
    gap: 8,
  },

  callText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 15,
  },
});