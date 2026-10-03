import React, { useState, useEffect } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "../services/api";

/* ================= THEME ================= */

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD = "#FFFFFF";

/* ================= TYPOGRAPHY ================= */

const TYPO = {
  h2: 22,
  h3: 16,
  body: 14,
  small: 12,
};

/* ================= DATA ================= */

export default function AdviceHistoryScreen({
  navigation,
}) {
  const [vetResponses, setVetResponses] = useState([]);
  const [activePet, setActivePet] = useState(null);

  // Fetch advice history (approved consultations) from backend filtered by active pet
  const fetchAdviceHistory = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const storedActivePet = await AsyncStorage.getItem("activePet");
      let currentPet = null;
      if (storedActivePet) {
        currentPet = JSON.parse(storedActivePet);
        setActivePet(currentPet);
      }

      const url = currentPet?._id
        ? `${BACKEND_URL}/api/consultations/owner?petId=${currentPet._id}&petName=${encodeURIComponent(currentPet.name || '')}`
        : `${BACKEND_URL}/api/consultations/owner`;

      const res = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        const list = (data.consultations || [])
          .filter(item => {
            const isApproved = item.status === "approved";
            if (!isApproved) return false;
            if (!currentPet?._id) return true;
            return (
              item.pet === currentPet._id ||
              item.pet?._id === currentPet._id ||
              (item.petName && item.petName.toLowerCase() === currentPet.name?.toLowerCase())
            );
          })
          .map(item => {
            const d = new Date(item.updatedAt);
            const isDocAvailable = Boolean(item.doctor && item.doctor.status !== "inactive");
            return {
              id: item._id,
              doctor: item.doctor ? (item.doctor.name || item.doctor.username || "Doctor") : "Veterinarian",
              isAvailable: isDocAvailable,
              date: d.toLocaleDateString(),
              time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              disease: item.aiResult?.disease || "Skin Scan",
              severity: item.aiResult?.confidence > 85 ? "Severe" : item.aiResult?.confidence > 70 ? "Moderate" : "Mild",
              image: item.doctor?.image || item.doctor?.profileImage || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
              original: item
            };
          });
        setVetResponses(list);
      }
    } catch (err) {
      console.log("Error loading advice history:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchAdviceHistory();
    });
    fetchAdviceHistory();
    return unsubscribe;
  }, [navigation]);

  /* ================= SEVERITY COLORS ================= */

  const getSeverityColor = (
    severity
  ) => {
    switch (severity) {
      case "Severe":
        return "#E53935";

      case "Moderate":
        return "#FB8C00";

      default:
        return "#22C55E";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BG}
      />

      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        {/* BACK BUTTON */}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            navigation.goBack()
          }
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={PRIMARY}
          />
        </TouchableOpacity>

        {/* TITLE */}

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Advice History
          </Text>
          {activePet && (
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 4 }}>
              <Ionicons name="paw" size={13} color={SECONDARY} />
              <Text style={{ fontSize: 13, color: PRIMARY, fontWeight: "700" }}>
                {activePet.name}'s Consultations
              </Text>
            </View>
          )}
        </View>

        {/* PET PROFILE LINK */}

        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => navigation.navigate("PetProfile")}
        >
          {activePet?.image ? (
            <Image source={{ uri: activePet.image }} style={{ width: 34, height: 34, borderRadius: 17 }} />
          ) : (
            <Ionicons
              name="paw"
              size={20}
              color={PRIMARY}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* ================= LIST ================= */}

      <FlatList
        data={vetResponses}
        keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || String(index)}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 30,
          paddingTop: 10,
        }}
        renderItem={({ item }) => {
          const color =
            getSeverityColor(
              item.severity
            );

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate(
                  "VetAdvice",
                  {
                    consultation: item.original,
                    doctor: item.doctor,
                    disease: item.disease,
                    severity: item.severity,
                    date: item.date,
                    time: item.time,
                  }
                )
              }
            >
              {/* DOCTOR IMAGE */}

              <Image
                source={{
                  uri: item.image,
                }}
                style={styles.image}
              />

              {/* CONTENT */}

              <View
                style={styles.content}
              >
                <View style={styles.doctorHeaderRow}>
                  <Text
                    style={[
                      styles.doctor,
                      { flex: 1 },
                      !item.isAvailable && { color: "#555" },
                    ]}
                    numberOfLines={1}
                  >
                    {item.doctor}
                  </Text>
                  <View
                    style={[
                      styles.availBadge,
                      { backgroundColor: item.isAvailable ? "#DCFCE7" : "#FEE2E2" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.availText,
                        { color: item.isAvailable ? "#15803D" : "#B91C1C" },
                      ]}
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.disease
                  }
                >
                  {item.disease}
                </Text>

                <Text
                  style={
                    styles.meta
                  }
                >
                  {item.date} •{" "}
                  {item.time}
                </Text>

                {/* SEVERITY */}

                <View
                  style={
                    styles.severityRow
                  }
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.severityText,
                      {
                        color,
                      },
                    ]}
                  >
                    {item.severity} case
                  </Text>
                </View>
              </View>

              {/* ARROW */}

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#AAA"
              />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 80, paddingHorizontal: 30 }}>
            <Ionicons name="medical-outline" size={60} color="#D8B4FE" />
            <Text style={{ fontSize: 17, fontWeight: "bold", color: PRIMARY, marginTop: 16 }}>
              {activePet ? `No advice history for ${activePet.name}` : "No Advice History"}
            </Text>
            <Text style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 6, lineHeight: 18 }}>
              {activePet
                ? `When a veterinarian reviews a scan consultation for ${activePet.name}, their prescription and advice will appear here.`
                : "When a veterinarian reviews your pet consultation, their prescription and advice will appear here."}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 18,
  },

  /* HEADER */

  header: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  title: {
    fontSize: TYPO.h2,
    fontWeight: "800",
    color: PRIMARY,
  },

  /* CARD */

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    marginBottom: 14,
    padding: 14,
    borderRadius: 24,

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  image: {
    width: 58,
    height: 58,
    borderRadius: 18,
    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  doctorHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  availBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },

  availText: {
    fontSize: 10,
    fontWeight: "700",
  },

  doctor: {
    fontSize: TYPO.h3,
    fontWeight: "800",
    color: "#111",
  },

  disease: {
    fontSize: TYPO.body,
    color: "#555",
    marginTop: 3,
  },

  meta: {
    fontSize: TYPO.small,
    color: "#888",
    marginTop: 4,
  },

  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  severityText: {
    fontSize: TYPO.small,
    fontWeight: "700",
  },
});