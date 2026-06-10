import React from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Image,
} from "react-native";

import {
  Ionicons,
} from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

/* ================= THEME ================= */

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD = "#FFFFFF";

/* ================= TYPOGRAPHY ================= */

const TYPO = {
  h2: 22,
  h3: 16,
  body: 14,
  small: 12,
};

/* ================= DATA ================= */

const vetResponses = [
  {
    id: "1",
    doctor: "Dr. Anjali Perera",
    date: "Today",
    time: "10:30 AM",
    disease: "Hot Spot",
    severity: "Severe",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
  },

  {
    id: "2",
    doctor: "Dr. Ravi Kumar",
    date: "Yesterday",
    time: "6:10 PM",
    disease: "Hot Spot",
    severity: "Moderate",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d",
  },

  {
    id: "3",
    doctor: "Dr. Silva Fernando",
    date: "2 Days Ago",
    time: "3:45 PM",
    disease: "Skin Infection",
    severity: "Mild",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  },
];

export default function AdviceHistoryScreen({
  navigation,
}) {
  /* ================= SEVERITY COLORS ================= */

  const getSeverityColor = (
    severity
  ) => {
    switch (severity) {
      case "Severe":
        return "#E53935";

      case "Moderate":
        return "#FB8C00";

      default:
        return "#22C55E";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BG}
      />

      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        {/* BACK BUTTON */}

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

        {/* TITLE */}

        <Text style={styles.title}>
          Advice History
        </Text>

        {/* NOTIFICATION */}

        <TouchableOpacity
          style={styles.notificationBtn}
        >
          <Ionicons
            name="notifications-outline"
            size={20}
            color={PRIMARY}
          />
        </TouchableOpacity>
      </View>

      {/* ================= LIST ================= */}

      <FlatList
        data={vetResponses}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={{
          paddingBottom: 30,
          paddingTop: 10,
        }}
        renderItem={({ item }) => {
          const color =
            getSeverityColor(
              item.severity
            );

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.9}
              onPress={() =>
                navigation.navigate(
                  "VetAdvice",
                  {
                    doctor:
                      item.doctor,
                    disease:
                      item.disease,
                    severity:
                      item.severity,
                    date: item.date,
                    time: item.time,
                  }
                )
              }
            >
              {/* DOCTOR IMAGE */}

              <Image
                source={{
                  uri: item.image,
                }}
                style={styles.image}
              />

              {/* CONTENT */}

              <View
                style={styles.content}
              >
                <Text
                  style={
                    styles.doctor
                  }
                >
                  {item.doctor}
                </Text>

                <Text
                  style={
                    styles.disease
                  }
                >
                  {item.disease}
                </Text>

                <Text
                  style={
                    styles.meta
                  }
                >
                  {item.date} •{" "}
                  {item.time}
                </Text>

                {/* SEVERITY */}

                <View
                  style={
                    styles.severityRow
                  }
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.severityText,
                      {
                        color,
                      },
                    ]}
                  >
                    {item.severity} case
                  </Text>
                </View>
              </View>

              {/* ARROW */}

              <Ionicons
                name="chevron-forward"
                size={18}
                color="#AAA"
              />
            </TouchableOpacity>
          );
        }}
      />
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

  /* HEADER */

  header: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  notificationBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CARD,
    justifyContent: "center",
    alignItems: "center",

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  title: {
    fontSize: TYPO.h2,
    fontWeight: "800",
    color: PRIMARY,
  },

  /* CARD */

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    marginBottom: 14,
    padding: 14,
    borderRadius: 24,

    elevation: 4,

    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 5,
    },
  },

  image: {
    width: 58,
    height: 58,
    borderRadius: 18,
    marginRight: 14,
  },

  content: {
    flex: 1,
  },

  doctor: {
    fontSize: TYPO.h3,
    fontWeight: "800",
    color: "#111",
  },

  disease: {
    fontSize: TYPO.body,
    color: "#555",
    marginTop: 3,
  },

  meta: {
    fontSize: TYPO.small,
    color: "#888",
    marginTop: 4,
  },

  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  severityText: {
    fontSize: TYPO.small,
    fontWeight: "700",
  },
});