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

// Sample data - In real app, this would come from API
const reviewQueueData = [
  {
    id: "1",
    petName: "Luna",
    petImage: require("../../../assets/images/dog1.png"),
    diagnosis: "Skin infection detected",
    priority: "High",
    timestamp: "2 hours ago",
  },
  {
    id: "2",
    petName: "Max",
    petImage: require("../../../assets/images/dog.png"),
    diagnosis: "Allergic reaction",
    priority: "Medium",
    timestamp: "5 hours ago",
  },
  {
    id: "3",
    petName: "Bella",
    petImage: require("../../../assets/images/dob1.png"),
    diagnosis: "Fungal infection",
    priority: "Low",
    timestamp: "1 day ago",
  },
];

const activeChatsData = [
  {
    id: "1",
    ownerName: "Sarah Johnson",
    petName: "Bella",
    petImage: require("../../../assets/images/dog.png"),
    lastMessage: "Waiting for doctor response",
    timestamp: "5 min ago",
    unread: 2,
    isTyping: false,
  },
  {
    id: "2",
    ownerName: "Michael Chen",
    petName: "Rocky",
    petImage: require("../../../assets/images/dog1.png"),
    lastMessage: "When will I get the prescription?",
    timestamp: "30 min ago",
    unread: 0,
    isTyping: true,
  },
];

// Component for stat card
const StatCard = React.memo(({ icon, number, label, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.iconCircle}>
      <Ionicons name={icon} size={24} color={COLORS.SECONDARY} />
    </View>
    <Text style={styles.number}>{number}</Text>
    <Text style={styles.label}>{label}</Text>
  </TouchableOpacity>
));

// Component for review queue item
const ReviewQueueItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.listCard} onPress={() => onPress(item)} activeOpacity={0.7}>
    <Image source={item.petImage} style={styles.image} />
    
    <View style={styles.listContent}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>{item.petName}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      
      <Text style={styles.sub}>{item.diagnosis}</Text>
      
      <View style={[styles.tag, { backgroundColor: PRIORITY_CONFIG[item.priority]?.bg || COLORS.TAG_BG }]}>
        <Text style={[styles.tagText, { color: PRIORITY_CONFIG[item.priority]?.color || COLORS.PRIMARY }]}>
          {item.priority} Priority
        </Text>
      </View>
    </View>

    <TouchableOpacity 
      style={styles.actionBtn} 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Text style={styles.actionText}>Review</Text>
      <Ionicons name="arrow-forward" size={12} color="#fff" />
    </TouchableOpacity>
  </TouchableOpacity>
));

// Component for active chat item
const ActiveChatItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity style={styles.listCard} onPress={() => onPress(item)} activeOpacity={0.7}>
    <View style={styles.chatAvatarContainer}>
      <Image source={item.petImage} style={styles.chatAvatar} />
      {item.unread > 0 && <View style={styles.unreadDot} />}
    </View>
    
    <View style={styles.listContent}>
      <View style={styles.listHeader}>
        <View>
          <Text style={styles.title}>{item.ownerName}</Text>
          <Text style={styles.petSubtext}>Pet: {item.petName}</Text>
        </View>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
      
      <View style={styles.messageContainer}>
        {item.isTyping ? (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>typing</Text>
            <View style={styles.typingDot}>
              <View style={styles.typingDotInner} />
            </View>
          </View>
        ) : (
          <>
            <Ionicons name="chatbubble-ellipses" size={14} color={COLORS.SECONDARY} />
            <Text numberOfLines={1} style={styles.lastMessage}>
              {item.lastMessage}
            </Text>
          </>
        )}
      </View>
    </View>

    <TouchableOpacity 
      style={styles.chatBtn}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Ionicons name="chatbubble" size={18} color={COLORS.SECONDARY} />
    </TouchableOpacity>
  </TouchableOpacity>
));

// Typing animation component
const TypingGreeting = ({ text }) => {
  const [displayText, setDisplayText] = useState("");
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i + 1));
      i++;
      if (i === text.length) clearInterval(interval);
    }, 80);
    
    return () => clearInterval(interval);
  }, [text]);
  
  return <Text style={styles.greeting}>{displayText}</Text>;
};

export default function DoctorHome({ navigation }) {
  const [reviewRequests, setReviewRequests] = useState(12);
  const [pendingReviews, setPendingReviews] = useState(5);
  const [reviewQueue, setReviewQueue] = useState(reviewQueueData);
  const [activeChats, setActiveChats] = useState(activeChatsData);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState(3);
  
  const hour = new Date().getHours();
  const greetingText = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // In real app, update with actual data
    setReviewRequests(12);
    setPendingReviews(5);
    setNotifications(3);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData])
  );

  const handleReviewPress = useCallback((item) => {
    navigation.navigate("AIResultDetail", {
      selectedTab: item.priority,
      petName: item.petName,
      reviewId: item.id,
      diagnosis: item.diagnosis,
    });
  }, [navigation]);

  const handleChatPress = useCallback((chat) => {
    // Mark as read when opening chat
    setActiveChats(prev =>
      prev.map(item =>
        item.id === chat.id ? { ...item, unread: 0 } : item
      )
    );
    
    navigation.navigate("ChatsScreen", {
      user: {
        id: chat.id,
        owner: chat.ownerName,
        pet: chat.petName,
        avatar: chat.petImage,
      },
      fromScreen: "DoctorHome",
    });
  }, [navigation]);

  const handleViewAllCases = useCallback(() => {
    navigation.navigate("AIReviewList");
  }, [navigation]);

  const handleNotificationPress = useCallback(() => {
    setNotifications(0);
    navigation.navigate("Notifications");
  }, [navigation]);

  const totalUnreadChats = useMemo(() => {
    return activeChats.reduce((total, chat) => total + chat.unread, 0);
  }, [activeChats]);

  const highPriorityCount = useMemo(() => {
    return reviewQueue.filter(item => item.priority === "High").length;
  }, [reviewQueue]);

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.PRIMARY} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../../assets/images/doctor.jpg")}
            style={styles.doctorImage}
          />
          <View>
            <TypingGreeting text={greetingText} />
            <Text style={styles.username}>Dr. Arjun Patel</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.notificationBtn} 
            onPress={handleNotificationPress}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.PRIMARY} />
            {notifications > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notifications > 9 ? "9+" : notifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.profileBtn}
            onPress={() => navigation.navigate("DoctorProfile")}
            activeOpacity={0.7}
          >
            <Ionicons name="paw" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hero Card */}
      <LinearGradient 
        colors={[COLORS.SECONDARY, COLORS.PRIMARY]} 
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.heroTitle}>AI Pet Review Dashboard</Text>
        <Text style={styles.heroDesc}>
          Review AI detected cases & respond to pet owners
        </Text>

        <TouchableOpacity
          style={styles.heroBtn}
          onPress={handleViewAllCases}
          activeOpacity={0.7}
        >
          <Text style={styles.heroBtnText}>View All Cases</Text>
          <Ionicons name="arrow-forward" size={18} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Today's Activity</Text>
        <View style={styles.grid}>
          <StatCard
            icon="document-text"
            number={reviewRequests}
            label="Review Requests"
            onPress={handleViewAllCases}
          />
          <StatCard
            icon="time"
            number={pendingReviews}
            label="Pending Reviews"
            onPress={handleViewAllCases}
          />
        </View>
      </View>

      {/* Priority Alert - High Priority Cases */}
      {highPriorityCount > 0 && (
        <TouchableOpacity 
          style={styles.alertBanner}
          onPress={() => navigation.navigate("AIReviewList", { filter: "High" })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[COLORS.ERROR, "#DC2626"]}
            style={styles.alertGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="warning" size={24} color="#fff" />
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>High Priority Cases</Text>
              <Text style={styles.alertText}>
                {highPriorityCount} case{highPriorityCount !== 1 ? 's' : ''} requires immediate attention
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Review Queue Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>AI Review Queue</Text>
        <TouchableOpacity onPress={handleViewAllCases}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      {reviewQueue.slice(0, 3).map((item) => (
        <ReviewQueueItem
          key={item.id}
          item={item}
          onPress={handleReviewPress}
        />
      ))}

      {/* Active Chats Section */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Active Chats</Text>
          {totalUnreadChats > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.chatBadgeText}>{totalUnreadChats}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("ChatList")}>
          <Text style={styles.seeAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {activeChats.map((item) => (
        <ActiveChatItem
          key={item.id}
          item={item}
          onPress={handleChatPress}
        />
      ))}

      {/* Quick Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("AIReviewList")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[COLORS.SECONDARY, COLORS.PRIMARY]}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="clipboard" size={24} color="#fff" />
            <Text style={styles.quickActionText}>Review Cases</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.quickActionBtn}
          onPress={() => navigation.navigate("ChatList")}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubbles" size={24} color="#fff" />
            <Text style={styles.quickActionText}>Open Chats</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    borderColor: COLORS.SECONDARY,
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

  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.ERROR,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  profileBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.SECONDARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  heroCard: {
    padding: 22,
    borderRadius: 24,
    marginBottom: 8,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
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
    shadowOffset: { width: 0, height: 2 },
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
    justifyContent: "space-between",
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
    justifyContent: "space-between",
    gap: 12,
  },

  card: {
    flex: 1,
    backgroundColor: COLORS.CARD,
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },

  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F3E8FF",
    justifyContent: "center",
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
    backgroundColor: COLORS.CARD,
    padding: 14,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
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
    backgroundColor: COLORS.SECONDARY,
    borderWidth: 1.5,
    borderColor: COLORS.CARD,
  },

  listContent: {
    flex: 1,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
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
    backgroundColor: COLORS.SECONDARY,
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
    backgroundColor: COLORS.SECONDARY + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  typingDotInner: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.SECONDARY,
  },

  chatBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F3E8FF",
  },

  chatBadge: {
    backgroundColor: COLORS.SECONDARY,
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
});