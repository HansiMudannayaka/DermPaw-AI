import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { BACKEND_URL } from "../services/api";

const { width } = Dimensions.get("window");

const API_URL = BACKEND_URL || "http://192.168.1.6:8000";
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

const DEFAULT_PROFILE = {
  doctorName: "Doctor",
  email: "",
  clinic: "PetCare Veterinary Clinic",
  experience: "",
  specialization: "",
  phone: "",
  location: "",
  bio: "",
  image: null,
};

export default function DoctorProfileScreen({ navigation }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const animation = Animated.parallel([
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
    ]);

    animation.start();

    return () => animation.stop();
  }, [fadeAnim, scaleAnim, slideAnim]);

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  const loadProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const stored = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem("token");

      if (!stored) {
        console.warn("No logged-in user found in AsyncStorage.");
        return;
      }

      const localUser = JSON.parse(stored);
      const uId = localUser._id || localUser.id || null;

      setUserId(uId);

      setProfile((prev) => ({
        ...prev,
        doctorName:
          localUser.name ||
          localUser.username ||
          prev.doctorName,

        email:
          localUser.email ??
          prev.email,

        specialization:
          localUser.specialization ??
          prev.specialization,

        experience:
          localUser.experience ??
          prev.experience,

        clinic:
          localUser.clinic ??
          prev.clinic,

        phone:
          localUser.phone ??
          prev.phone,

        location:
          localUser.location ??
          prev.location,

        bio:
          localUser.bio ??
          prev.bio,

        image:
          localUser.image ||
          localUser.profileImage ||
          prev.image,
      }));

      if (!uId) {
        console.warn("User ID missing from cached user.");
        return;
      }

      console.log("Loading doctor profile:", `${USERS_API}/${uId}`);

      const res = await fetch(`${USERS_API}/${uId}`, {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      const responseText = await res.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Server returned invalid JSON. HTTP ${res.status}`
          );
        }
      }

      if (!res.ok) {
        throw new Error(
          data.message ||
          `Could not load profile. HTTP ${res.status}`
        );
      }

      const dbUser = data.user || data;

      if (!dbUser || !(dbUser._id || dbUser.id)) {
        throw new Error("Invalid user data returned by server.");
      }

      const updatedProfile = {
        doctorName:
          dbUser.name ||
          dbUser.username ||
          localUser.name ||
          localUser.username ||
          "Doctor",

        email:
          dbUser.email ??
          localUser.email ??
          "",

        specialization:
          dbUser.specialization ??
          localUser.specialization ??
          "",

        experience:
          dbUser.experience ??
          localUser.experience ??
          "",

        clinic:
          dbUser.clinic ??
          localUser.clinic ??
          "PetCare Veterinary Clinic",

        phone:
          dbUser.phone ??
          localUser.phone ??
          "",

        location:
          dbUser.location ??
          localUser.location ??
          "",

        bio:
          dbUser.bio ??
          localUser.bio ??
          "",

        image:
          dbUser.image ||
          dbUser.profileImage ||
          localUser.image ||
          localUser.profileImage ||
          null,
      };

      setProfile(updatedProfile);

      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          ...localUser,
          ...dbUser,
        })
      );
    } catch (error) {
      console.error(
        "Could not load doctor profile:",
        error?.message
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  // ============================================================
  // EDIT STATE
  // ============================================================

  useEffect(() => {
    if (isEditing) {
      if (!originalProfile) {
        setOriginalProfile({
          ...profile,
        });
      }
    } else {
      setOriginalProfile(null);
    }
  }, [isEditing]);

  const handleChange = (key, value) => {
    setProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  const pickImage = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow photo library access to select a profile image."
        );

        return;
      }

      if (!isEditing) {
        setIsEditing(true);
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          // Expo SDK 57
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          base64: true,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset = result.assets[0];

      const imageUri = asset.base64
        ? `data:image/jpeg;base64,${asset.base64}`
        : asset.uri;

      setProfile((prev) => ({
        ...prev,
        image: imageUri,
      }));
    } catch (error) {
      console.error(
        "Profile image picker error:",
        error?.message
      );

      Alert.alert(
        "Image Error",
        error?.message ||
        "Could not select profile image."
      );
    }
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async () => {
    if (!userId) {
      Alert.alert(
        "Error",
        "Could not identify your account. Please log in again."
      );
      return;
    }

    if (!profile.doctorName?.trim()) {
      Alert.alert(
        "Required",
        "Please enter your full name."
      );
      return;
    }

    if (!profile.email?.trim()) {
      Alert.alert(
        "Required",
        "Please enter your email address."
      );
      return;
    }

    setIsSaving(true);

    try {
      const token = await AsyncStorage.getItem("token");

      const payload = {
        name: profile.doctorName.trim(),
        email: profile.email.trim(),
        specialization: profile.specialization?.trim() || "",
        experience: profile.experience?.trim() || "",
        clinic: profile.clinic?.trim() || "",
        phone: profile.phone?.trim() || "",
        location: profile.location?.trim() || "",
        bio: profile.bio?.trim() || "",
        image: profile.image,
        profileImage: profile.image,
      };

      console.log(
        "Updating doctor profile:",
        `${USERS_API}/${userId}`
      );

      // Don't log payload because image may contain huge Base64.

      const res = await fetch(
        `${USERS_API}/${userId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify(payload),
        }
      );

      const responseText = await res.text();

      let data = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          throw new Error(
            `Server returned invalid JSON. HTTP ${res.status}`
          );
        }
      }

      if (!res.ok) {
        console.error(
          "Profile update HTTP status:",
          res.status
        );

        console.error(
          "Profile update response:",
          responseText
        );

        throw new Error(
          data.message ||
          `Failed to update profile. HTTP ${res.status}`
        );
      }

      const serverUser = data.user || data;

      const stored =
        await AsyncStorage.getItem("user");

      const cachedUser = stored
        ? JSON.parse(stored)
        : {};

      const updatedUser = {
        ...cachedUser,
        ...serverUser,

        _id:
          serverUser._id ||
          cachedUser._id ||
          userId,

        name:
          serverUser.name ||
          payload.name,

        email:
          serverUser.email ||
          payload.email,

        image:
          serverUser.image ||
          payload.image,

        profileImage:
          serverUser.profileImage ||
          serverUser.image ||
          payload.image,

        specialization:
          serverUser.specialization ??
          payload.specialization,

        experience:
          serverUser.experience ??
          payload.experience,

        clinic:
          serverUser.clinic ??
          payload.clinic,

        phone:
          serverUser.phone ??
          payload.phone,

        location:
          serverUser.location ??
          payload.location,

        bio:
          serverUser.bio ??
          payload.bio,
      };

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );

      setProfile((prev) => ({
        ...prev,
        doctorName: updatedUser.name,
        email: updatedUser.email,
        specialization:
          updatedUser.specialization || "",
        experience:
          updatedUser.experience || "",
        clinic:
          updatedUser.clinic || "",
        phone:
          updatedUser.phone || "",
        location:
          updatedUser.location || "",
        bio:
          updatedUser.bio || "",
        image:
          updatedUser.image ||
          updatedUser.profileImage ||
          null,
      }));

      setOriginalProfile(null);
      setIsEditing(false);

      Alert.alert(
        "Success",
        "Profile updated successfully!"
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error?.message
      );

      Alert.alert(
        "Update Error",
        error?.message ||
        "Could not update profile. Check your connection."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // CANCEL
  // ============================================================

  const handleCancel = () => {
    if (originalProfile) {
      setProfile({
        ...originalProfile,
      });
    }

    setOriginalProfile(null);
    setIsEditing(false);
  };

  // ============================================================
  // LOGOUT
  // ============================================================

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
              await AsyncStorage.multiRemove([
                "token",
                "user",
              ]);

              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "SignIn",
                  },
                ],
              });
            } catch (error) {
              console.error(
                "Logout error:",
                error?.message
              );
            }
          },
        },
      ]
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[
            COLORS.PRIMARY,
            COLORS.SECONDARY,
          ]}
          style={styles.headerGradient}
          start={{
            x: 0,
            y: 0,
          }}
          end={{
            x: 1,
            y: 0,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() =>
                navigation.goBack()
              }
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

            <TouchableOpacity
              onPress={() => {
                if (isEditing) {
                  handleCancel();
                } else {
                  setOriginalProfile({
                    ...profile,
                  });
                  setIsEditing(true);
                }
              }}
            >
              <LinearGradient
                colors={[
                  COLORS.PRIMARY,
                  COLORS.SECONDARY,
                ]}
                style={styles.editBtn}
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
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {isEditing && (
            <View style={styles.editingBadge}>
              <Text style={styles.editingText}>
                Editing Profile
              </Text>
            </View>
          )}
        </LinearGradient>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                {
                  scale: scaleAnim,
                },
                {
                  translateY: slideAnim,
                },
              ],
            },
          ]}
        >
          {/* PROFILE */}

          <View style={styles.profileCard}>
            {isLoading ? (
              <ActivityIndicator
                size="large"
                color={COLORS.SECONDARY}
                style={{
                  marginVertical: 35,
                }}
              />
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => {
                    if (isEditing) {
                      pickImage();
                    }
                  }}
                  activeOpacity={
                    isEditing ? 0.8 : 1
                  }
                >
                  <View style={styles.avatarWrapper}>
                    <Image
                      source={
                        profile.image
                          ? {
                              uri:
                                profile.image,
                            }
                          : require(
                              "../../../assets/images/doctor.jpg"
                            )
                      }
                      style={styles.avatar}
                    />
                  </View>

                  {isEditing && (
                    <View style={styles.cameraIcon}>
                      <Ionicons
                        name="camera"
                        size={18}
                        color="#fff"
                      />
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.name}>
                  {profile.doctorName}
                </Text>

                <View style={styles.badge}>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={14}
                    color="#fff"
                  />

                  <Text style={styles.badgeText}>
                    Verified Doctor
                  </Text>
                </View>

                <View style={styles.statusRow}>
                  <View style={styles.onlineDot} />

                  <Text style={styles.onlineText}>
                    Available for Consultation
                  </Text>
                </View>

                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      150+
                    </Text>
                    <Text style={styles.statLabel}>
                      Patients
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      98%
                    </Text>
                    <Text style={styles.statLabel}>
                      Satisfaction
                    </Text>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {profile.experience || "—"}
                    </Text>
                    <Text style={styles.statLabel}>
                      Experience
                    </Text>
                  </View>
                </View>
              </>
            )}
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
              <View
                key={field.key}
                style={styles.inputContainer}
              >
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
                      borderBottomColor:
                        isEditing
                          ? COLORS.SECONDARY
                          : COLORS.BORDER,
                    },
                  ]}
                  editable={isEditing}
                  value={
                    profile[field.key] || ""
                  }
                  onChangeText={(text) =>
                    handleChange(
                      field.key,
                      text
                    )
                  }
                  placeholder={field.label}
                  placeholderTextColor={
                    COLORS.TEXT_LIGHT
                  }
                  keyboardType={
                    field.keyboardType
                  }
                  autoCapitalize={
                    field.key === "email"
                      ? "none"
                      : "sentences"
                  }
                />
              </View>
            ))}
          </Animated.View>

          {/* PROFESSIONAL */}

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
              <View
                key={item.key}
                style={styles.professionalField}
              >
                <MaterialCommunityIcons
                  name={item.icon}
                  size={20}
                  color={COLORS.SECONDARY}
                />

                {isEditing ? (
                  <TextInput
                    style={styles.professionalInput}
                    value={
                      profile[item.key] || ""
                    }
                    placeholder={item.label}
                    placeholderTextColor={
                      COLORS.TEXT_LIGHT
                    }
                    onChangeText={(text) =>
                      handleChange(
                        item.key,
                        text
                      )
                    }
                  />
                ) : (
                  <Text style={styles.professionalText}>
                    {profile[item.key] || "Not provided"}
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

              <Text style={styles.sectionTitle}>
                Bio
              </Text>
            </View>

            {isEditing ? (
              <TextInput
                style={styles.bioInput}
                value={profile.bio || ""}
                onChangeText={(text) =>
                  handleChange(
                    "bio",
                    text
                  )
                }
                multiline
                placeholder="Write something..."
                placeholderTextColor={
                  COLORS.TEXT_LIGHT
                }
              />
            ) : (
              <Text style={styles.bioText}>
                {profile.bio ||
                  "No bio added yet."}
              </Text>
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

            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>

          <View
            style={{
              height: 120,
            }}
          />
        </Animated.View>
      </ScrollView>

      {/* SAVE BAR */}

      {isEditing && (
        <View style={styles.floatingBar}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Text style={styles.cancelBtnText}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
            }}
            onPress={handleSave}
            disabled={isSaving}
          >
            <LinearGradient
              colors={[
                COLORS.PRIMARY,
                COLORS.SECONDARY,
              ]}
              style={styles.saveBtn}
            >
              {isSaving ? (
                <ActivityIndicator
                  size="small"
                  color="#fff"
                />
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
    shadowOffset: {
      width: 0,
      height: 8,
    },
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
    backgroundColor:
      "rgba(255,255,255,0.18)",
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    bottom: 90,
    left: 20,
    right: 20,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 22,
    elevation: 12,
    zIndex: 999,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
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