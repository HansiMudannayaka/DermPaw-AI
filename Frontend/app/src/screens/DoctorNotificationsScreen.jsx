/* ====================================================
   DOCTOR NOTIFICATIONS SCREEN - DERMPAW AI
   Real-time notifications for new chat messages & case reviews
==================================================== */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { BACKEND_URL } from "../services/api";

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD_BG = "#FFFFFF";

const DEFAULT_PET_IMAGE = require("../../../assets/images/dog.png");

const DISMISSED_NOTIFICATIONS_KEY = "@doctor_dismissed_notifications";
const READ_NOTIFICATIONS_KEY = "@doctor_read_notifications";

export default function DoctorNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(new Set());
  const [readIds, setReadIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all"); // 'all' | 'review' | 'message'

  // Load dismissed and read caches from AsyncStorage
  const loadCaches = async () => {
    try {
      const [storedDismissed, storedRead] = await Promise.all([
        AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY),
        AsyncStorage.getItem(READ_NOTIFICATIONS_KEY),
      ]);
      if (storedDismissed) {
        setDismissedIds(new Set(JSON.parse(storedDismissed)));
      }
      if (storedRead) {
        setReadIds(new Set(JSON.parse(storedRead)));
      }
    } catch (err) {
      console.log("Error loading notification caches:", err);
    }
  };

  const saveDismissedIds = async (newSet) => {
    try {
      await AsyncStorage.setItem(
        DISMISSED_NOTIFICATIONS_KEY,
        JSON.stringify(Array.from(newSet))
      );
    } catch (err) {
      console.log("Error saving dismissed notifications:", err);
    }
  };

  const saveReadIds = async (newSet) => {
    try {
      await AsyncStorage.setItem(
        READ_NOTIFICATIONS_KEY,
        JSON.stringify(Array.from(newSet))
      );
    } catch (err) {
      console.log("Error saving read notifications:", err);
    }
  };

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch(`${BACKEND_URL}/api/doctor/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);

        // Record all current notifications as seen
        AsyncStorage.getItem("@doctor_seen_notification_ids")
          .then((stored) => {
            const seenSet = new Set(stored ? JSON.parse(stored) : []);
            data.notifications.forEach((n) => seenSet.add(n.id));
            AsyncStorage.setItem(
              "@doctor_seen_notification_ids",
              JSON.stringify(Array.from(seenSet))
            ).catch(() => {});
          })
          .catch(() => {});
      }
    } catch (err) {
      console.log("Error fetching notifications:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCaches();
      fetchNotifications(true);
      AsyncStorage.setItem(
        "@doctor_last_seen_notifications_timestamp",
        new Date().toISOString()
      ).catch(() => {});
    }, [fetchNotifications])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(false);
    setRefreshing(false);
  }, [fetchNotifications]);

  // Handle tapping a notification -> Marks as read but KEEPS in history!
  const handlePressNotification = async (item) => {
    // 1. Mark as read in state & AsyncStorage (does NOT remove from history)
    const newRead = new Set(readIds);
    newRead.add(item.id);
    setReadIds(newRead);
    await saveReadIds(newRead);

    // 2. Navigate to corresponding screen
    if (item.type === "review") {
      navigation.navigate("AIResultDetail", {
        selectedTab: "Medium",
        petName: item.petName,
        reviewId: item.consultationId,
        diagnosis: item.condition || "Skin Scan",
        consultation: item.original,
      });
    } else if (item.type === "message") {
      navigation.navigate("ChatsScreen", {
        user: {
          id: item.consultationId || item.ownerId,
          ownerId: item.ownerId,
          owner: item.ownerName,
          avatar: item.image ? { uri: item.image } : DEFAULT_PET_IMAGE,
          original: item.original,
        },
        consultationId: item.consultationId,
        ownerId: item.ownerId,
        fromScreen: "DoctorNotifications",
      });
    }
  };

  // Manually delete single notification from history
  const handleDismissNotification = (id) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(id);
    setDismissedIds(newDismissed);
    saveDismissedIds(newDismissed);
  };

  // Clear all notifications from history
  const handleClearAll = () => {
    if (visibleNotifications.length === 0) return;

    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your notification history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            const newDismissed = new Set(dismissedIds);
            notifications.forEach((n) => newDismissed.add(n.id));
            setDismissedIds(newDismissed);
            saveDismissedIds(newDismissed);
          },
        },
      ]
    );
  };

  // Filter notifications by dismissed state and active tab (history is kept intact)
  const visibleNotifications = useMemo(() => {
    return notifications
      .filter((n) => !dismissedIds.has(n.id))
      .filter((n) => {
        if (selectedTab === "review") return n.type === "review";
        if (selectedTab === "message") return n.type === "message";
        return true;
      });
  }, [notifications, dismissedIds, selectedTab]);

  const reviewCount = useMemo(() => {
    return notifications.filter(
      (n) => n.type === "review" && !dismissedIds.has(n.id)
    ).length;
  }, [notifications, dismissedIds]);

  const messageCount = useMemo(() => {
    return notifications.filter(
      (n) => n.type === "message" && !dismissedIds.has(n.id)
    ).length;
  }, [notifications, dismissedIds]);

  const renderItem = ({ item }) => {
    const isReview = item.type === "review";
    const isRead = item.read || readIds.has(item.id);

    const timeFormatted = item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

    const dateFormatted = item.timestamp
      ? new Date(item.timestamp).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })
      : "";

    let avatarSource = DEFAULT_PET_IMAGE;
    if (item.image && typeof item.image === "string" && item.image.startsWith("http")) {
      avatarSource = { uri: item.image };
    }

    return (
      <TouchableOpacity
        style={[
          styles.card,
          !isRead && styles.cardUnread,
        ]}
        activeOpacity={0.8}
        onPress={() => handlePressNotification(item)}
      >
        {/* AVATAR / ICON */}
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.avatar} />
          <View
            style={[
              styles.typeBadge,
              { backgroundColor: isReview ? "#F59E0B" : PRIMARY },
            ]}
          >
            <MaterialCommunityIcons
              name={isReview ? "stethoscope" : "chat-processing"}
              size={12}
              color="#fff"
            />
          </View>
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.tagRow}>
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor: isReview ? "#FEF3C7" : "#EDE9FE",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isReview ? "#B45309" : PRIMARY },
                  ]}
                >
                  {isReview ? "Case Review" : "Chat Message"}
                </Text>
              </View>

              {!isRead && (
                <View style={styles.unreadDotBadge}>
                  <Text style={styles.unreadDotText}>NEW</Text>
                </View>
              )}
            </View>

            <Text style={styles.timeText}>
              {dateFormatted} • {timeFormatted}
            </Text>
          </View>

          <Text
            style={[
              styles.titleText,
              !isRead && { fontWeight: "800", color: "#111" },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          <Text
            style={[
              styles.messageText,
              !isRead && { color: "#1F2937" },
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>

          <View style={styles.actionRow}>
            <Text style={styles.actionPromptText}>
              {isReview ? "Tap to review case →" : "Tap to open chat →"}
            </Text>
          </View>
        </View>

        {/* DELETE FROM HISTORY BUTTON */}
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={() => handleDismissNotification(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle-outline" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* HEADER */}
      <LinearGradient
        colors={[PRIMARY, SECONDARY]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSub}>
              {visibleNotifications.length} active alert
              {visibleNotifications.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {visibleNotifications.length > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={handleClearAll}
              activeOpacity={0.8}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FILTER TABS */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              selectedTab === "all" && styles.tabBtnActive,
            ]}
            onPress={() => setSelectedTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "all" && styles.tabTextActive,
              ]}
            >
              All ({visibleNotifications.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              selectedTab === "review" && styles.tabBtnActive,
            ]}
            onPress={() => setSelectedTab("review")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "review" && styles.tabTextActive,
              ]}
            >
              Reviews ({reviewCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              selectedTab === "message" && styles.tabBtnActive,
            ]}
            onPress={() => setSelectedTab("message")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "message" && styles.tabTextActive,
              ]}
            >
              Messages ({messageCount})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* BODY / LIST */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={visibleNotifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[PRIMARY]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="notifications-off-outline"
                  size={44}
                  color={PRIMARY}
                />
              </View>
              <Text style={styles.emptyTitle}>You're all caught up!</Text>
              <Text style={styles.emptySub}>
                {selectedTab === "review"
                  ? "No pending case reviews waiting for your advice."
                  : selectedTab === "message"
                  ? "No unread chat messages from pet owners."
                  : "When pet owners send messages or case reviews, they will appear here."}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  headerSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  clearAllBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 16,
    gap: 8,
  },
  tabBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  tabTextActive: {
    color: PRIMARY,
    fontWeight: "700",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardUnread: {
    backgroundColor: "#FAF7FF",
    borderColor: "#DDD6FE",
  },
  unreadDotBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 6,
  },
  unreadDotText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E2D2F0",
  },
  typeBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    paddingRight: 6,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  tag: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timeText: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  titleText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 6,
  },
  actionPromptText: {
    fontSize: 12,
    fontWeight: "600",
    color: PRIMARY,
  },
  dismissBtn: {
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    color: "#6B7280",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 30,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 19,
  },
});
