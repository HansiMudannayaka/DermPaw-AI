import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage"; // NEW

const { width } = Dimensions.get("window");

// NEW: same backend host used by VetDoctors.jsx / LoginScreen.js
const API_URL = "http://172.20.10.4:8000";
const USERS_API = `${API_URL}/api/users`;

const COLORS = {
  PRIMARY: "#4B0082",
  SECONDARY: "#8A2BE2",
  BG: "#F6F1FF",
  CARD: "#FFFFFF",
  TEXT_PRIMARY: "#111111",
  TEXT_SECONDARY: "#666666",
  TEXT_LIGHT: "#999999",
  SUCCESS: "#10B981",
  ERROR: "#EF4444",
  WARNING: "#F59E0B",
  BORDER: "#ECECEC",
};

const professionalInfoItems = [
  { icon: "medical-bag", key: "clinic", label: "Clinic" },
  { icon: "school", key: "experience", label: "Experience" },
  { icon: "stethoscope", key: "specialization", label: "Specialization" },
];

const personalInfoFields = [
  {
    key: "doctorName",
    label: "Full Name",
    icon: "person-outline",
    keyboardType: "default",
  },
  {
    key: "email",
    label: "Email Address",
    icon: "mail-outline",
    keyboardType: "email-address",
  },
  {
    key: "phone",
    label: "Phone Number",
    icon: "call-outline",
    keyboardType: "phone-pad",
  },
  {
    key: "location",
    label: "Location",
    icon: "location-outline",
    keyboardType: "default",
  },
];

// NEW: fallback used only until the real profile loads / for fields the backend doesn't store
const DEFAULT_PROFILE = {
  doctorName: "Doctor",
  email: "",
  clinic: "PetCare Veterinary Clinic",
  experience: "",
  specialization: "",
  phone: "",
  location: "",
  bio: "",
  image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=400",
};

export default function DoctorProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // NEW
  const [originalProfile, setOriginalProfile] = useState(null);
  const [userId, setUserId] = useState(null); // NEW: backend _id for PUT requests

  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);

  // NEW: Load the real logged-in doctor from AsyncStorage (saved by LoginScreen)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) {
          const user = JSON.parse(stored);
          setUserId(user._id || user.id || null);
          setProfile((prev) => ({
            ...prev,
            doctorName: user.name || user.username || prev.doctorName,
            email: user.email || prev.email,
            specialization: user.specialization || prev.specialization,
            experience: user.experience || prev.experience,
            // clinic, phone, location, bio, image aren't in the backend schema yet —
            // kept from defaults / local edits only, for now
            image: user.profileImage || prev.image,
          }));
        }
      } catch (err) {
        console.log("Could not load profile:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isEditing && !originalProfile) {
      setOriginalProfile({ ...profile });
    }

    if (!isEditing) {
      setOriginalProfile(null);
    }
  }, [isEditing]);

  const handleChange = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const pickImage = async () => {
    if (!isEditing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfile((prev) => ({
        ...prev,
        image: result.assets[0].uri,
      }));
    }
  };

  // UPDATED: actually saves to the backend instead of a fake timeout
  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "Could not identify your account. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: profile.doctorName,
        email: profile.email,
        specialization: profile.specialization,
        experience: profile.experience,
        // clinic, phone, location, bio, image are not yet supported by the backend schema
      };

      const res = await fetch(`${USERS_API}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      // Keep AsyncStorage in sync so DoctorHome etc. show the updated name too
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        const updatedUser = { ...user, ...payload };
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setIsSaving(false);
      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.log("Profile update error:", err);
      setIsSaving(false);
      Alert.alert("Error", err.message || "Could not update profile. Check your connection.");
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }

    setIsEditing(false);
  };

  // UPDATED: clears stored session on logout
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "user"]); // NEW
          navigation.replace("SignIn");
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
      >
        {/* HEADER */}
        <LinearGradient
          colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Doctor Profile</Text>

            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <LinearGradient
                colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
                style={styles.editBtn}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <View style={styles.editingBadge}>
              <Text style={styles.editingText}>Editing Profile</Text>
            </View>
          )}
        </LinearGradient>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* PROFILE CARD */}
          <View style={styles.profileCard}>
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.8}
              disabled={!isEditing}
            >
              <View style={styles.avatarWrapper}>
                <Image
                  source={{ uri: profile.image }}
                  style={styles.avatar}
                />
              </View>

              {isEditing && (
                <View style={styles.cameraIcon}>
                  <Ionicons name="camera" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.name}>
              {isLoading ? "Loading..." : profile.doctorName}
            </Text>

            <View style={styles.badge}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color="#fff"
              />

              <Text style={styles.badgeText}>Verified Doctor</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                Available for Consultation
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>150+</Text>
                <Text style={styles.statLabel}>Patients</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Satisfaction</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statNumber}>
                  {profile.experience || "—"}
                </Text>
                <Text style={styles.statLabel}>Experience</Text>
              </View>
            </View>
          </View>

          {/* PERSONAL INFO */}
          <Animated.View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="account-circle"
                size={22}
                color={COLORS.PRIMARY}
              />

              <Text style={styles.sectionTitle}>
                Personal Information
              </Text>
            </View>

            {personalInfoFields.map((field) => (
              <View key={field.key} style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <Ionicons
                    name={field.icon}
                    size={18}
                    color={COLORS.SECONDARY}
                  />
                </View>

                <TextInput
                  style={[
                    styles.input,
                    {
                      borderBottomColor: isEditing
                        ? COLORS.SECONDARY
                        : COLORS.BORDER,
                    },
                  ]}
                  editable={isEditing}
                  value={profile[field.key]}
                  onChangeText={(text) =>
                    handleChange(field.key, text)
                  }
                  placeholder={field.label}
                  placeholderTextColor={COLORS.TEXT_LIGHT}
                  keyboardType={field.keyboardType}
                />
              </View>
            ))}
          </Animated.View>

          {/* PROFESSIONAL INFO */}
          <Animated.View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="medical-bag"
                size={22}
                color={COLORS.PRIMARY}
              />

              <Text style={styles.sectionTitle}>
                Professional Details
              </Text>
            </View>

            {professionalInfoItems.map((item) => (
              <View key={item.key} style={styles.professionalField}>
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={COLORS.SECONDARY}
                />

                {isEditing ? (
                  <TextInput
                    style={styles.professionalInput}
                    value={profile[item.key]}
                    onChangeText={(text) =>
                      handleChange(item.key, text)
                    }
                  />
                ) : (
                  <Text style={styles.professionalText}>
                    {profile[item.key]}
                  </Text>
                )}
              </View>
            ))}
          </Animated.View>

          {/* BIO */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text-outline"
                size={22}
                color={COLORS.PRIMARY}
              />

              <Text style={styles.sectionTitle}>Bio</Text>
            </View>

            {isEditing ? (
              <TextInput
                style={styles.bioInput}
                value={profile.bio}
                onChangeText={(text) =>
                  handleChange("bio", text)
                }
                multiline
                placeholder="Write something..."
                placeholderTextColor={COLORS.TEXT_LIGHT}
              />
            ) : (
              <Text style={styles.bioText}>{profile.bio}</Text>
            )}
          </View>

          {/* LOGOUT */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={COLORS.ERROR}
            />

            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>

      {/* FLOATING SAVE BAR */}
      {isEditing && (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
              style={styles.saveBtn}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  Save Changes
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },

  headerGradient: {
    paddingTop: 55,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,

    shadowColor: "#4B0082",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  editBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },

  editingBadge: {
    alignSelf: "center",
    backgroundColor: "#E9D5FF",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 16,
  },

  editingText: {
    color: COLORS.PRIMARY,
    fontWeight: "700",
    fontSize: 12,
  },

  content: {
    padding: 20,
  },

  profileCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    elevation: 6,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },

  avatarWrapper: {
    padding: 5,
    borderRadius: 70,
    backgroundColor: COLORS.SECONDARY,
    elevation: 10,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },

  cameraIcon: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: COLORS.SECONDARY,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },

  name: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 30,
    marginTop: 10,
  },

  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 6,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.SUCCESS,
    marginRight: 6,
  },

  onlineText: {
    color: COLORS.SUCCESS,
    fontWeight: "600",
    fontSize: 12,
  },

  statsContainer: {
    flexDirection: "row",
    width: "100%",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.BORDER,
    paddingTop: 18,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    backgroundColor: COLORS.BORDER,
  },

  sectionCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    padding: 20,
    marginTop: 16,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.PRIMARY,
    marginLeft: 8,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  inputIcon: {
    width: 30,
  },

  input: {
    flex: 1,
    paddingBottom: 10,
    borderBottomWidth: 1,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
  },

  professionalField: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  professionalText: {
    marginLeft: 12,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
    flex: 1,
  },

  professionalInput: {
    flex: 1,
    marginLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.SECONDARY,
    paddingBottom: 8,
    color: COLORS.TEXT_PRIMARY,
  },

  bioText: {
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 22,
    fontSize: 14,
  },

  bioInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 16,
    padding: 14,
    color: COLORS.TEXT_PRIMARY,
    textAlignVertical: "top",
  },

  logoutBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: COLORS.CARD,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.ERROR + "25",
  },

  logoutText: {
    color: COLORS.ERROR,
    fontWeight: "700",
    marginLeft: 8,
  },

  floatingBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.96)",
    padding: 12,
    borderRadius: 22,
    elevation: 10,

    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },

  cancelBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },

  cancelBtnText: {
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "700",
  },

  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },

  saveBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
});