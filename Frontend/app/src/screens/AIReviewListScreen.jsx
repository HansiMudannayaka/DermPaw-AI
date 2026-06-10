import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const TABS = ["All", "High", "Normal"];
const TAB_WIDTH = (width - 40) / 3;

/* =========================
   PRIORITY CONFIG
========================= */

const PRIORITY_CONFIG = {
  High: {
    bg: "#FEE2E2",
    text: "#DC2626",
    icon: "alert-circle",
  },

  Normal: {
    bg: "#E6F7EC",
    text: "#16A34A",
    icon: "checkmark-circle",
  },
};

/* =========================
   TIME AGO
========================= */

const getTimeAgo = (date) => {
  if (!date) return "Unknown";

  const seconds = Math.floor(
    (new Date() - date) / 1000
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60)
    return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24)
    return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  return `${days}d ago`;
};

/* =========================
   CUSTOM TABS
========================= */

const CustomTabs = ({
  tabs,
  activeTab,
  onTabPress,
  translateX,
}) => {
  return (
    <View style={styles.tabContainer}>
      <Animated.View
        style={[
          styles.indicator,
          {
            width: TAB_WIDTH,
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={["#4B0082", "#8A2BE2"]}
          style={styles.indicatorGradient}
        />
      </Animated.View>

      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={styles.tabButton}
          onPress={() => onTabPress(tab)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab &&
                styles.activeText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/* =========================
   REVIEW CARD
========================= */

const ReviewCard = React.memo(
  ({ item, onPress }) => {
    const priority =
      PRIORITY_CONFIG[item.priority];

    const scaleAnim = useRef(
      new Animated.Value(1)
    ).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
        }}
      >
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.9}
          onPress={() => onPress(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          {/* HEADER */}
          <View style={styles.cardHeader}>
            <View style={styles.left}>
              <Image
                source={item.image}
                style={styles.avatar}
              />

              <View style={styles.petInfo}>
                <Text style={styles.name}>
                  {item.name}
                </Text>

                <Text style={styles.breed}>
                  {item.breed}
                </Text>

                <View
                  style={
                    styles.conditionBadge
                  }
                >
                  <Ionicons
                    name="medical"
                    size={10}
                    color="#8A2BE2"
                  />

                  <Text
                    style={
                      styles.conditionText
                    }
                  >
                    Skin Condition
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.right}>
              <Text style={styles.time}>
                {getTimeAgo(
                  item.createdAt
                )}
              </Text>

              <View
                style={[
                  styles.priorityTag,
                  {
                    backgroundColor:
                      priority.bg,
                  },
                ]}
              >
                <Ionicons
                  name={priority.icon}
                  size={12}
                  color={priority.text}
                />

                <Text
                  style={[
                    styles.priorityText,
                    {
                      color:
                        priority.text,
                    },
                  ]}
                >
                  {item.priority}
                </Text>
              </View>
            </View>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* DETAILS */}
          <View
            style={
              styles.detailsContainer
            }
          >
            <View style={styles.detailRow}>
              <Ionicons
                name="alert-circle-outline"
                size={16}
                color="#666"
              />

              <Text style={styles.detail}>
                AI Detection:{" "}
                <Text style={styles.bold}>
                  {item.issue}
                </Text>
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Ionicons
                name="stats-chart"
                size={16}
                color="#666"
              />

              <Text style={styles.detail}>
                Confidence:{" "}
                <Text style={styles.bold}>
                  {item.confidence}
                </Text>
              </Text>
            </View>
          </View>

          {/* CONFIDENCE BAR */}
          <View
            style={
              styles.confidenceContainer
            }
          >
            <View
              style={styles.confidenceBar}
            >
              <View
                style={[
                  styles.confidenceFill,
                  {
                    width: item.confidence,
                    backgroundColor:
                      item.priority ===
                      "High"
                        ? "#DC2626"
                        : "#16A34A",
                  },
                ]}
              />
            </View>
          </View>

          {/* ALERT */}
          {item.alert ? (
            <View style={styles.alertRow}>
              <Ionicons
                name="warning"
                size={16}
                color="#DC2626"
              />

              <Text
                style={styles.alertText}
              >
                {item.alert}
              </Text>
            </View>
          ) : null}

          {/* FOOTER */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() =>
                onPress(item)
              }
            >
              <Text
                style={
                  styles.reviewBtnText
                }
              >
                Review Case
              </Text>

              <Ionicons
                name="arrow-forward"
                size={14}
                color="#4B0082"
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

/* =========================
   MAIN SCREEN
========================= */

export default function AIReviewScreen({
  navigation,
}) {
  const [activeTab, setActiveTab] =
    useState("All");

  const [refreshing, setRefreshing] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [reviewData, setReviewData] =
    useState([]);

  /* FILTER */
  const [filterVisible, setFilterVisible] =
    useState(false);

  const [selectedFilter, setSelectedFilter] =
    useState("Newest");

  const translateX = useRef(
    new Animated.Value(0)
  ).current;

  /* SAMPLE DATA */

  const sampleData = [
    {
      id: 1,
      name: "Luna",
      breed: "Golden Retriever • 2Y",
      issue: "Hot Spot",
      confidence: "92%",
      priority: "High",
      createdAt: new Date(
        Date.now() - 2 * 60 * 1000
      ),
      alert:
        "Immediate attention recommended",
      image: require("../../../assets/images/dog1.png"),
    },

    {
      id: 2,
      name: "Bella",
      breed: "Labrador • 3Y",
      issue: "Skin Infection",
      confidence: "88%",
      priority: "High",
      createdAt: new Date(
        Date.now() -
          15 * 60 * 1000
      ),
      alert:
        "Consultation recommended",
      image: require("../../../assets/images/dog.png"),
    },

    {
      id: 3,
      name: "Max",
      breed: "Beagle • 4Y",
      issue: "Mild Dermatitis",
      confidence: "75%",
      priority: "Normal",
      createdAt: new Date(
        Date.now() -
          2 * 60 * 60 * 1000
      ),
      alert: "",
      image: require("../../../assets/images/dog2.png"),
    },
  ];

  /* LOAD */

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData =
    useCallback(async () => {
      setIsLoading(true);

      await new Promise((resolve) =>
        setTimeout(resolve, 700)
      );

      setReviewData(sampleData);

      setIsLoading(false);
    }, []);

  /* REFRESH */

  const onRefresh = useCallback(
    async () => {
      setRefreshing(true);

      await loadReviewData();

      setRefreshing(false);
    },
    [loadReviewData]
  );

  /* FILTER DATA */

  const filteredData = useMemo(() => {
    let filtered =
      activeTab === "All"
        ? [...reviewData]
        : reviewData.filter(
            (item) =>
              item.priority ===
              activeTab
          );

    switch (selectedFilter) {
      case "Newest":
        filtered.sort(
          (a, b) =>
            b.createdAt -
            a.createdAt
        );
        break;

      case "Oldest":
        filtered.sort(
          (a, b) =>
            a.createdAt -
            b.createdAt
        );
        break;

      case "Highest Confidence":
        filtered.sort(
          (a, b) =>
            parseInt(
              b.confidence
            ) -
            parseInt(
              a.confidence
            )
        );
        break;

      case "Lowest Confidence":
        filtered.sort(
          (a, b) =>
            parseInt(
              a.confidence
            ) -
            parseInt(
              b.confidence
            )
        );
        break;

      default:
        break;
    }

    return filtered;
  }, [
    reviewData,
    activeTab,
    selectedFilter,
  ]);

  /* STATS */

  const getStats = useMemo(() => {
    const total = reviewData.length;

    const high =
      reviewData.filter(
        (i) =>
          i.priority === "High"
      ).length;

    const normal = total - high;

    return {
      total,
      high,
      normal,
    };
  }, [reviewData]);

  /* TAB ANIMATION */

  useEffect(() => {
    const index =
      TABS.indexOf(activeTab);

    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  /* REVIEW PRESS */

  const handleReviewPress =
    useCallback(
      (item) => {
        navigation.navigate(
          "AIResultDetail",
          { item }
        );
      },
      [navigation]
    );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#4B0082", "#8A2BE2"]}
        style={styles.headerGradient}
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
              size={22}
              color="#4B0082"
            />
          </TouchableOpacity>

          <View style={styles.titleWrapper}>
            <Text style={styles.greeting}>
              AI Review System
            </Text>

            <Text style={styles.username}>
              Review Requests
            </Text>
          </View>

          {/* FILTER BUTTON */}
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() =>
              setFilterVisible(true)
            }
          >
            <Ionicons
              name="options-outline"
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text
              style={styles.statNumber}
            >
              {getStats.total}
            </Text>

            <Text style={styles.statLabel}>
              Total
            </Text>
          </View>

          <View
            style={styles.statDivider}
          />

          <View style={styles.statItem}>
            <Text
              style={styles.statNumber}
            >
              {getStats.high}
            </Text>

            <Text style={styles.statLabel}>
              High
            </Text>
          </View>

          <View
            style={styles.statDivider}
          />

          <View style={styles.statItem}>
            <Text
              style={styles.statNumber}
            >
              {getStats.normal}
            </Text>

            <Text style={styles.statLabel}>
              Normal
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* TABS */}
      <CustomTabs
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={setActiveTab}
        translateX={translateX}
      />

      {/* CONTENT */}
      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4B0082"]}
          />
        }
      >
        {isLoading ? (
          <View
            style={
              styles.loadingContainer
            }
          >
            <ActivityIndicator
              size="large"
              color="#4B0082"
            />

            <Text
              style={styles.loadingText}
            >
              Loading...
            </Text>
          </View>
        ) : filteredData.length >
          0 ? (
          filteredData.map((item) => (
            <ReviewCard
              key={item.id}
              item={item}
              onPress={
                handleReviewPress
              }
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="checkmark-done-circle"
              size={70}
              color="#4B0082"
            />

            <Text
              style={
                styles.emptyStateTitle
              }
            >
              No Cases Found
            </Text>
          </View>
        )}

        <View
          style={styles.bottomPadding}
        />
      </ScrollView>

      {/* FILTER MODAL */}
      <Modal
        visible={filterVisible}
        transparent
        animationType="fade"
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setFilterVisible(false)
          }
        >
          <View style={styles.filterModal}>
            <Text
              style={styles.filterTitle}
            >
              Sort Cases
            </Text>

            {[
              "Newest",
              "Oldest",
              "Highest Confidence",
              "Lowest Confidence",
            ].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterOption,
                  selectedFilter ===
                    item && {
                    backgroundColor:
                      "#F3E8FF",
                  },
                ]}
                onPress={() => {
                  setSelectedFilter(
                    item
                  );

                  setFilterVisible(
                    false
                  );
                }}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter ===
                      item && {
                      color:
                        "#4B0082",
                      fontWeight:
                        "700",
                    },
                  ]}
                >
                  {item}
                </Text>

                {selectedFilter ===
                  item && (
                  <Ionicons
                    name="checkmark"
                    size={18}
                    color="#4B0082"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F5FA",
  },

  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 20,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  titleWrapper: {
    flex: 1,
    marginLeft: 12,
  },

  greeting: {
    fontSize: 12,
    color: "#E8D9FF",
  },

  username: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginTop: 2,
  },

  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  statsContainer: {
    flexDirection: "row",
    backgroundColor:
      "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 12,
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
  },

  statLabel: {
    fontSize: 11,
    color: "#E8D9FF",
  },

  statDivider: {
    width: 1,
    backgroundColor:
      "rgba(255,255,255,0.2)",
  },

  tabContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
  },

  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    zIndex: 1,
  },

  tabText: {
    color: "#777",
    fontWeight: "600",
  },

  activeText: {
    color: "#fff",
  },

  indicator: {
    position: "absolute",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },

  indicatorGradient: {
    flex: 1,
  },

  scrollContent: {
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
  },

  left: {
    flexDirection: "row",
    flex: 1,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  petInfo: {
    marginLeft: 12,
    flex: 1,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
  },

  breed: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  conditionBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  conditionText: {
    fontSize: 10,
    color: "#8A2BE2",
    marginLeft: 4,
  },

  right: {
    alignItems: "flex-end",
  },

  time: {
    fontSize: 11,
    color: "#999",
    marginBottom: 6,
  },

  priorityTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  priorityText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 12,
  },

  detailsContainer: {
    gap: 8,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  detail: {
    marginLeft: 8,
    fontSize: 13,
    color: "#555",
  },

  bold: {
    fontWeight: "700",
    color: "#111",
  },

  confidenceContainer: {
    marginTop: 12,
  },

  confidenceBar: {
    height: 4,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
  },

  confidenceFill: {
    height: "100%",
    borderRadius: 4,
  },

  alertRow: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
    alignItems: "center",
  },

  alertText: {
    marginLeft: 8,
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "600",
  },

  cardFooter: {
    alignItems: "flex-end",
    marginTop: 14,
  },

  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },

  reviewBtnText: {
    color: "#4B0082",
    fontWeight: "700",
    marginRight: 5,
    fontSize: 12,
  },

  loadingContainer: {
    paddingVertical: 80,
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B0082",
    marginTop: 12,
  },

  bottomPadding: {
    height: 50,
  },

  /* FILTER MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },

  filterModal: {
    width: 230,
    backgroundColor: "#fff",
    marginTop: 110,
    marginRight: 20,
    borderRadius: 18,
    padding: 15,
    elevation: 10,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4B0082",
    marginBottom: 10,
  },

  filterOption: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },

  filterText: {
    fontSize: 14,
    color: "#444",
  },
});