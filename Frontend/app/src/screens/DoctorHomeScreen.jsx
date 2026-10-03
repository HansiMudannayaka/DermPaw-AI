import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKEND_URL } from "../services/api";

const { width } = Dimensions.get("window");

// Constants
const COLORS = {
  PRIMARY: "#4B0082",
  SECONDARY: "#8A2BE2",
  BACKGROUND: "#F6F4FA",
  CARD: "#FFFFFF",
  TEXT_PRIMARY: "#2E1065",
  TEXT_SECONDARY: "#777777",
  TAG_BG: "#E8D9FF",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",
  INFO: "#3B82F6",
};

// Priority colors
const PRIORITY_CONFIG = {
  High: { color: COLORS.ERROR, bg: "#FEE2E2" },
  Medium: { color: COLORS.WARNING, bg: "#FEF3C7" },
  Low: { color: COLORS.SUCCESS, bg: "#D1FAE5" },
};

// Default fallback image
const DEFAULT_PET_IMAGE = require("../../../assets/images/dog.png");

// ============================================================
// HELPERS
// ============================================================

const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "string") {
    return value;
  }

  if (value._id) {
    return value._id.toString();
  }

  if (value.id) {
    return value.id.toString();
  }

  return null;
};

const getImageSource = (value) => {
  if (!value || typeof value !== "string") {
    return DEFAULT_PET_IMAGE;
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return { uri: value };
  }

  return DEFAULT_PET_IMAGE;
};

const getOwnerId = (conversation) => {
  return (
    getId(conversation?.owner) ||
    getId(conversation?.partner) ||
    getId(conversation?.user) ||
    getId(conversation?.recipient) ||
    null
  );
};

const getConsultationId = (conversation) => {
  return (
    getId(conversation?.consultation) ||
    getId(conversation?.consultationId) ||
    getId(conversation?.lastMessage?.consultation) ||
    getId(conversation?.lastMessage?.consultationId) ||
    null
  );
};

const getOwnerName = (conversation) => {
  const partner =
    conversation?.partner ||
    conversation?.owner ||
    conversation?.user ||
    conversation?.recipient;

  if (typeof partner === "string") {
    return partner;
  }

  return (
    partner?.name ||
    partner?.username ||
    conversation?.ownerName ||
    conversation?.partnerName ||
    ""
  );
};

const getPetName = (conversation) => {
  return (
    conversation?.consultation?.pet?.name ||
    conversation?.consultation?.petName ||
    conversation?.pet?.name ||
    conversation?.petName ||
    ""
  );
};

const getPetImage = (conversation) => {
  const partner =
    conversation?.partner ||
    conversation?.owner ||
    conversation?.user ||
    conversation?.recipient;

  return getImageSource(
    conversation?.consultation?.pet?.image ||
      conversation?.consultation?.petImage ||
      conversation?.pet?.image ||
      conversation?.petImage ||
      partner?.profileImage ||
      partner?.image
  );
};

const getLastMessageText = (conversation) => {
  const lastMessage = conversation?.lastMessage;

  if (typeof lastMessage === "string") {
    return lastMessage;
  }

  if (typeof lastMessage?.text === "string") {
    return lastMessage.text;
  }

  if (typeof lastMessage?.message === "string") {
    return lastMessage.message;
  }

  return "";
};

const getLastMessageDate = (conversation) => {
  return (
    getValidDate(conversation?.lastMessage?.createdAt) ||
    getValidDate(conversation?.lastMessage?.updatedAt) ||
    getValidDate(conversation?.updatedAt) ||
    getValidDate(conversation?.createdAt)
  );
};

const getUnreadCount = (conversation) => {
  const count = Number(conversation?.unreadCount);

  return Number.isFinite(count) && count > 0 ? count : 0;
};

const formatTime = (date) => {
  if (!date) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// ============================================================
// STAT CARD
// ============================================================

const StatCard = React.memo(({ icon, number, label, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={24} color={COLORS.SECONDARY} />
    </View>

    <Text style={styles.number}>{number}</Text>

    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
));

// ============================================================
// REVIEW QUEUE ITEM
// ============================================================

const ReviewQueueItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.listCard}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <Image source={item.petImage} style={styles.image} />

    <View style={styles.listContent}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>{item.petName}</Text>

        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      <Text style={styles.sub}>{item.diagnosis}</Text>
    </View>

    <TouchableOpacity
      style={styles.actionBtn}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.actionText}>Review</Text>

      <Ionicons
        name="arrow-forward"
        size={12}
        color="#fff"
      />
    </TouchableOpacity>
  </TouchableOpacity>
));

// ============================================================
// ACTIVE CHAT ITEM
// ============================================================

const ActiveChatItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity
    style={styles.listCard}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <View style={styles.chatAvatarContainer}>
      <Image
        source={item.petImage}
        style={styles.chatAvatar}
      />

      {item.unread > 0 && (
        <View style={styles.unreadDot} />
      )}
    </View>

    <View style={styles.listContent}>
      <View style={styles.listHeader}>
        <View style={styles.chatOwnerContainer}>
          <Text style={styles.title}>
            {item.ownerName}
          </Text>

          {item.petName ? (
            <Text style={styles.petSubtext}>
              Pet: {item.petName}
            </Text>
          ) : null}
        </View>

        <Text style={styles.timestamp}>
          {item.timestamp}
        </Text>
      </View>

      <Text
        style={[
          styles.lastMessage,
          item.unread > 0 && styles.unreadMessage,
        ]}
        numberOfLines={1}
      >
        {item.lastMessage}
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={16}
      color={COLORS.TEXT_SECONDARY}
    />
  </TouchableOpacity>
));

// ============================================================
// TYPING GREETING
// ============================================================

const TypingGreeting = ({ text }) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;

    setDisplayText("");

    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));

      i++;

      if (i === text.length) {
        clearInterval(interval);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [text]);

  return (
    <Text style={styles.greeting}>
      {displayText}
    </Text>
  );
};

// ============================================================
// DOCTOR HOME
// ============================================================

export default function DoctorHome({ navigation }) {
  const [reviewRequests, setReviewRequests] = useState(0);
  const [completedReviews, setCompletedReviews] = useState(0);

  const [reviewQueue, setReviewQueue] = useState([]);
  const [activeChats, setActiveChats] = useState([]);

  const [refreshing, setRefreshing] = useState(false);

  const [doctorName, setDoctorName] = useState("Doctor");
  const [doctorImage, setDoctorImage] = useState(null);

  const hour = new Date().getHours();

  const greetingText =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  // ==========================================================
  // LOAD DOCTOR INFO
  // ==========================================================

  const loadDoctorInfo = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem("user");

      if (!stored) return;

      const user = JSON.parse(stored);

      const userId = user._id || user.id;

      // Load cached doctor information first
      setDoctorName(
        user.name ||
          user.username ||
          "Doctor"
      );

      const img =
        user.image ||
        user.profileImage;

      if (img) {
        setDoctorImage({ uri: img });
      } else {
        setDoctorImage(null);
      }

      // Fetch fresh doctor information
      if (userId) {
        const token =
          await AsyncStorage.getItem("token");

        const res = await fetch(
          `${BACKEND_URL}/api/users/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        const serverUser =
          data.user || data;

        if (
          serverUser &&
          (serverUser._id || serverUser.id)
        ) {
          setDoctorName(
            serverUser.name ||
              serverUser.username ||
              "Doctor"
          );

          const freshImg =
            serverUser.image ||
            serverUser.profileImage;

          if (freshImg) {
            setDoctorImage({
              uri: freshImg,
            });
          } else {
            setDoctorImage(null);
          }

          await AsyncStorage.setItem(
            "user",
            JSON.stringify({
              ...user,
              ...serverUser,
            })
          );
        }
      }
    } catch (err) {
      console.log(
        "Could not load doctor info:",
        err
      );
    }
  }, []);

  // ==========================================================
  // FETCH REVIEW DATA + REAL CHAT DATA
  // ==========================================================

  const fetchDashboardData = useCallback(async () => {
    try {
      const token =
        await AsyncStorage.getItem("token");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // ------------------------------------------------------
      // Fetch consultations for review queue/statistics
      // ------------------------------------------------------

      const consultationResponse = await fetch(
        `${BACKEND_URL}/api/consultations/doctor`,
        {
          headers,
        }
      );

      const consultationData =
        await consultationResponse.json();

      if (consultationData.success) {
        const consultations =
          consultationData.consultations || [];

        // Only show pending cases
        const pendingConsultations =
          consultations.filter(
            (item) =>
              item.status !== "approved" &&
              item.status !== "reviewed" &&
              item.status !== "completed"
          );

        const queue =
          pendingConsultations.map((item) => {
            const conf =
              item.aiResult?.confidence || 50;

            const isHigh =
              conf > 85 ||
              item.aiResult?.severity === "High" ||
              item.severity === "High";

            const priority = isHigh
              ? "High"
              : "Medium";

            let imgSource =
              DEFAULT_PET_IMAGE;

            if (
              item.pet?.image &&
              (
                item.pet.image.startsWith(
                  "http://"
                ) ||
                item.pet.image.startsWith(
                  "https://"
                )
              )
            ) {
              imgSource = {
                uri: item.pet.image,
              };
            } else if (
              item.petImage &&
              (
                item.petImage.startsWith(
                  "http://"
                ) ||
                item.petImage.startsWith(
                  "https://"
                )
              )
            ) {
              imgSource = {
                uri: item.petImage,
              };
            }

            const createdDate =
              getValidDate(
                item.createdAt
              );

            return {
              id: item._id,
              petName:
                item.pet?.name ||
                item.petName ||
                "My Dog",
              petImage: imgSource,
              diagnosis:
                item.aiResult?.disease ||
                "Skin Scan",
              priority,
              timestamp:
                createdDate?.toLocaleDateString() ||
                "",
              original: item,
            };
          });

        const reviewedConsultations =
          consultations.filter(
            (item) =>
              item.status === "approved" ||
              item.status === "reviewed" ||
              item.status === "completed"
          );

        setReviewQueue(queue);

        setReviewRequests(
          queue.length
        );

        setCompletedReviews(
          reviewedConsultations.length
        );
      }

      // ------------------------------------------------------
      // Fetch REAL conversations
      // ------------------------------------------------------

      const chatResponse = await fetch(
        `${BACKEND_URL}/api/chat/conversations`,
        {
          headers,
        }
      );

      const chatData =
        await chatResponse.json();

      if (chatData.success) {
        const conversations =
          Array.isArray(chatData.conversations)
            ? chatData.conversations
            : [];

        const chats = conversations
          .map((conversation) => {
            const ownerId =
              getOwnerId(conversation);

            // Do not create fake/invalid chat records
            if (!ownerId) {
              return null;
            }

            const conversationId =
              getId(
                conversation._id ||
                  conversation.id
              );

            const consultationId =
              getConsultationId(
                conversation
              );

            const lastMessage =
              getLastMessageText(
                conversation
              );

            const lastMessageDate =
              getLastMessageDate(
                conversation
              );

            const ownerName =
              getOwnerName(
                conversation
              );

            const petName =
              getPetName(
                conversation
              );

            const unread =
              getUnreadCount(
                conversation
              );

            return {
              id:
                conversationId ||
                `${ownerId}_conversation`,

              ownerId,

              consultationId,

              ownerName,

              petName,

              petImage:
                getPetImage(
                  conversation
                ),

              lastMessage,

              timestamp:
                formatTime(
                  lastMessageDate
                ),

              rawTime:
                lastMessageDate ||
                new Date(0),

              unread,

              original:
                conversation,
            };
          })
          .filter(Boolean)
          .sort(
            (a, b) =>
              b.rawTime.getTime() -
              a.rawTime.getTime()
          );

        setActiveChats(chats);
      } else {
        setActiveChats([]);
      }
    } catch (err) {
      console.log(
        "Error fetching doctor dashboard data:",
        err
      );

      // Never create dummy chat data
      setActiveChats([]);
    }
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        fetchDashboardData(),
        loadDoctorInfo(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [
    fetchDashboardData,
    loadDoctorInfo,
  ]);

  // ==========================================================
  // SCREEN FOCUS + REAL DATA POLLING
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      loadDoctorInfo();

      const interval = setInterval(() => {
        fetchDashboardData();
      }, 3500);

      return () => {
        clearInterval(interval);
      };
    }, [
      fetchDashboardData,
      loadDoctorInfo,
    ])
  );

  // ==========================================================
  // REVIEW PRESS
  // ==========================================================

  const handleReviewPress = useCallback(
    (item) => {
      navigation.navigate(
        "AIResultDetail",
        {
          selectedTab: item.priority,
          petName: item.petName,
          reviewId: item.id,
          diagnosis: item.diagnosis,
          consultation:
            item.original,
        }
      );
    },
    [navigation]
  );

  // ==========================================================
  // CHAT PRESS
  // ==========================================================

  const handleChatPress = useCallback(
    (chat) => {
      // Update local UI immediately.
      // Persistent read/unread state must be handled
      // by the backend ChatsScreen/chat API.
      setActiveChats((prev) =>
        prev.map((item) =>
          item.id === chat.id
            ? {
                ...item,
                unread: 0,
              }
            : item
        )
      );

      navigation.navigate(
        "ChatsScreen",
        {
          user: {
            id: chat.id,
            ownerId: chat.ownerId,
            owner: chat.ownerName,
            pet: chat.petName,
            avatar: chat.petImage,
            original:
              chat.original,
          },

          consultationId:
            chat.consultationId || null,

          ownerId:
            chat.ownerId || null,

          fromScreen:
            "DoctorHome",
        }
      );
    },
    [navigation]
  );

  // ==========================================================
  // VIEW ALL CASES
  // ==========================================================

  const handleViewAllCases =
    useCallback(() => {
      navigation.navigate(
        "AIReviewList"
      );
    }, [navigation]);

  // ==========================================================
  // UNREAD COUNT
  // ==========================================================

  const totalUnreadChats =
    useMemo(() => {
      return activeChats.reduce(
        (total, chat) =>
          total + chat.unread,
        0
      );
    }, [activeChats]);

  // ==========================================================
  // HIGH PRIORITY COUNT
  // ==========================================================

  const highPriorityCount =
    useMemo(() => {
      return reviewQueue.filter(
        (item) =>
          item.priority === "High"
      ).length;
    }, [reviewQueue]);

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={
          COLORS.PRIMARY
        }
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() =>
            navigation.navigate(
              "Profile"
            )
          }
          activeOpacity={0.8}
        >
          {doctorImage ? (
            <Image
              source={doctorImage}
              style={styles.doctorImage}
            />
          ) : (
            <View style={[styles.doctorImage, { backgroundColor: "#8A2BE2", justifyContent: "center", alignItems: "center" }]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
          )}

          <View>
            <TypingGreeting
              text={greetingText}
            />

            <Text
              style={styles.username}
            >
              {doctorName}
            </Text>
          </View>
        </TouchableOpacity>

        <View
          style={styles.headerRight}
        >
          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() =>
              navigation.navigate(
                "DoctorProfile"
              )
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="paw"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Card */}
      <LinearGradient
        colors={[
          COLORS.SECONDARY,
          COLORS.PRIMARY,
        ]}
        style={styles.heroCard}
        start={{
          x: 0,
          y: 0,
        }}
        end={{
          x: 1,
          y: 1,
        }}
      >
        <Text
          style={styles.heroTitle}
        >
          AI Pet Review Dashboard
        </Text>

        <Text
          style={styles.heroDesc}
        >
          Review AI detected cases & respond to pet owners
        </Text>

        <TouchableOpacity
          style={styles.heroBtn}
          onPress={
            handleViewAllCases
          }
          activeOpacity={0.7}
        >
          <Text
            style={styles.heroBtnText}
          >
            View All Cases
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={
              COLORS.PRIMARY
            }
          />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Section */}
      <View
        style={styles.statsSection}
      >
        <Text
          style={styles.sectionTitle}
        >
          Today's Activity
        </Text>

        <View style={styles.grid}>
          <StatCard
            icon="document-text"
            number={reviewRequests}
            label="Review Requests"
            onPress={() =>
              navigation.navigate(
                "AIReviewList",
                {
                  filter:
                    "Pending",
                }
              )
            }
          />

          <StatCard
            icon="checkmark-done-circle"
            number={
              completedReviews
            }
            label="Reviewed Cases"
            onPress={() =>
              navigation.navigate(
                "AIReviewList",
                {
                  filter:
                    "Reviewed",
                }
              )
            }
          />
        </View>
      </View>

      {/* Review Queue Section */}
      <View
        style={styles.sectionHeader}
      >
        <Text
          style={styles.sectionTitle}
        >
          AI Review Queue
        </Text>

        <TouchableOpacity
          onPress={
            handleViewAllCases
          }
        >
          <Text
            style={styles.seeAllText}
          >
            See All
          </Text>
        </TouchableOpacity>
      </View>

      {reviewQueue.length === 0 ? (
        <View
          style={styles.emptyCard}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={36}
            color={
              COLORS.SECONDARY
            }
          />

          <Text
            style={
              styles.emptyCardText
            }
          >
            No pending review requests
          </Text>
        </View>
      ) : (
        reviewQueue
          .slice(0, 3)
          .map((item) => (
            <ReviewQueueItem
              key={item.id}
              item={item}
              onPress={
                handleReviewPress
              }
            />
          ))
      )}

      {/* Active Chats Section */}
      <View
        style={styles.sectionHeader}
      >
        <View
          style={
            styles.sectionTitleContainer
          }
        >
          <Text
            style={styles.sectionTitle}
          >
            Active Chats
          </Text>

          {totalUnreadChats > 0 && (
            <View
              style={styles.chatBadge}
            >
              <Text
                style={
                  styles.chatBadgeText
                }
              >
                {totalUnreadChats}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "ChatList"
            )
          }
        >
          <Text
            style={styles.seeAllText}
          >
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {activeChats.length === 0 ? (
        <View
          style={styles.emptyCard}
        >
          <Ionicons
            name="chatbubbles-outline"
            size={36}
            color={
              COLORS.SECONDARY
            }
          />

          <Text
            style={
              styles.emptyCardText
            }
          >
            No active consultations
          </Text>
        </View>
      ) : (
        activeChats
          .slice(0, 3)
          .map((item) => (
            <ActiveChatItem
              key={item.id}
              item={item}
              onPress={
                handleChatPress
              }
            />
          ))
      )}

      {/* Quick Actions */}
      <View
        style={styles.sectionHeader}
      >
        <Text
          style={styles.sectionTitle}
        >
          Quick Actions
        </Text>
      </View>

      <View
        style={styles.quickActions}
      >
        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() =>
            navigation.navigate(
              "AIReviewList"
            )
          }
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[
              COLORS.SECONDARY,
              COLORS.PRIMARY,
            ]}
            style={
              styles.quickActionGradient
            }
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
          >
            <Ionicons
              name="clipboard"
              size={24}
              color="#fff"
            />

            <Text
              style={
                styles.quickActionText
              }
            >
              Review Cases
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickActionBtn}
          onPress={() =>
            navigation.navigate(
              "ChatList"
            )
          }
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[
              COLORS.PRIMARY,
              COLORS.SECONDARY,
            ]}
            style={
              styles.quickActionGradient
            }
            start={{
              x: 0,
              y: 0,
            }}
            end={{
              x: 1,
              y: 1,
            }}
          >
            <Ionicons
              name="chatbubbles"
              size={24}
              color="#fff"
            />

            <Text
              style={
                styles.quickActionText
              }
            >
              Open Chats
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View
        style={styles.bottomPadding}
      />
    </ScrollView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      COLORS.BACKGROUND,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    marginTop: 50,
    alignItems: "center",
    marginBottom: 20,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  doctorImage: {
    width: 55,
    height: 55,
    borderRadius: 28,
    marginRight: 12,
    borderWidth: 2,
    borderColor:
      COLORS.SECONDARY,
  },

  greeting: {
    fontSize: 13,
    color: COLORS.SECONDARY,
    fontWeight: "600",
  },

  username: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 2,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.SECONDARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  heroCard: {
    padding: 22,
    borderRadius: 24,
    marginBottom: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    marginBottom: 16,
    lineHeight: 18,
  },

  heroBtn: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  heroBtnText: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
    fontSize: 13,
  },

  statsSection: {
    marginTop: 8,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 12,
    color: COLORS.PRIMARY,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  seeAllText: {
    fontSize: 12,
    color: COLORS.SECONDARY,
    fontWeight: "600",
  },

  grid: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor:
      COLORS.CARD,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor:
      "#F3E8FF",
    justifyContent:
      "center",
    alignItems: "center",
    marginBottom: 8,
  },

  number: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
    color: COLORS.PRIMARY,
  },

  label: {
    fontSize: 12,
    color: COLORS.SECONDARY,
    fontWeight: "500",
    textAlign: "center",
  },

  alertBanner: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
  },

  alertGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },

  alertContent: {
    flex: 1,
  },

  alertTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  alertText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    marginTop: 2,
  },

  listCard: {
    flexDirection: "row",
    backgroundColor:
      COLORS.CARD,
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  image: {
    width: 55,
    height: 55,
    borderRadius: 14,
    marginRight: 12,
  },

  chatAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },

  chatAvatarContainer: {
    position: "relative",
    marginRight: 12,
  },

  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor:
      COLORS.SECONDARY,
    borderWidth: 1.5,
    borderColor:
      COLORS.CARD,
  },

  listContent: {
    flex: 1,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  chatOwnerContainer: {
    flex: 1,
    paddingRight: 8,
  },

  title: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.PRIMARY,
  },

  petSubtext: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 1,
  },

  timestamp: {
    fontSize: 10,
    color: COLORS.TEXT_SECONDARY,
  },

  sub: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 6,
  },

  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  tagText: {
    fontSize: 10,
    fontWeight: "600",
  },

  actionBtn: {
    backgroundColor:
      COLORS.SECONDARY,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  actionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  messageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },

  lastMessage: {
    flex: 1,
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },

  unreadMessage: {
    color: COLORS.PRIMARY,
    fontWeight: "600",
  },

  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  typingText: {
    color: COLORS.SECONDARY,
    fontSize: 11,
    fontWeight: "500",
  },

  typingDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor:
      COLORS.SECONDARY + "20",
    justifyContent:
      "center",
    alignItems: "center",
  },

  typingDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor:
      COLORS.SECONDARY,
  },

  chatBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor:
      "#F3E8FF",
  },

  chatBadge: {
    backgroundColor:
      COLORS.SECONDARY,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  chatBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },

  quickActionBtn: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 3,
  },

  quickActionGradient: {
    padding: 16,
    alignItems: "center",
    gap: 8,
  },

  quickActionText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  bottomPadding: {
    height: 100,
  },

  emptyCard: {
    backgroundColor:
      COLORS.CARD,
    padding: 24,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    gap: 8,
  },

  emptyCardText: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    fontWeight: "500",
  },
});