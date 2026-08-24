import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  StatusBar,
} from "react-native";
import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F6F1FF";
const CARD = "#FFFFFF";

const { width } = Dimensions.get("window");

const CARD_WIDTH = (width - 48) / 2;

/* ================= ARTICLES DATA ================= */

export default function ArticlesScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [articles, setArticles] = useState([]);

  // Fetch articles from backend
  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const res = await fetch("http://172.20.10.4:8000/api/articles");
        const data = await res.json();
        if (data.success) {
          setArticles(data.articles || []);
        }
      } catch (err) {
        console.log("Error fetching articles:", err);
      }
    };
    fetchArticles();
  }, []);

  /* ================= FILTER ================= */

  const filtered = articles.filter((item) =>
    (item.topic || item.title || "").toLowerCase().includes(search.toLowerCase())
  );

  /* ================= ARTICLE CARD ================= */

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={() =>
        navigation.navigate("ArticleDetailsScreen", {
          article: item,
        })
      }
    >
      {/* IMAGE */}

      <Image
        source={{ uri: item.image || "https://images.unsplash.com/photo-1543466835-00a7907e9de1" }}
        style={styles.image}
      />

      {/* OVERLAY */}

      <LinearGradient
        colors={[
          "transparent",
          "rgba(0,0,0,0.75)",
        ]}
        style={styles.overlay}
      />

      {/* CATEGORY */}

      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {item.category}
        </Text>
      </View>

      {/* BOOKMARK */}

      <TouchableOpacity style={styles.bookmark}>
        <Ionicons
          name="bookmark-outline"
          size={16}
          color="#fff"
        />
      </TouchableOpacity>

      {/* BOTTOM CONTENT */}

      <View style={styles.bottomContent}>
        <Text numberOfLines={2} style={styles.title}>
          {item.topic || item.title}
        </Text>

        <View style={styles.row}>
          <Text style={styles.readTime}>
            {item.readTime || "5 min read"}
          </Text>

          <Ionicons
            name="arrow-forward-circle"
            size={20}
            color="#fff"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={BG}
      />

      {/* ================= HEADER ================= */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={PRIMARY}
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            Pet Health Articles
          </Text>

          <Text style={styles.subTitle}>
            Learn pet diseases & treatments
          </Text>
        </View>

        <TouchableOpacity style={styles.notifyBtn}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={PRIMARY}
          />
        </TouchableOpacity>
      </View>

      {/* ================= HERO CARD ================= */}

      <LinearGradient
        colors={[PRIMARY, SECONDARY]}
        style={styles.heroCard}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>
            Learn About Pet Skin Diseases
          </Text>

          <Text style={styles.heroDesc}>
            Explore expert articles, treatments,
            prevention tips, and pet care advice.
          </Text>
        </View>

        <MaterialCommunityIcons
          name="dog"
          size={70}
          color="rgba(255,255,255,0.2)"
        />
      </LinearGradient>

      {/* ================= SEARCH ================= */}

      <View style={styles.searchBox}>
        <Ionicons
          name="search"
          size={18}
          color="#999"
        />

        <TextInput
          placeholder="Search articles..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          style={styles.input}
        />
      </View>

      {/* ================= ARTICLE COUNT ================= */}

      <Text style={styles.resultText}>
        {filtered.length} Articles Found
      </Text>

      {/* ================= GRID ================= */}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id || item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{
          justifyContent: "space-between",
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 30,
        }}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 50,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    marginRight: 12,
  },

  notifyBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: PRIMARY,
  },

  subTitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  heroCard: {
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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
    paddingRight: 10,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    elevation: 2,
    marginBottom: 12,
  },

  input: {
    flex: 1,
    marginLeft: 10,
    color: "#222",
  },

  resultText: {
    fontSize: 13,
    color: "#777",
    marginBottom: 14,
    fontWeight: "600",
  },

  card: {
    width: CARD_WIDTH,
    height: 240,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 16,
    backgroundColor: "#ddd",
  },

  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },

  overlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },

  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 30,
  },

  badgeText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: "700",
  },

  bookmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.25)",
    justifyContent: "center",
    alignItems: "center",
  },

  bottomContent: {
    position: "absolute",
    bottom: 14,
    left: 14,
    right: 14,
  },

  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },

  readTime: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
});