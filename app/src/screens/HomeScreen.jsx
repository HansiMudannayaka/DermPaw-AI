import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("User");

  /* =========================
     LOAD USER FROM STORAGE
  ========================= */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");

        if (userData) {
          const user = JSON.parse(userData);
          if (user?.name) {
            setUserName(user.name);
          }
        }
      } catch (error) {
        console.log("LOAD USER ERROR:", error);
      }
    };

    loadUser();
  }, []);

  // ✅ Quick Actions with navigation
  const actions = [
    { icon: "camera", label: "Scan Pet", screen: "GuideCamera" },
    { icon: "document-text", label: "Reports", screen: "Reports" },
    { icon: "medical", label: "Vet Advice", screen: "VetAdviceHistory" },
    { icon: "book", label: "Articles", screen: "OwnerArticles" },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* ================= HEADER ================= */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello {userName}👋</Text>

          {/* 🔥 DYNAMIC NAME */}
          <Text style={styles.username}>
            Welcome to DermPaw AI
          </Text>
        </View>

        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="paw" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ================= HERO ================= */}
      <LinearGradient
        colors={["#8A2BE2", "#4B0082"]}
        style={styles.heroCard}
      >
        <Text style={styles.heroTitle}>AI Pet Skin Scanner</Text>
        <Text style={styles.heroDesc}>
          Scan your dog’s skin instantly using AI diagnosis
        </Text>

        <TouchableOpacity
          style={styles.scanBtn}
          onPress={() => navigation.navigate("Scan")}
        >
          <Text style={styles.scanText}>Start Scan</Text>
          <Ionicons name="scan" size={18} color="#4B0082" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ================= QUICK ACTIONS ================= */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.grid}>
        {actions.map((item, i) => (
          <TouchableOpacity
            key={i}
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => navigation.navigate(item.screen)}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={22} color="#8A2BE2" />
            </View>
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ================= PET CARD ================= */}
      <Text style={styles.sectionTitle}>Your Pet</Text>

      <View style={styles.petCard}>
        <Image
          source={require("../../../assets/images/dob1.png")}
          style={styles.petImage}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.petName}>Buddy</Text>
          <Text style={styles.petInfo}>
            Golden Retriever • 2 Years
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5FA",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 50,
  },

  greeting: {
    fontSize: 17,
    color: "#888",
  },

  username: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111",
  },

  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#8A2BE2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  heroCard: {
    marginTop: 25,
    padding: 22,
    borderRadius: 22,
    elevation: 6,
  },

  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },

  heroDesc: {
    fontSize: 13,
    color: "#E8D9FF",
    marginTop: 6,
  },

  scanBtn: {
    marginTop: 18,
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    elevation: 3,
  },

  scanText: {
    color: "#4B0082",
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
    color: "#222",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: (width - 60) / 2,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 15,
    elevation: 4,
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
    alignItems: "center",
  },

  cardText: {
    marginTop: 10,
    fontWeight: "600",
    color: "#333",
  },

  petCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 18,
    alignItems: "center",
    elevation: 4,
  },

  petImage: {
    width: 75,
    height: 75,
    borderRadius: 15,
    marginRight: 15,
  },

  petName: {
    fontSize: 17,
    fontWeight: "700",
  },

  petInfo: {
    fontSize: 12,
    color: "#888",
    marginTop: 5,
  },
});