import React, { useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  ImageBackground,
  Dimensions,
  Text,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

/* ✅ 3 ONBOARDING SCREENS */
const DATA = [
  {
    id: "1",
    title: "Dog Skin Detection",
    desc: "AI detects dog skin diseases instantly.",
    image: require("../../../assets/images/dob5.png"),
  },
  {
    id: "2",
    title: "AI Smart Scan",
    desc: "Advanced AI scans skin condition.",
    image: require("../../../assets/images/dob3.png"),
  },
  {
    id: "3",
    title: "Medical Report",
    desc: "Get full health report with confidence score.",
    image: require("../../../assets/images/dob4.png"),
  },
];

export default function WelcomeScreen({ navigation }) {
  const [index, setIndex] = useState(0);
  const flatRef = useRef(null);

  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    navigation?.replace("SignIn");
  };

  const onScroll = (e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(i);
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.slide}>
        <ImageBackground
          source={require("../../../assets/images/bg2.png")}
          style={styles.background}
          resizeMode="cover"
        >

          {/* DOG IMAGE (FIXED - NO OVERFLOW) */}
          <Image
            source={item.image}
            style={styles.dogImage}
            resizeMode="contain"
          />

          {/* WAVE */}
          <Image
            source={require("../../../assets/images/Wave1.png")}
            style={styles.waveImage}
            resizeMode="cover"
          />

          {/* TEXT */}
          <View style={styles.textContainer}>
            <Text style={styles.smallTitle}>AI-POWERED PET CARE</Text>

            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.desc}>{item.desc}</Text>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* BACK BUTTON */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color="#710b9d" />
      </TouchableOpacity>

      {/* SKIP BUTTON */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => navigation.replace("MainApp")}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* SLIDER */}
      <FlatList
        ref={flatRef}
        data={DATA}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
      />

      {/* DOTS */}
      <View style={styles.dots}>
        {DATA.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, index === i && styles.activeDot]}
          />
        ))}
      </View>

      {/* BUTTON */}
      <TouchableWithoutFeedback
        onPressIn={onPressIn}
        onPressOut={onPressOut}
      >
        <Animated.View
          style={[styles.buttonContainer, { transform: [{ scale }] }]}
        >
          <LinearGradient
            colors={["#8A2BE2", "#4B0082"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>DermPaw AI</Text>

            <View style={styles.iconCircle}>
              <LottieView
                source={require("../../../assets/animations/paw.json")}
                autoPlay
                loop
                style={{ width: 50, height: 50 }}
              />
            </View>
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  /* ✅ FIXED SLIDE CONTAINER */
  slide: {
    width,
    height,
    overflow: "hidden", // 🔥 IMPORTANT FIX
  },

  background: {
    flex: 1,
    width,
    height,
    justifyContent: "flex-end",
    alignItems: "center",
  },

  /* ✅ FIXED DOG IMAGE (NO OVERLAP) */
 dogImage: {
    position: "absolute",
    top: -70,
    width: 430,
    height: 900,
    zIndex: 1,
    paddingLeft: 100,
  },

  waveImage: {
    position: "absolute",
    bottom: 0,
    width: width,
    height: height * 0.7,
    zIndex: 1,
  },

  textContainer: {
    position: "absolute",
    bottom: 150,
    paddingHorizontal: 20,
    alignItems: "center",
    zIndex: 3,
  },

  smallTitle: {
    fontSize: 12,
    letterSpacing: 2,
    color: "#999",
    marginBottom: 8,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#710b9d",
    marginBottom: 10,
    textAlign: "center",
  },

  desc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  /* DOTS */
  dots: {
    position: "absolute",
    bottom: 120,
    flexDirection: "row",
    alignSelf: "center",
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999",
    marginHorizontal: 4,
    opacity: 0.4,
  },

  activeDot: {
    width: 20,
    opacity: 1,
    backgroundColor: "#710b9d",
  },

  /* BACK */
  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },

  /* SKIP */
  skipBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#fff",
    elevation: 5,
  },

  skipText: {
    color: "#710b9d",
    fontWeight: "600",
    fontSize: 14,
  },

  /* BUTTON */
  buttonContainer: {
    position: "absolute",
    bottom: 30,
    width: width * 0.8,
    height: 65,
    alignSelf: "center",
    borderRadius: 40,
    elevation: 10,
    zIndex: 5,
  },

  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    borderRadius: 40,
  },

  buttonText: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
});