import React, {
  useMemo,
  useState,
  useCallback,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  RefreshControl,
  Modal,
  Pressable,
} from "react-native";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import { LinearGradient } from "expo-linear-gradient";

import { SafeAreaView } from "react-native-safe-area-context";

import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

/* ================= COLORS ================= */

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD = "#FFFFFF";

/* ================= DATA ================= */

const reports = [
  {
    id: "1",
    date: "Today",
    time: "10:45 AM",
    disease: "Skin Allergy",
    status: "warning",
    confidence: 87,
    image:
      "https://images.unsplash.com/photo-1583337130417-3346a1be7dee",
  },

  {
    id: "2",
    date: "Today",
    time: "08:10 AM",
    disease: "Healthy Skin",
    status: "healthy",
    confidence: 92,
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006",
  },

  {
    id: "3",
    date: "Yesterday",
    time: "06:30 PM",
    disease: "Fungal Infection",
    status: "danger",
    confidence: 78,
    image:
      "https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8",
  },

  {
    id: "4",
    date: "Yesterday",
    time: "02:15 PM",
    disease: "Mild Rash",
    status: "warning",
    confidence: 81,
    image:
      "https://images.unsplash.com/photo-1558944351-c1f3e0f9c2a6",
  },
];

export default function DailyReportsScreen({
  navigation,
}) {
  const [search, setSearch] =
    useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [filterVisible, setFilterVisible] =
    useState(false);

  const [selectedFilter, setSelectedFilter] =
    useState("all");

  const tabBarHeight =
    useBottomTabBarHeight();

  /* ================= COLORS ================= */

  const getColor = (status) => {
    if (status === "healthy")
      return "#22C55E";

    if (status === "warning")
      return "#F59E0B";

    return "#EF4444";
  };

  /* ================= FILTERED REPORTS ================= */

  const filteredReports = useMemo(() => {
    let filtered = reports;

    // SEARCH

    filtered = filtered.filter((item) =>
      item.disease
        .toLowerCase()
        .includes(search.toLowerCase())
    );

    // FILTER

    if (selectedFilter !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.status === selectedFilter
      );
    }

    return filtered;
  }, [search, selectedFilter]);

  /* ================= GROUPED ================= */

  const grouped = useMemo(() => {
    return filteredReports.reduce(
      (acc, item) => {
        if (!acc[item.date])
          acc[item.date] = [];

        acc[item.date].push(item);

        return acc;
      },
      {}
    );
  }, [filteredReports]);

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    return {
      total: reports.length,

      healthy: reports.filter(
        (r) => r.status === "healthy"
      ).length,

      warning: reports.filter(
        (r) => r.status === "warning"
      ).length,

      danger: reports.filter(
        (r) => r.status === "danger"
      ).length,
    };
  }, []);

  /* ================= REFRESH ================= */

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        backgroundColor={BG}
        barStyle="dark-content"
      />

      {/* ================= HEADER ================= */}

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
            color={PRIMARY}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Daily Reports
          </Text>

          <Text style={styles.subHeader}>
            AI generated skin analysis
            history
          </Text>
        </View>

        <TouchableOpacity
          style={styles.notificationBtn}
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={PRIMARY}
          />
        </TouchableOpacity>
      </View>

      {/* ================= HERO ================= */}

      <LinearGradient
        colors={[PRIMARY, SECONDARY]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>
            Pet Health Reports
          </Text>

          <Text style={styles.heroDesc}>
            View AI generated pet skin
            disease predictions and
            treatment reports.
          </Text>
        </View>

        <MaterialCommunityIcons
          name="file-chart"
          size={74}
          color="rgba(255,255,255,0.18)"
        />
      </LinearGradient>

      {/* ================= STATS ================= */}

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.total}
          </Text>

          <Text style={styles.statLabel}>
            Reports
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.healthy}
          </Text>

          <Text style={styles.statLabel}>
            Healthy
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {stats.danger}
          </Text>

          <Text style={styles.statLabel}>
            Critical
          </Text>
        </View>
      </View>

      {/* ================= SEARCH ================= */}

      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={18}
          color="#777"
        />

        <TextInput
          placeholder="Search reports..."
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />

        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch("")}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color="#999"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ================= LIST ================= */}

      <FlatList
        data={Object.keys(grouped)}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom:
            tabBarHeight + 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={70}
              color="#D1D5DB"
            />

            <Text style={styles.emptyTitle}>
              No Reports Found
            </Text>

            <Text style={styles.emptyDesc}>
              No reports match your
              current filter.
            </Text>
          </View>
        }
        renderItem={({ item: date }) => (
          <View style={styles.group}>
            <Text style={styles.dateTitle}>
              {date}
            </Text>

            {grouped[date].map(
              (report) => (
                <TouchableOpacity
                  key={report.id}
                  activeOpacity={0.9}
                  style={styles.card}
                  onPress={() =>
                    navigation?.navigate?.(
                      "ReportDetails",
                      {
                        report,
                      }
                    )
                  }
                >
                  {/* STATUS BAR */}

                  <View
                    style={[
                      styles.statusBar,
                      {
                        backgroundColor:
                          getColor(
                            report.status
                          ),
                      },
                    ]}
                  />

                  {/* IMAGE */}

                  <Image
                    source={{
                      uri: report.image,
                    }}
                    style={styles.image}
                  />

                  {/* INFO */}

                  <View style={styles.info}>
                    <Text
                      style={
                        styles.disease
                      }
                    >
                      {report.disease}
                    </Text>

                    <Text
                      style={styles.time}
                    >
                      {report.time}
                    </Text>
                  </View>

                  {/* RIGHT */}

                  <View
                    style={styles.right}
                  >
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: `${getColor(
                            report.status
                          )}15`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              getColor(
                                report.status
                              ),
                          },
                        ]}
                      >
                        {report.status.toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.confidenceRing,
                        {
                          borderColor:
                            getColor(
                              report.status
                            ),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.confText,
                          {
                            color:
                              getColor(
                                report.status
                              ),
                          },
                        ]}
                      >
                        {
                          report.confidence
                        }
                        %
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      />

      {/* ================= FILTER MODAL ================= */}

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
            <Text style={styles.filterTitle}>
              Filter Reports
            </Text>

            {[
              "all",
              "healthy",
              "warning",
              "danger",
            ].map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterItem,
                  selectedFilter ===
                    item && {
                    backgroundColor:
                      PRIMARY + "15",
                  },
                ]}
                onPress={() => {
                  setSelectedFilter(item);
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
                      color: PRIMARY,
                    },
                  ]}
                >
                  {item.toUpperCase()}
                </Text>

                {selectedFilter ===
                  item && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={PRIMARY}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ================= FLOATING BUTTON ================= */}

      <TouchableOpacity
        style={[
          styles.floatingBtn,
          {
            bottom:
              tabBarHeight + 20,
          },
        ]}
        activeOpacity={0.9}
        onPress={() =>
          setFilterVisible(true)
        }
      >
        <LinearGradient
          colors={[PRIMARY, SECONDARY]}
          style={styles.floatingGradient}
        >
          <Ionicons
            name="options"
            size={22}
            color="#fff"
          />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 18,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 22,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,

    elevation: 4,
  },

  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",

    elevation: 4,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
  },

  subHeader: {
    fontSize: 13,
    color: "#777",
    marginTop: 4,
  },

  heroCard: {
    borderRadius: 30,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },

  heroDesc: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    lineHeight: 20,
    paddingRight: 10,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: CARD,
    paddingVertical: 18,
    borderRadius: 22,
    alignItems: "center",
    marginHorizontal: 4,

    elevation: 3,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: PRIMARY,
  },

  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#777",
    fontWeight: "600",
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,

    elevation: 4,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#111",
  },

  group: {
    marginBottom: 24,
  },

  dateTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 14,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    padding: 14,
    borderRadius: 26,
    marginBottom: 14,

    elevation: 4,
  },

  statusBar: {
    width: 5,
    alignSelf: "stretch",
    borderRadius: 10,
    marginRight: 12,
  },

  image: {
    width: 58,
    height: 58,
    borderRadius: 18,
    marginRight: 14,
  },

  info: {
    flex: 1,
  },

  disease: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111",
  },

  time: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },

  right: {
    alignItems: "flex-end",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },

  confidenceRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  confText: {
    fontSize: 11,
    fontWeight: "800",
  },

  emptyState: {
    alignItems: "center",
    marginTop: 100,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
    marginTop: 16,
  },

  emptyDesc: {
    fontSize: 13,
    color: "#777",
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },

  floatingBtn: {
    position: "absolute",
    right: 24,
    zIndex: 999,
  },

  floatingGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",

    elevation: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },

  filterModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },

  filterTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: PRIMARY,
    marginBottom: 20,
  },

  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 10,
  },

  filterText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
});