import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const LIGHT_PURPLE = "#EEE6FF";
const CARD_WIDTH = (width - 50) / 2;

export default function DoctorListScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);

  // Fetch doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("http://172.20.10.4:8000/api/users");
        const data = await res.json();
        // Filter doctor role (data is array of users)
        const docs = data.filter((u) => u.role === "doctor" || !u.role);
        setDoctors(docs);
      } catch (err) {
        console.log("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(
    (item) =>
      (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.specialization || "").toLowerCase().includes(search.toLowerCase())
  );

  const renderDoctor = ({ item, index }) => {
    const isFeatured = index === 0;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[
          styles.card,
          isFeatured && styles.featuredCard,
        ]}
      >
        {isFeatured && (
          <LinearGradient
            colors={[PRIMARY, SECONDARY]}
            style={styles.featuredGradient}
          />
        )}

        {/* TOP */}
        <View style={styles.topRow}>
          <Image source={{ uri: item.image || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2" }} style={styles.image} />

          {/* PAW ICON ONLY */}
          <TouchableOpacity
            style={[
              styles.favoriteBtn,
              isFeatured && styles.favoriteDark,
            ]}
          >
            <Ionicons
              name="paw"
              size={16}
              color={isFeatured ? "#fff" : PRIMARY}
            />
          </TouchableOpacity>
        </View>

        {/* NAME */}
        <Text style={[styles.name, isFeatured && styles.featuredText]}>
          {item.name || item.username}
        </Text>

        {/* ROLE */}
        <Text style={[styles.role, isFeatured && styles.featuredSubText]}>
          {item.specialization || item.role || "Veterinarian"}
        </Text>

        {/* EXPERIENCE */}
        <View style={styles.experienceBox}>
          <Ionicons name="briefcase" size={14} color={PRIMARY} />
          <Text style={styles.experienceText}>{item.experience || "5 Years"} Experience</Text>
        </View>

        {/* BOTTOM */}
        <View style={styles.bottomRow}>
          <View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={15} color="#FFD54F" />
              <Text
                style={[styles.rating, isFeatured && styles.featuredText]}
              >
                {item.rating || "5.0"}
              </Text>
            </View>

            <Text
              style={[styles.review, isFeatured && styles.featuredSubText]}
            >
              {item.reviews || "100+ Reviews"}
            </Text>
          </View>

          {/* NAVIGATION BUTTON */}
          <TouchableOpacity
            style={[styles.arrowBtn, isFeatured && styles.darkArrow]}
            onPress={() =>
              navigation.navigate("DoctorPetProfile", {
                doctor: item,
              })
            }
          >
            <Ionicons
              name="arrow-forward"
              size={18}
              color={isFeatured ? "#fff" : PRIMARY}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={BG} barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={PRIMARY} />
        </TouchableOpacity>

        <View>
          <Text style={styles.headerTitle}>Find Doctors</Text>
          <Text style={styles.headerSub}>
            Best pet specialists nearby
          </Text>
        </View>

        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={20} color={PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* HERO */}
      <LinearGradient
        colors={[PRIMARY, SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Top Rated Doctors</Text>
          <Text style={styles.heroText}>
            Connect with experienced pet specialists and veterinarians.
          </Text>
        </View>

        <MaterialCommunityIcons
          name="stethoscope"
          size={70}
          color="rgba(255,255,255,0.15)"
        />
      </LinearGradient>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#999" />

        <TextInput
          placeholder="Search doctors..."
          placeholderTextColor="#999"
          style={styles.input}
          value={search}
          onChangeText={setSearch}
        />

        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <FlatList
        data={filteredDoctors}
        renderItem={renderDoctor}
        keyExtractor={(item) => item._id || item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}
/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 18,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
  },

  headerSub: {
    color: "#777",
    marginTop: 2,
    fontSize: 12,
  },

  heroCard: {
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },

  heroText: {
    color: "rgba(255,255,255,0.88)",
    lineHeight: 20,
    fontSize: 13,
    paddingRight: 10,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    elevation: 2,
    marginBottom: 18,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: "#111",
    fontSize: 14,
  },

  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 14,
    marginBottom: 16,
    elevation: 3,
    overflow: "hidden",
  },

  featuredCard: {
    backgroundColor: LIGHT_PURPLE,
  },

  featuredGradient: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    top: -40,
    right: -30,
    opacity: 0.15,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  image: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginBottom: 12,
  },

  favoriteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3EAFF",
    justifyContent: "center",
    alignItems: "center",
  },

  favoriteDark: {
    backgroundColor: PRIMARY,
  },

  name: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  role: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },

  featuredText: {
    color: PRIMARY,
  },

  featuredSubText: {
    color: "#4A3A6A",
  },

  experienceBox: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F7F1FF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    alignSelf: "flex-start",
  },

  experienceText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: "600",
    color: PRIMARY,
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 18,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  rating: {
    marginLeft: 4,
    fontWeight: "700",
    color: "#111",
    fontSize: 12,
  },

  review: {
    fontSize: 11,
    color: "#777",
    marginTop: 3,
  },

  arrowBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1E9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  darkArrow: {
    backgroundColor: PRIMARY,
  },
});