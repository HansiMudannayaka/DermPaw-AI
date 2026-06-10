import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { height } = Dimensions.get("window");
const PRIMARY = "#4B0082";

export default function ArticleDetailsScreen({ route, navigation }) {
  // ✅ SAFE ACCESS (prevents crash)
  const article = route?.params?.article;

  // ✅ Prevent undefined crash screen
  if (!article) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ fontSize: 16, color: "#555" }}>
          Article data not found
        </Text>

        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Go Back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HERO IMAGE */}
      <Image
        source={{
          uri: article?.image || "https://via.placeholder.com/500",
        }}
        style={styles.heroImage}
      />

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#111" />
      </TouchableOpacity>

      {/* CONTENT SHEET */}
      <View style={styles.sheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* CATEGORY */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {article?.category || "Article"}
            </Text>
          </View>

          {/* TITLE */}
          <Text style={styles.title}>{article?.title}</Text>

          {/* META */}
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#777" />
            <Text style={styles.metaText}>5 min read</Text>

            <Ionicons
              name="person-circle-outline"
              size={14}
              color="#777"
              style={{ marginLeft: 15 }}
            />
            <Text style={styles.metaText}>Vet AI Team</Text>
          </View>

          {/* DIVIDER */}
          <View style={styles.divider} />

          {/* OVERVIEW */}
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.text}>
            {article?.desc}

            {"\n\n"}
            Skin diseases in pets such as hot spots, fungal infections,
            allergies, and parasite infestations are very common.
            Early detection helps prevent severe complications.
          </Text>

          {/* SYMPTOMS */}
          <Text style={styles.sectionTitle}>Symptoms</Text>
          <Text style={styles.text}>
            • Redness and itching{"\n"}
            • Hair loss patches{"\n"}
            • Bad odor or discharge{"\n"}
            • Constant scratching or licking
          </Text>

          {/* TREATMENT */}
          <Text style={styles.sectionTitle}>Treatment</Text>
          <Text style={styles.text}>
            Treatment depends on diagnosis and may include medicated shampoos,
            antibiotics, antifungal creams, or allergy control plans.
          </Text>

          {/* AI BUTTON */}
          <TouchableOpacity style={styles.aiBtn}>
            <LinearGradient
              colors={["#8A2BE2", "#4B0082"]}
              style={styles.aiGradient}
            >
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={styles.aiText}>Explain this disease with AI</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  heroImage: {
    width: "100%",
    height: height * 0.42,
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  sheet: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -30,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  badgeText: {
    fontSize: 11,
    color: PRIMARY,
    fontWeight: "600",
  },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111",
    marginTop: 10,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  metaText: {
    fontSize: 12,
    color: "#777",
    marginLeft: 5,
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 15,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 15,
    color: "#222",
  },

  text: {
    fontSize: 13,
    color: "#555",
    lineHeight: 20,
    marginTop: 8,
  },

  aiBtn: {
    marginTop: 20,
  },

  aiGradient: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  aiText: {
    color: "#fff",
    fontWeight: "700",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  backHomeBtn: {
    marginTop: 15,
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});