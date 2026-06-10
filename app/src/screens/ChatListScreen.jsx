import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

/* ================= CONSTANTS ================= */

const COLORS = {
  PRIMARY: "#4B0082",
  SECONDARY: "#8A2BE2",
  BG: "#F6F1FF",
  CARD: "#FFFFFF",
  TEXT_PRIMARY: "#111111",
  TEXT_SECONDARY: "#666666",
  TEXT_LIGHT: "#999999",
  ONLINE: "#22C55E",
  OFFLINE: "#9CA3AF",
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
};

const SORT_OPTIONS = {
  RECENT: "recent",
  UNREAD: "unread",
  ONLINE: "online",
};

/* ================= DUMMY CHAT DATA ================= */

const chats = [
  {
    id: "1",
    owner: "Kasun Perera",
    dog: "Golden Retriever",
    message: "AI detected skin infection. What should I do?",
    time: "2 min ago",
    timestamp: new Date(Date.now() - 2 * 60000),
    unread: 2,
    online: true,
    avatar: "https://i.pravatar.cc/150?img=5",
    lastSeen: "Online",
    isTyping: false,
  },
  {
    id: "2",
    owner: "Nimal Silva",
    dog: "German Shepherd",
    message: "My dog is not eating properly for 2 days",
    time: "10 min ago",
    timestamp: new Date(Date.now() - 10 * 60000),
    unread: 1,
    online: false,
    avatar: "https://i.pravatar.cc/150?img=6",
    lastSeen: "10 min ago",
    isTyping: false,
  },
  {
    id: "3",
    owner: "Dinithi Fernando",
    dog: "Pug",
    message: "Can you check my dog's allergy?",
    time: "30 min ago",
    timestamp: new Date(Date.now() - 30 * 60000),
    unread: 0,
    online: true,
    avatar: "https://i.pravatar.cc/150?img=8",
    lastSeen: "Online",
    isTyping: false,
  },
  {
    id: "4",
    owner: "Shehan Wijesinghe",
    dog: "Beagle",
    message: "My pet has ear infection symptoms",
    time: "1 hour ago",
    timestamp: new Date(Date.now() - 60 * 60000),
    unread: 3,
    online: false,
    avatar: "https://i.pravatar.cc/150?img=12",
    lastSeen: "1 hour ago",
    isTyping: false,
  },
];

/* ================= CHAT ITEM COMPONENT ================= */

const ChatItem = React.memo(({ item, onPress }) => {
  const [isTyping, setIsTyping] = useState(item.isTyping);

  // Simulate typing indicator (for demo)
  React.useEffect(() => {
    if (item.online && !isTyping) {
      const timer = setTimeout(() => setIsTyping(true), 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.card}
      onPress={() => onPress(item)}
    >
      {/* Avatar Section */}
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
        <View style={[styles.onlineDot, { backgroundColor: item.online ? COLORS.ONLINE : COLORS.OFFLINE }]} />
      </View>

      {/* Content Section */}
      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>{item.owner}</Text>
            {item.online && <View style={styles.onlineIndicator} />}
          </View>
          <Text style={styles.time}>{item.time}</Text>
        </View>

        <View style={styles.dogBadge}>
          <MaterialCommunityIcons name="dog" size={12} color={COLORS.PRIMARY} />
          <Text style={styles.dog}>{item.dog}</Text>
        </View>

        <View style={styles.bottomRow}>
          {isTyping ? (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>typing</Text>
              <View style={styles.typingDot}>
                <View style={styles.typingDotInner} />
              </View>
            </View>
          ) : (
            <>
              <Text numberOfLines={1} style={styles.message}>
                {item.message}
              </Text>
              {item.unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unread > 9 ? "9+" : item.unread}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

/* ================= FILTER MODAL COMPONENT ================= */

const FilterModal = ({ visible, onClose, onApply, currentSort }) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Chats</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
        </View>

        {Object.values(SORT_OPTIONS).map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.filterOption}
            onPress={() => onApply(option)}
          >
            <View style={styles.filterOptionLeft}>
              {option === SORT_OPTIONS.RECENT && (
                <Ionicons name="time-outline" size={20} color={COLORS.PRIMARY} />
              )}
              {option === SORT_OPTIONS.UNREAD && (
                <Ionicons name="mail-unread-outline" size={20} color={COLORS.PRIMARY} />
              )}
              {option === SORT_OPTIONS.ONLINE && (
                <Ionicons name="people-outline" size={20} color={COLORS.PRIMARY} />
              )}
              <Text style={styles.filterOptionText}>
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </Text>
            </View>
            {currentSort === option && (
              <Ionicons name="checkmark-circle" size={20} color={COLORS.SUCCESS} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

/* ================= MAIN COMPONENT ================= */

export default function ChatListScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [chatData, setChatData] = useState(chats);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState(SORT_OPTIONS.RECENT);
  const [showFilter, setShowFilter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchLatestChats();
      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  const fetchLatestChats = async () => {
    // Simulate API call to fetch latest chats
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setChatData(chats); // In real app, update with actual data
    setIsLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLatestChats();
    setRefreshing(false);
  }, []);

  // Filter and sort chats
  const filteredAndSortedChats = useMemo(() => {
    let filtered = chatData.filter((item) => {
      const text = search.toLowerCase();
      return (
        item.owner.toLowerCase().includes(text) ||
        item.dog.toLowerCase().includes(text)
      );
    });

    // Apply sorting
    switch (sortBy) {
      case SORT_OPTIONS.UNREAD:
        filtered = filtered.sort((a, b) => b.unread - a.unread);
        break;
      case SORT_OPTIONS.ONLINE:
        filtered = filtered.sort((a, b) => (b.online ? 1 : 0) - (a.online ? 1 : 0));
        break;
      case SORT_OPTIONS.RECENT:
      default:
        filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
    }

    return filtered;
  }, [chatData, search, sortBy]);

  const handleChatPress = useCallback((chat) => {
    // Mark as read when opening chat
    setChatData(prevData =>
      prevData.map(item =>
        item.id === chat.id ? { ...item, unread: 0 } : item
      )
    );
    
    navigation.navigate("ChatsScreen", { 
      user: chat,
      fromScreen: "ChatList"
    });
  }, [navigation]);

  const handleFilterApply = useCallback((sortOption) => {
    setSortBy(sortOption);
    setShowFilter(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearch("");
  }, []);

  const getTotalUnreadCount = useMemo(() => {
    return chatData.reduce((total, chat) => total + chat.unread, 0);
  }, [chatData]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="chat-outline" size={64} color={COLORS.TEXT_LIGHT} />
      <Text style={styles.emptyStateTitle}>No messages yet</Text>
      <Text style={styles.emptyStateText}>
        When pet owners reach out, their messages will appear here
      </Text>
    </View>
  ), []);

  const renderHeader = useCallback(() => (
    <>
      {/* Hero Card */}
      <LinearGradient
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]}
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>Pet Consultation Chats</Text>
          <Text style={styles.heroDesc}>
            Respond to pet owners and help them with expert medical advice
          </Text>
          {getTotalUnreadCount > 0 && (
            <View style={styles.unreadSummary}>
              <Text style={styles.unreadSummaryText}>
                {getTotalUnreadCount} unread message{getTotalUnreadCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        <MaterialCommunityIcons
          name="chat-processing"
          size={65}
          color="rgba(255,255,255,0.15)"
        />
      </LinearGradient>

      {/* Search and Filter Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={COLORS.TEXT_LIGHT} />
          <TextInput
            placeholder="Search owners or dogs..."
            placeholderTextColor={COLORS.TEXT_LIGHT}
            value={search}
            onChangeText={setSearch}
            style={styles.input}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={18} color={COLORS.TEXT_LIGHT} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity 
          style={styles.filterBtn} 
          onPress={() => setShowFilter(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="options-outline" size={20} color={COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* Sort Indicator */}
      {sortBy !== SORT_OPTIONS.RECENT && (
        <View style={styles.sortIndicator}>
          <Text style={styles.sortIndicatorText}>
            Sorted by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
          </Text>
          <TouchableOpacity onPress={() => setSortBy(SORT_OPTIONS.RECENT)}>
            <Text style={styles.sortResetText}>Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  ), [search, getTotalUnreadCount, sortBy, handleClearSearch]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>Chat Support</Text>
        </View>

        <TouchableOpacity 
          style={styles.iconBtn}
          onPress={() => navigation.navigate("Notifications")}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={20} color="#fff" />
          {getTotalUnreadCount > 0 && <View style={styles.notificationBadge} />}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      ) : (
        <FlatList
          data={filteredAndSortedChats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatItem item={item} onPress={handleChatPress} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={5}
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={handleFilterApply}
        currentSort={sortBy}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
    paddingHorizontal: 18,
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },

  subtitle: {
    fontSize: 12,
    color: COLORS.TEXT_LIGHT,
    marginTop: 2,
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.WARNING,
  },

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  heroCard: {
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },

  heroContent: {
    flex: 1,
    paddingRight: 10,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
  },

  heroDesc: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 20,
  },

  unreadSummary: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },

  unreadSummaryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  searchSection: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: COLORS.TEXT_PRIMARY,
    fontSize: 14,
  },

  filterBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  sortIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },

  sortIndicatorText: {
    fontSize: 11,
    color: COLORS.PRIMARY,
    fontWeight: "500",
  },

  sortResetText: {
    fontSize: 11,
    color: COLORS.SECONDARY,
    fontWeight: "600",
  },

  listContent: {
    paddingBottom: 30,
  },

  card: {
    flexDirection: "row",
    backgroundColor: COLORS.CARD,
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 62,
    height: 62,
    borderRadius: 20,
  },

  onlineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: "absolute",
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: COLORS.CARD,
  },

  content: {
    flex: 1,
    marginLeft: 14,
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  name: {
    fontWeight: "800",
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },

  onlineIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.ONLINE,
  },

  time: {
    fontSize: 10,
    color: COLORS.TEXT_LIGHT,
  },

  dogBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },

  dog: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "600",
  },

  message: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  badge: {
    backgroundColor: COLORS.PRIMARY,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },

  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  typingText: {
    color: COLORS.PRIMARY,
    fontSize: 12,
    fontWeight: "500",
  },

  typingDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.PRIMARY + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  typingDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.PRIMARY,
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
    lineHeight: 18,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContainer: {
    backgroundColor: COLORS.CARD,
    borderRadius: 24,
    padding: 20,
    width: "80%",
    maxWidth: 300,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },

  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BG,
  },

  filterOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  filterOptionText: {
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
});