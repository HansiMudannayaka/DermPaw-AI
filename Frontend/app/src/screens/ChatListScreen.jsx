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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BACKEND_URL } from "../services/api";

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
};

const FILTER_OPTIONS = {
  ALL: "all",
  READ: "read",
  UNREAD: "unread",
};

const DEFAULT_PET_IMAGE = require("../../../assets/images/dog.png");

/* ================= HELPER FUNCTIONS ================= */

const getId = (value) => {
  if (!value) return null;

  if (typeof value === "object") {
    return (
      value._id?.toString?.() ||
      value.id?.toString?.() ||
      null
    );
  }

  return value.toString();
};

const getValidDate = (value) => {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatTime = (value) => {
  const date = getValidDate(value);

  if (!date) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  const date = getValidDate(value);

  if (!date) return "";

  return date.toLocaleDateString();
};

const getImageSource = (partner, pet) => {
  const profileImage =
    partner?.profileImage ||
    partner?.image;

  const petImage = pet?.image;

  if (
    profileImage &&
    typeof profileImage === "string" &&
    profileImage.trim() !== ""
  ) {
    return {
      uri: profileImage,
    };
  }

  if (
    petImage &&
    typeof petImage === "string" &&
    petImage.startsWith("http")
  ) {
    return {
      uri: petImage,
    };
  }

  return DEFAULT_PET_IMAGE;
};

const getOwnerId = (conversation) => {
  return (
    getId(conversation?.partner) ||
    getId(conversation?.owner) ||
    getId(conversation?.user)
  );
};

const getConsultationId = (conversation) => {
  return (
    getId(conversation?.consultation) ||
    getId(conversation?.consultationId)
  );
};

const getOwnerName = (conversation) => {
  return (
    conversation?.partner?.name ||
    conversation?.partner?.username ||
    conversation?.owner?.name ||
    conversation?.owner?.username ||
    "Pet Owner"
  );
};

/* ================= CHAT ITEM ================= */

const ChatItem = React.memo(({ item, onPress }) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        item.unread > 0 && styles.unreadCard,
      ]}
      onPress={() => onPress(item)}
    >
      {/* Avatar */}

      <View style={styles.avatarContainer}>
        <Image
          source={item.avatar}
          style={styles.avatar}
        />

        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: item.online
                ? COLORS.ONLINE
                : COLORS.OFFLINE,
            },
          ]}
        />
      </View>

      {/* Content */}

      <View style={styles.content}>
        <View style={styles.rowBetween}>
          <View style={styles.nameContainer}>
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                item.unread > 0 &&
                  styles.unreadName,
              ]}
            >
              {item.owner}
            </Text>

            {item.online && (
              <View style={styles.onlineIndicator} />
            )}
          </View>

          <Text style={styles.time}>
            {item.time}
          </Text>
        </View>

        <View style={styles.dogBadge}>
          <MaterialCommunityIcons
            name="dog"
            size={12}
            color={COLORS.PRIMARY}
          />

          <Text
            numberOfLines={1}
            style={styles.dog}
          >
            {item.dog}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.message,
              item.unread > 0 &&
                styles.unreadMessage,
            ]}
          >
            {item.message}
          </Text>

          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {item.unread > 9
                  ? "9+"
                  : item.unread}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
});

/* ================= FILTER MODAL ================= */

const FilterModal = ({
  visible,
  onClose,
  onApply,
  currentFilter,
}) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Filter Chats
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={24}
              color={COLORS.TEXT_PRIMARY}
            />
          </TouchableOpacity>
        </View>

        {/* ALL */}

        <TouchableOpacity
          style={styles.filterOption}
          onPress={() =>
            onApply(FILTER_OPTIONS.ALL)
          }
          activeOpacity={0.7}
        >
          <View style={styles.filterOptionLeft}>
            <Ionicons
              name="chatbubbles-outline"
              size={20}
              color={COLORS.PRIMARY}
            />

            <Text style={styles.filterOptionText}>
              All
            </Text>
          </View>

          {currentFilter ===
            FILTER_OPTIONS.ALL && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.SUCCESS}
            />
          )}
        </TouchableOpacity>

        {/* READ */}

        <TouchableOpacity
          style={styles.filterOption}
          onPress={() =>
            onApply(FILTER_OPTIONS.READ)
          }
          activeOpacity={0.7}
        >
          <View style={styles.filterOptionLeft}>
            <Ionicons
              name="mail-open-outline"
              size={20}
              color={COLORS.PRIMARY}
            />

            <Text style={styles.filterOptionText}>
              Read
            </Text>
          </View>

          {currentFilter ===
            FILTER_OPTIONS.READ && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.SUCCESS}
            />
          )}
        </TouchableOpacity>

        {/* UNREAD */}

        <TouchableOpacity
          style={styles.filterOption}
          onPress={() =>
            onApply(FILTER_OPTIONS.UNREAD)
          }
          activeOpacity={0.7}
        >
          <View style={styles.filterOptionLeft}>
            <Ionicons
              name="mail-unread-outline"
              size={20}
              color={COLORS.PRIMARY}
            />

            <Text style={styles.filterOptionText}>
              Unread
            </Text>
          </View>

          {currentFilter ===
            FILTER_OPTIONS.UNREAD && (
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={COLORS.SUCCESS}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ================= MAIN COMPONENT ================= */

export default function ChatListScreen({
  navigation,
}) {
  const [search, setSearch] = useState("");
  const [chatData, setChatData] = useState([]);
  const [refreshing, setRefreshing] =
    useState(false);

  const [filterBy, setFilterBy] = useState(
    FILTER_OPTIONS.ALL
  );

  const [showFilter, setShowFilter] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  /* ================= FETCH REAL CHATS ================= */

  const fetchLatestChats = useCallback(
    async () => {
      setIsLoading(true);

      try {
        const token =
          await AsyncStorage.getItem("token");

        if (!token) {
          setChatData([]);
          return;
        }

        const response = await fetch(
          `${BACKEND_URL}/api/chat/conversations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        let data;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        if (
          !response.ok ||
          !data?.success ||
          !Array.isArray(data?.conversations)
        ) {
          setChatData([]);
          return;
        }

        /*
         * IMPORTANT:
         * Only real backend conversations are used.
         *
         * No consultation is converted into
         * a fake chat.
         *
         * No fake unread count.
         *
         * No fake online status.
         *
         * No fake typing status.
         */

        const realChats =
          data.conversations
            .map((conversation) => {
              const ownerId =
                getOwnerId(conversation);

              if (!ownerId) {
                return null;
              }

              const consultation =
                conversation?.consultation ||
                null;

              const consultationId =
                getConsultationId(
                  conversation
                );

              const partner =
                conversation?.partner ||
                {};

              const pet =
                consultation?.pet ||
                null;

              const petName =
                pet?.name ||
                consultation?.petName ||
                "";

              const lastMessage =
                conversation?.lastMessage ||
                null;

              const message =
                typeof lastMessage?.text ===
                "string"
                  ? lastMessage.text
                  : "Chat started";

              const messageDate =
                getValidDate(
                  lastMessage?.createdAt
                ) ||
                getValidDate(
                  conversation?.updatedAt
                ) ||
                getValidDate(
                  conversation?.createdAt
                );

              /*
               * UNREAD COUNT
               *
               * Comes ONLY from backend.
               */
              const backendUnread =
                Number(
                  conversation?.unreadCount
                );

              const unread =
                Number.isFinite(
                  backendUnread
                ) &&
                backendUnread > 0
                  ? backendUnread
                  : 0;

              /*
               * ONLINE STATUS
               *
               * Comes ONLY from backend.
               *
               * If backend does not provide
               * online status, it is false.
               */
              const online =
                partner?.online === true ||
                partner?.isOnline === true;

              return {
                id:
                  getId(conversation) ||
                  `${ownerId}_conversation`,

                ownerId,

                consultationId:
                  consultationId || null,

                owner:
                  getOwnerName(conversation),

                ownerName:
                  getOwnerName(conversation),

                pets: petName
                  ? [petName]
                  : [],

                dog:
                  petName || "Pet",

                message,

                time:
                  formatTime(messageDate),

                timestamp:
                  messageDate ||
                  new Date(0),

                unread,

                online,

                avatar:
                  getImageSource(
                    partner,
                    pet
                  ),

                lastSeen:
                  messageDate
                    ? formatDate(
                        messageDate
                      )
                    : "",

                phone:
                  partner?.phone ||
                  null,

                original:
                  conversation,
              };
            })
            .filter(Boolean)
            .sort(
              (a, b) =>
                b.timestamp.getTime() -
                a.timestamp.getTime()
            );

        setChatData(realChats);
      } catch (error) {
        

        setChatData([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /* ================= SCREEN FOCUS ================= */

  useFocusEffect(
    useCallback(() => {
      fetchLatestChats();
    }, [fetchLatestChats])
  );

  /* ================= REFRESH ================= */

  const onRefresh = useCallback(
    async () => {
      setRefreshing(true);

      try {
        await fetchLatestChats();
      } finally {
        setRefreshing(false);
      }
    },
    [fetchLatestChats]
  );

  /* ================= SEARCH + FILTER ================= */

  const filteredChats = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    const filtered = chatData.filter(
      (item) => {
        const owner = String(
          item.owner || ""
        ).toLowerCase();

        const dog = String(
          item.dog || ""
        ).toLowerCase();

        const message = String(
          item.message || ""
        ).toLowerCase();

        const matchesSearch =
          !searchText ||
          owner.includes(searchText) ||
          dog.includes(searchText) ||
          message.includes(searchText);

        if (!matchesSearch) {
          return false;
        }

        /* ALL */

        if (
          filterBy ===
          FILTER_OPTIONS.ALL
        ) {
          return true;
        }

        /* READ */

        if (
          filterBy ===
          FILTER_OPTIONS.READ
        ) {
          return item.unread === 0;
        }

        /* UNREAD */

        if (
          filterBy ===
          FILTER_OPTIONS.UNREAD
        ) {
          return item.unread > 0;
        }

        return true;
      }
    );

    /*
     * Always show latest real conversation first.
     */
    return [...filtered].sort(
      (a, b) =>
        b.timestamp.getTime() -
        a.timestamp.getTime()
    );
  }, [
    chatData,
    search,
    filterBy,
  ]);

  /* ================= OPEN CHAT ================= */

  const handleChatPress =
    useCallback(
      (chat) => {
        /*
         * Update local UI immediately.
         *
         * IMPORTANT:
         * This does NOT create fake backend
         * read status.
         */
        setChatData((previous) =>
          previous.map((item) =>
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
            user: chat,

            /*
             * REAL CONSULTATION ID
             */
            consultationId:
              chat.consultationId ||
              null,

            /*
             * REAL OWNER ID
             */
            ownerId:
              chat.ownerId ||
              null,

            fromScreen:
              "ChatList",
          }
        );
      },
      [navigation]
    );

  /* ================= FILTER ================= */

  const handleFilterApply =
    useCallback(
      (filterOption) => {
        setFilterBy(filterOption);
        setShowFilter(false);
      },
      []
    );

  /* ================= CLEAR SEARCH ================= */

  const handleClearSearch =
    useCallback(() => {
      setSearch("");
    }, []);

  /* ================= TOTAL UNREAD ================= */

  const totalUnreadCount = useMemo(() => {
    return chatData.reduce(
      (total, chat) =>
        total +
        (Number(chat.unread) || 0),
      0
    );
  }, [chatData]);

  /* ================= EMPTY STATE ================= */

  const renderEmptyState =
    useCallback(
      () => (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="chat-outline"
            size={64}
            color={COLORS.TEXT_LIGHT}
          />

          <Text
            style={styles.emptyStateTitle}
          >
            No messages yet
          </Text>

          <Text
            style={styles.emptyStateText}
          >
            When pet owners reach out, their messages will appear here
          </Text>
        </View>
      ),
      []
    );

  /* ================= HEADER ================= */

  const renderHeader =
    useCallback(
      () => (
        <View>
          {/* Hero Card */}

          <LinearGradient
            colors={[
              COLORS.PRIMARY,
              COLORS.SECONDARY,
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
            <View
              style={styles.heroContent}
            >
              <Text
                style={styles.heroTitle}
              >
                Pet Consultation Chats
              </Text>

              <Text
                style={styles.heroDesc}
              >
                Respond to pet owners and help them with expert medical advice
              </Text>

              {totalUnreadCount > 0 && (
                <View
                  style={
                    styles.unreadSummary
                  }
                >
                  <Text
                    style={
                      styles.unreadSummaryText
                    }
                  >
                    {totalUnreadCount} unread
                    message
                    {totalUnreadCount !== 1
                      ? "s"
                      : ""}
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

          {/* Search + Filter */}

          <View
            style={styles.searchSection}
          >
            <View
              style={styles.searchBox}
            >
              <Ionicons
                name="search"
                size={18}
                color={COLORS.TEXT_LIGHT}
              />

              <TextInput
                placeholder="Search owners or dogs..."
                placeholderTextColor={
                  COLORS.TEXT_LIGHT
                }
                value={search}
                onChangeText={setSearch}
                style={styles.input}
                returnKeyType="search"
              />

              {search.length > 0 && (
                <TouchableOpacity
                  onPress={
                    handleClearSearch
                  }
                  hitSlop={{
                    top: 10,
                    bottom: 10,
                    left: 10,
                    right: 10,
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={
                      COLORS.TEXT_LIGHT
                    }
                  />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() =>
                setShowFilter(true)
              }
              activeOpacity={0.7}
            >
              <Ionicons
                name="options-outline"
                size={20}
                color={COLORS.PRIMARY}
              />
            </TouchableOpacity>
          </View>

          {/* Filter Indicator */}

          {filterBy !==
            FILTER_OPTIONS.ALL && (
            <View
              style={styles.sortIndicator}
            >
              <Text
                style={
                  styles.sortIndicatorText
                }
              >
                Filtered by:{" "}
                {filterBy
                  .charAt(0)
                  .toUpperCase() +
                  filterBy.slice(1)}
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setFilterBy(
                    FILTER_OPTIONS.ALL
                  )
                }
              >
                <Text
                  style={
                    styles.sortResetText
                  }
                >
                  Reset
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ),
      [
        search,
        totalUnreadCount,
        filterBy,
        handleClearSearch,
      ]
    );

  /* ================= SCREEN ================= */

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.BG}
      />

      {/* Header */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={COLORS.TEXT_PRIMARY}
          />
        </TouchableOpacity>

        <View>
          <Text style={styles.title}>
            Messages
          </Text>

          <Text
            style={styles.subtitle}
          >
            Chat Support
          </Text>
        </View>
      </View>

      {/* Main Content */}

      {isLoading ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={COLORS.PRIMARY}
          />
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          keyExtractor={(item) =>
            item.id.toString()
          }
          renderItem={({ item }) => (
            <ChatItem
              item={item}
              onPress={
                handleChatPress
              }
            />
          )}
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.listContent
          }
          ListHeaderComponent={
            renderHeader
          }
          ListEmptyComponent={
            renderEmptyState
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={
                COLORS.PRIMARY
              }
              colors={[
                COLORS.PRIMARY,
              ]}
            />
          }
          initialNumToRender={8}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews
        />
      )}

      {/* Filter Modal */}

      <FilterModal
        visible={showFilter}
        onClose={() =>
          setShowFilter(false)
        }
        onApply={
          handleFilterApply
        }
        currentFilter={
          filterBy
        }
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

  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.CARD,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
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
    backgroundColor:
      "rgba(255,255,255,0.2)",
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
    shadowOffset: {
      width: 0,
      height: 1,
    },
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.PRIMARY,
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
    flex: 1,
    paddingRight: 8,
  },

  name: {
    fontWeight: "800",
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    flexShrink: 1,
  },

  unreadName: {
    fontWeight: "900",
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
    flexShrink: 1,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 22,
  },

  message: {
    color: COLORS.TEXT_SECONDARY,
    fontSize: 13,
    flex: 1,
    marginRight: 10,
  },

  unreadMessage: {
    color: COLORS.TEXT_PRIMARY,
    fontWeight: "600",
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
    backgroundColor:
      "rgba(0,0,0,0.5)",
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
    paddingVertical: 14,
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