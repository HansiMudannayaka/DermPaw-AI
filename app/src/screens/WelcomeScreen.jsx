import React from "react";
import {
  View,
  Image,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  Text,
} from "react-native";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>

      <ImageBackground
        source={require("../../../assets/images/bg2.png")}
        style={styles.background}
        resizeMode="cover"
      >

        {/* DOG IMAGE */}
        <Image
          source={require("../../../assets/images/dob.png")}
          style={styles.dogImage}
          resizeMode="contain"
        />

        {/* WAVE IMAGE */}
        <Image
          source={require("../../../assets/images/Wave1.png")}
          style={styles.waveImage}
          resizeMode="stretch"
        />

        {/* TEXT SECTION */}
        <View style={styles.textContainer}>
          <Text style={styles.smallTitle}>AI-POWERED PET CARE</Text>

          <Text style={styles.title}>
            Healthy Skin,{"\n"}Happy Pet
          </Text>

          <Text style={styles.desc}>
            Professional dermatological checks are now at your fingertips.
            Our advanced AI helps you identify skin issues early.
          </Text>
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation?.replace("OnBoarding")}
          style={styles.buttonContainer}
        >
          <LinearGradient
            colors={["#710b9d", "#3A0070"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>DermPaw AI</Text>

            <View style={styles.iconCircle}>
              <LottieView
                source={require("../../../assets/animations/paw.json")}
                autoPlay
                loop
                style={{ width: 60, height: 60 }}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  background: {
    flex: 1,
    width,
    height,
    justifyContent: "flex-end",
    alignItems: "center",

  },

  /* DOG */
  dogImage: {
    position: "absolute",
    top: -70,
    width: 430,
    height: 850,
    zIndex: 1,
    paddingLeft: 100,
  },

  /* WAVE */
  waveImage: {
    position: "absolute",
    bottom: 0,
    width: width,
    height: height * 0.7,
    zIndex: 1,
   
  },

  /* TEXT */
  textContainer: {
    position: "absolute",
    bottom: 150,
    paddingHorizontal: 20,
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
  },

  desc: {
    fontSize: 14,
    color: "#666",
   
    lineHeight: 20,
  },

  /* BUTTON */
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    width: width * 0.80,
    height: 70,
    borderRadius: 40,
    overflow: "hidden",
    elevation: 6,
    zIndex: 4,
  },

  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 25,
    paddingRight: 10,
  },

  buttonText: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});