import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const login = async () => {
    try {
      // ✅ VALIDATION
      if (!email.trim() || !password.trim()) {
        Alert.alert("Error", "Please fill all fields");
        return;
      }

      if (!validateEmail(email.trim())) {
        Alert.alert("Invalid Email", "Enter valid email");
        return;
      }

      if (password.trim().length < 6) {
        Alert.alert("Weak Password", "Min 6 characters required");
        return;
      }

      setLoading(true);

      // ✅ API CALL (FIXED)
      const res = await fetch(
        "http://172.20.10.4:8000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password.trim(),
          }),
        }
      );

      const data = await res.json();

      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        return;
      }

      // ✅ SAVE TOKEN + USER
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));

      const role = data.user?.role;

      Alert.alert("Success", "Login Successful ✅");

      // ✅ ROLE NAVIGATION
      setTimeout(() => {
        if (role === "doctor") {
          navigation.replace("DoctorApp");
        } else if (role === "owner") {
          navigation.replace("MainApp");
        } else {
          Alert.alert("Access Denied", "Invalid role");
        }
      }, 100);

    } catch (error) {
      console.log("LOGIN ERROR:", error);
      Alert.alert("Error", "Server not reachable or wrong API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#3A0CA3", "#7209B7"]} style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons
          name="paw"
          size={isTablet ? 90 : 150}
          color="#fff"
        />

        <Text style={styles.appName}>DermPaw AI</Text>
        <Text style={styles.subtitle}>Welcome back</Text>
      </View>

      {/* CARD */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.cardContainer}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.desc}>Continue to your account</Text>

          {/* EMAIL */}
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </View>

          {/* PASSWORD */}
          <View style={styles.inputBox}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            onPress={login}
            disabled={loading}
            style={styles.buttonContainer}
          >
            <LinearGradient
              colors={["#710b9d", "#3A0070"]}
              style={styles.button}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>

                  <View style={styles.iconCircle}>
                    <Image
                      source={require("../../../assets/images/paw.png")}
                      style={styles.pawIcon}
                    />
                  </View>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* SIGNUP */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Don’t have an account?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={styles.loginLink}> Sign up</Text>
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flex: 0.6,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 90,
  },

  appName: {
    color: "#fff",
    fontSize: isTablet ? 34 : 26,
    fontWeight: "bold",
    marginTop: 10,
  },

  subtitle: {
    color: "#E5D4FF",
    marginTop: 5,
  },

  cardContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 25,
    width: "100%",
    maxWidth: 500,
    alignSelf: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3A0CA3",
  },

  desc: {
    color: "#777",
    marginBottom: 20,
  },

  inputBox: {
    backgroundColor: "#F4F4F4",
    borderRadius: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: "center",
  },

  input: {
    padding: 12,
    color: "#333",
  },

  buttonContainer: {
    marginTop: 10,
    width: "100%",
    height: 65,
    borderRadius: 40,
    overflow: "hidden",
    elevation: 6,
  },

  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  buttonText: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  pawIcon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#777",
    fontSize: 16,
  },

  loginLink: {
    color: "#6A11CB",
    fontWeight: "bold",
    fontSize: 16,
  },
});