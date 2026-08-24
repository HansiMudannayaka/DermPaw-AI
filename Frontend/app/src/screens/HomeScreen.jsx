import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState("User");
  const [pets, setPets] = useState([]);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  const handleStartScan = () => {
    if (pets.length === 0) {
      Alert.alert(
        "Pet Profile Required",
        "You need to create a pet profile first before scanning.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Profile", onPress: () => navigation.navigate("ManagePets") }
        ]
      );
    } else if (pets.length === 1) {
      navigation.navigate("GuideCamera", { petId: pets[0]._id, petName: pets[0].name });
    } else {
      setScanModalVisible(true);
    }
  };

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
          } else if (user?.username) {
            setUserName(user.username);
          }
        }
      } catch (error) {
        console.log("LOAD USER ERROR:", error);
      }
    };

    loadUser();
  }, []);

  /* =========================
     LOAD ALL PETS FROM BACKEND
  ========================= */
  const fetchPets = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("http://172.20.10.4:8000/api/pets", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPets(data.pets || []);
      } else {
        setPets([]);
      }
    } catch (error) {
      console.log("Error fetching pets for HomeScreen:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPets();
    });
    return unsubscribe;
  }, [navigation]);

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

        <TouchableOpacity 
          style={styles.profileBtn}
          onPress={() => navigation.navigate("OwnerProfile")}
        >
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
          onPress={handleStartScan}
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
            onPress={() => {
              if (item.screen === "Scan" || item.screen === "GuideCamera") {
                handleStartScan();
              } else {
                navigation.navigate(item.screen);
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={22} color="#8A2BE2" />
            </View>
            <Text style={styles.cardText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ================= PET CARD ================= */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 30, marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#222" }}>Your Pets</Text>
        {pets.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate("ManagePets")}>
            <Text style={{ color: "#8A2BE2", fontWeight: "600", fontSize: 13 }}>Manage ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {pets.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 5 }}>
          {pets.map((pet, idx) => (
            <TouchableOpacity
              key={pet._id || idx}
              style={[styles.petCard, { marginRight: 15, minWidth: 240 }]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("PetProfile")}
            >
              <Image
                source={pet.image ? { uri: pet.image } : require("../../../assets/images/dog1.png")}
                style={styles.petImage}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petInfo}>
                  {pet.color || "Black"} • {pet.age || "2 Years"} • {pet.gender || "Male"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#888" />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <TouchableOpacity
          style={[styles.petCard, { justifyContent: "center", paddingVertical: 20 }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("PetProfile")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#8A2BE2" style={{ marginRight: 10 }} />
          <Text style={[styles.petName, { color: "#8A2BE2", fontSize: 15 }]}>Add your pet profile</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />

      {/* PET SELECTION MODAL FOR SCAN */}
      <Modal visible={scanModalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Pet to Scan</Text>
              <TouchableOpacity onPress={() => setScanModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4B0082" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Which pet are you scanning today?</Text>
            
            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
              {pets.map((pet) => (
                <TouchableOpacity
                  key={pet._id}
                  style={styles.selectPetRow}
                  onPress={() => {
                    setScanModalVisible(false);
                    navigation.navigate("GuideCamera", { petId: pet._id, petName: pet.name });
                  }}
                >
                  <Image
                    source={pet.image ? { uri: pet.image } : require("../../../assets/images/dog1.png")}
                    style={styles.selectPetImg}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectPetName}>{pet.name}</Text>
                    <Text style={styles.selectPetInfo}>{pet.color || "Black"} • {pet.age || "2Y"}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#8A2BE2" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* CREATE NEW PROFILE BUTTON */}
            <TouchableOpacity
              style={styles.createProfileBtn}
              onPress={() => {
                setScanModalVisible(false);
                navigation.navigate("ManagePets");
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.createProfileBtnText}>Create New Pet Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4B0082",
  },
  modalSub: {
    color: "#777",
    marginTop: 5,
    marginBottom: 15,
  },
  selectPetRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F0FA",
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
  },
  selectPetImg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  selectPetName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111",
  },
  selectPetInfo: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  createProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4B0082",
    borderRadius: 15,
    paddingVertical: 14,
    marginTop: 12,
  },
  createProfileBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});