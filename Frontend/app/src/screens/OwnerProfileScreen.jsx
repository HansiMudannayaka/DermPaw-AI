import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD = "#FFFFFF";

export default function OwnerProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);

  const [owner, setOwner] = useState({
    name: "Kasun Perera",
    email: "kasun@email.com",
    phone: "0771234567",
    location: "Negombo, Sri Lanka",
    image: "https://i.pravatar.cc/300?img=12",
  });

  /* =========================
     IMAGE PERMISSION
  ========================= */

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access"
        );
      }
    })();
  }, []);

  /* =========================
     PICK IMAGE
  ========================= */

  const pickImage = async () => {
    if (!isEditing) return;

    const result =
      await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

    if (!result.canceled) {
      setOwner({
        ...owner,
        image: result.assets[0].uri,
      });
    }
  };

  /* =========================
     SAVE PROFILE
  ========================= */

  const handleSave = () => {
    setIsEditing(false);

    Alert.alert(
      "Success",
      "Profile updated successfully!"
    );
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Logout",
          style: "destructive",

          onPress: async () => {
            try {
              // clear saved login
              await AsyncStorage.removeItem(
                "token"
              );

              await AsyncStorage.removeItem(
                "user"
              );

              // reset navigation
              navigation.reset({
                index: 0,
                routes: [{ name: "SignIn" }],
              });

            } catch (error) {
              console.log(
                "LOGOUT ERROR:",
                error
              );

              Alert.alert(
                "Error",
                "Logout failed"
              );
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={PRIMARY}
      />

      {/* ================= HEADER ================= */}

      <LinearGradient
        colors={[PRIMARY, SECONDARY]}
        style={styles.header}
      >
        {/* BACK BUTTON */}

        <TouchableOpacity
          style={styles.iconLeft}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* EDIT BUTTON */}

        <TouchableOpacity
          style={styles.iconRight}
          onPress={() =>
            setIsEditing(!isEditing)
          }
        >
          <Ionicons
            name={
              isEditing
                ? "close"
                : "create-outline"
            }
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* PROFILE */}

        <View style={styles.center}>
          <TouchableOpacity
            onPress={pickImage}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: owner.image }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <Text style={styles.name}>
            {owner.name}
          </Text>

          <Text style={styles.email}>
            {owner.email}
          </Text>
        </View>
      </LinearGradient>

      {/* ================= STATS ================= */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons
            name="paw"
            size={20}
            color={PRIMARY}
          />

          <Text style={styles.statNum}>
            2
          </Text>

          <Text style={styles.statLabel}>
            Pets
          </Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="document-text"
            size={20}
            color={PRIMARY}
          />

          <Text style={styles.statNum}>
            15
          </Text>

          <Text style={styles.statLabel}>
            Reports
          </Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons
            name="chatbubble"
            size={20}
            color={PRIMARY}
          />

          <Text style={styles.statNum}>
            6
          </Text>

          <Text style={styles.statLabel}>
            Chats
          </Text>
        </View>
      </View>

      {/* ================= INFO CARD ================= */}

      <View style={styles.card}>
        <Text style={styles.title}>
          Personal Info
        </Text>

        {/* NAME */}

        <View style={styles.inputRow}>
          <Ionicons
            name="person-outline"
            size={18}
            color={PRIMARY}
          />

          <TextInput
            style={styles.input}
            value={owner.name}
            editable={isEditing}
            onChangeText={(t) =>
              setOwner({
                ...owner,
                name: t,
              })
            }
          />
        </View>

        {/* PHONE */}

        <View style={styles.inputRow}>
          <Ionicons
            name="call-outline"
            size={18}
            color={PRIMARY}
          />

          <TextInput
            style={styles.input}
            value={owner.phone}
            editable={isEditing}
            keyboardType="phone-pad"
            onChangeText={(t) =>
              setOwner({
                ...owner,
                phone: t,
              })
            }
          />
        </View>

        {/* LOCATION */}

        <View style={styles.inputRow}>
          <Ionicons
            name="location-outline"
            size={18}
            color={PRIMARY}
          />

          <TextInput
            style={styles.input}
            value={owner.location}
            editable={isEditing}
            onChangeText={(t) =>
              setOwner({
                ...owner,
                location: t,
              })
            }
          />
        </View>

        {/* SAVE BUTTON */}

        {isEditing && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <Text style={styles.saveText}>
              SAVE CHANGES
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ================= LOGOUT ================= */}

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Ionicons
          name="log-out-outline"
          size={18}
          color="#fff"
        />

        <Text style={styles.logoutText}>
          Logout
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
  },

  /* HEADER */

  header: {
    height: 300,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  iconLeft: {
    position: "absolute",
    left: 20,
    top: 60,

    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor:
      "rgba(255,255,255,0.18)",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.3)",
  },

  iconRight: {
    position: "absolute",
    right: 20,
    top: 60,

    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor:
      "rgba(255,255,255,0.18)",

    justifyContent: "center",
    alignItems: "center",

    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.3)",
  },

  center: {
    alignItems: "center",
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,

    borderWidth: 3,
    borderColor: "#fff",
  },

  name: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },

  email: {
    color: "#eee",
    fontSize: 12,
  },

  /* STATS */

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginHorizontal: 20,
    marginTop: -25,
  },

  statCard: {
    flex: 1,
    marginHorizontal: 5,

    backgroundColor: CARD,

    alignItems: "center",

    padding: 15,
    borderRadius: 15,

    elevation: 3,
  },

  statNum: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 5,
  },

  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  /* CARD */

  card: {
    margin: 20,

    backgroundColor: CARD,

    borderRadius: 20,
    padding: 20,

    elevation: 3,
  },

  title: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 15,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F6F1FF",

    borderRadius: 12,

    paddingHorizontal: 12,

    marginBottom: 12,

    height: 50,
  },

  input: {
    flex: 1,
    marginLeft: 10,
  },

  saveBtn: {
    backgroundColor: PRIMARY,

    padding: 14,

    borderRadius: 15,

    alignItems: "center",

    marginTop: 10,
  },

  saveText: {
    color: "#fff",
    fontWeight: "800",
  },

  /* LOGOUT */

  logoutBtn: {
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,

    backgroundColor: "#FF4D6D",

    padding: 15,

    borderRadius: 15,

    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "800",
    marginLeft: 8,
  },
});