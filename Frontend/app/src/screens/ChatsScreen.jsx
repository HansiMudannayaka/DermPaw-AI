/* =========================
   PURPLE THEME DOCTOR CHAT
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
import { getMessages, sendMessage, markRead } from "../services/chatApi";

const PRIMARY = "#3A0070";
const BG = "#F4F5FA";

export default function DoctorChatScreen({ navigation, route }) {
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  const flatListRef = useRef(null);

  const user = route.params?.user || route.params || {};
  const consultationId = route.params?.consultationId || user.consultationId || user.id || user._id || user.original?._id;
  const ownerId = route.params?.ownerId || user.ownerId || user.original?.owner?._id || user.original?.owner || user.userId || user.id;
  const ownerPhone = route.params?.phone || user.phone || user.original?.owner?.phone;

  const ownerName = user.owner || user.ownerName || user.original?.owner?.name || user.original?.owner?.username || "Pet Owner";
  const petName = user.dog || user.pet || user.petName || user.original?.pet?.name || user.original?.petName || "";

  const displayName = petName ? `${ownerName} (Pets: ${petName})` : ownerName;

  // Resolve avatar source correctly
  let avatarSource = require("../../../assets/images/dog.png");
  if (user.avatar) {
    if (typeof user.avatar === "object" && user.avatar.uri) {
      avatarSource = user.avatar;
    } else if (typeof user.avatar === "string") {
      avatarSource = { uri: user.avatar };
    }
  }

  // Conversation identifier - always target direct owner conversation for full thread unification
  const convId = ownerId ? `direct_${ownerId}` : (consultationId ? `consultation_${consultationId}` : null);

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

  // Fetch messages from backend
  const fetchChatMessages = useCallback(async (isInitial = false) => {
    if (!convId && !consultationId) {
      if (isInitial) setLoading(false);
      return;
    }

    try {
      const targetId = convId || consultationId;
      const res = await getMessages(targetId);
      if (res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
      // Explicitly mark conversation as read
      markRead(targetId).catch(() => {});
    } catch (err) {
      console.log("Fetch messages error:", err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [convId, consultationId]);

  // Reload messages on screen focus + Polling for real-time sync
  useFocusEffect(
    useCallback(() => {
      fetchChatMessages(true);

      const interval = setInterval(() => {
        fetchChatMessages(false);
      }, 3500);

      return () => clearInterval(interval);
    }, [fetchChatMessages])
  );

  // Send message
  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      text: trimmed,
      senderRole: "doctor",
      sender: { _id: currentUserId, role: "doctor" },
      createdAt: new Date().toISOString(),
      pending: true,
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setInputText("");
    setSending(true);

    try {
      const res = await sendMessage({
        recipientId: ownerId,
        consultationId: consultationId || undefined,
        text: trimmed,
      });

      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.message : m))
        );
      }
    } catch (err) {
      console.log("Send message error:", err);
      Alert.alert("Error", "Could not send message. Please check your connection.");
      // Rollback
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleCall = () => {
    if (ownerPhone) {
      Linking.openURL(`tel:${ownerPhone}`);
    } else {
      Alert.alert("Contact", "Owner phone number is not available.");
    }
  };

  const renderItem = ({ item }) => {
    const isDoctor =
      item.senderRole === "doctor" ||
      (currentUserId && item.sender && (item.sender._id === currentUserId || item.sender === currentUserId));

    const timeStr = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : (item.time || "");

    return (
      <View
        style={[
          styles.messageContainer,
          {
            alignSelf: isDoctor ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isDoctor ? PRIMARY : "#fff",
              borderBottomRightRadius: isDoctor ? 0 : 20,
              borderBottomLeftRadius: isDoctor ? 20 : 0,
            },
          ]}
        >
          <Text
            style={{
              color: isDoctor ? "#fff" : "#222",
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
          <Image source={avatarSource} style={styles.avatar} />

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: "#00B761" }]} />
              <Text style={styles.statusText}>Available • Active Chat</Text>
            </View>
          </View>
        </View>

        {/* CALL ACTION */}
        <View style={styles.rightIcons}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={handleCall}
          >
            <Ionicons name="call-outline" size={20} color={PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

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
              name="chat-processing-outline"
              size={56}
              color="#ccc"
            />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySub}>
              Send your message to start the conversation.
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

      {/* INPUT AREA */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Write a message..."
          value={inputText}
          onChangeText={setInputText}
          style={styles.input}
          placeholderTextColor="#999"
          multiline
          maxLength={1000}
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { opacity: inputText.trim().length > 0 ? 1 : 0.6 },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
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
    color: "#00B761",
    fontWeight: "600",
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
    marginRight: 10,
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