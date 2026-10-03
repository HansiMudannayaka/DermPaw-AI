/* =========================
   PURPLE THEME PET OWNER CHAT
========================= */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { getMessages, sendMessage, getDoctorStatus } from "../services/chatApi";

const PRIMARY = "#3A0070";
const BG = "#F4F5FA";

export default function PetOwnerChatScreen({ navigation, route }) {
  const {
    doctorId,
    doctorName,
    doctorImage,
    phone,
    consultationId,
    consultation,
  } = route?.params || {};

  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isDoctorAvailable, setIsDoctorAvailable] = useState(true);

  const flatListRef = useRef(null);

  const effectiveConsultationId = consultationId || consultation?._id || null;
  const effectiveDoctorId =
    doctorId ||
    consultation?.doctor?._id ||
    consultation?.doctor?.id ||
    consultation?.doctor;
  const effectiveDoctorName =
    doctorName ||
    consultation?.doctor?.name ||
    consultation?.doctor?.username ||
    "Dr. Veterinarian";
  const effectiveDoctorImage =
    doctorImage ||
    consultation?.doctor?.image ||
    consultation?.doctor?.profileImage ||
    "https://images.unsplash.com/photo-1559839734-2b71ea197ec2";
  const effectivePhone = phone || consultation?.doctor?.phone || null;

  const convId = effectiveDoctorId
    ? `direct_${effectiveDoctorId}`
    : effectiveConsultationId
    ? `consultation_${effectiveConsultationId}`
    : null;

  // Load current user from AsyncStorage
  useEffect(() => {
    async function loadUser() {
      try {
        const u = await AsyncStorage.getItem("user");
        if (u) {
          const parsed = JSON.parse(u);
          setCurrentUserId(parsed._id || parsed.id);
        }
      } catch (err) {
        console.log("Error loading user:", err);
      }
    }
    loadUser();
  }, []);

  // Check live availability status of doctor from backend
  const checkDoctorAvailability = useCallback(async () => {
    if (!effectiveDoctorId) return;
    try {
      const res = await getDoctorStatus(effectiveDoctorId);
      if (res && res.success !== undefined) {
        setIsDoctorAvailable(Boolean(res.available));
      }
    } catch (err) {
      console.log("Doctor availability check error:", err);
    }
  }, [effectiveDoctorId]);

  // Fetch messages from backend
  const fetchChatMessages = useCallback(async (isInitial = false) => {
    if (!convId && !effectiveConsultationId) {
      if (isInitial) setLoading(false);
      return;
    }

    try {
      const targetId = convId || effectiveConsultationId;
      const res = await getMessages(targetId);
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.log("Fetch owner messages error:", err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [convId, effectiveConsultationId]);

  // Reload messages on screen focus + Polling for real-time sync & availability
  useFocusEffect(
    useCallback(() => {
      fetchChatMessages(true);
      checkDoctorAvailability();

      const interval = setInterval(() => {
        fetchChatMessages(false);
        checkDoctorAvailability();
      }, 3500);

      return () => clearInterval(interval);
    }, [fetchChatMessages, checkDoctorAvailability])
  );

  // Send message
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending || !isDoctorAvailable) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      text: trimmed,
      senderRole: "owner",
      sender: { _id: currentUserId, role: "owner" },
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setSending(true);

    try {
      const res = await sendMessage({
        recipientId: effectiveDoctorId,
        consultationId: effectiveConsultationId || undefined,
        text: trimmed,
      });

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.message : m))
        );
      }
    } catch (err) {
      console.log("Send message error:", err);
      Alert.alert(
        "Notice",
        err.message || "Could not send message. Doctor may be unavailable."
      );
      // Rollback
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    if (!isDoctorAvailable) {
      Alert.alert("Notice", "This veterinarian is currently unavailable.");
      return;
    }
    if (effectivePhone) {
      Linking.openURL(`tel:${effectivePhone}`);
    } else {
      Alert.alert("Contact", "Doctor phone number is not available.");
    }
  };

  const renderItem = ({ item }) => {
    const isMe =
      item.senderRole === "owner" ||
      (currentUserId && item.sender && (item.sender._id === currentUserId || item.sender === currentUserId));

    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : (item.time || "");

    return (
      <View
        style={[
          styles.messageContainer,
          {
            alignSelf: isMe ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMe ? PRIMARY : "#fff",
              borderBottomRightRadius: isMe ? 0 : 20,
              borderBottomLeftRadius: isMe ? 20 : 0,
            },
          ]}
        >
          <Text
            style={{
              color: isMe ? "#fff" : "#222",
              fontSize: 14,
              lineHeight: 21,
            }}
          >
            {item.text}
          </Text>
        </View>

        <Text style={styles.time}>
          {timeStr}
          {item.pending ? " • Sending..." : ""}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>

        <View style={styles.profileRow}>
          <Image
            source={{
              uri: effectiveDoctorImage,
            }}
            style={styles.avatar}
          />

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {effectiveDoctorName}
            </Text>

            {/* LIVE AVAILABILITY STATUS */}
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isDoctorAvailable ? "#00B761" : "#EF4444" },
                ]}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: isDoctorAvailable ? "#00B761" : "#EF4444" },
                ]}
              >
                {isDoctorAvailable ? "Available" : "Unavailable"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleCall}>
            <Ionicons name="call-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* UNAVAILABLE BANNER */}
      {!isDoctorAvailable && (
        <View style={styles.unavailableBanner}>
          <Ionicons name="alert-circle" size={16} color="#DC2626" />
          <Text style={styles.unavailableBannerText}>
            This veterinarian is currently unavailable or removed by admin.
          </Text>
        </View>
      )}

      {/* CHAT LIST */}
      <View style={styles.chatArea}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centerContainer}>
            <MaterialCommunityIcons
              name="chat-outline"
              size={56}
              color="#ccc"
            />
            <Text style={styles.emptyTitle}>Start conversation</Text>
            <Text style={styles.emptySub}>
              Ask questions about your dog's skin condition or medication.
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={(item, index) => item._id?.toString() || item.id?.toString() || String(index)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
      </View>

      {/* MESSAGE INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder={
            isDoctorAvailable
              ? "Write a message to doctor..."
              : "Doctor is currently unavailable"
          }
          value={inputText}
          onChangeText={setInputText}
          style={[
            styles.input,
            !isDoctorAvailable && { backgroundColor: "#ECECF0" },
          ]}
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
          editable={isDoctorAvailable}
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            {
              opacity:
                inputText.trim().length > 0 && isDoctorAvailable ? 1 : 0.4,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending || !isDoctorAvailable}
          activeOpacity={0.7}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F5FA",
    justifyContent: "center",
    alignItems: "center",
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
    backgroundColor: "#E2D2F0",
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 5,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  unavailableBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA",
  },

  unavailableBannerText: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "500",
    flex: 1,
  },

  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F5FA",
    justifyContent: "center",
    alignItems: "center",
  },

  messageContainer: {
    marginBottom: 15,
    maxWidth: "80%",
  },

  messageBubble: {
    padding: 14,
    borderRadius: 18,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },

  time: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
    marginLeft: 5,
  },

  chatArea: {
    flex: 1,
  },

  listContent: {
    padding: 15,
    paddingBottom: 15,
  },

  inputContainer: {
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },

  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: "#F4F5FA",
    borderRadius: 18,
    marginRight: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "#111",
    fontSize: 14,
  },

  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginTop: 16,
  },

  emptySub: {
    fontSize: 13,
    color: "#777",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});