import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* =========================
     PASSWORD STRENGTH
  ========================= */

  const getStrength = () => {
    if (password.length > 8) return 3;
    if (password.length > 5) return 2;
    if (password.length > 0) return 1;
    return 0;
  };

  const strength = getStrength();

  /* =========================
     VALIDATION
  ========================= */

  const validateEmail = (email) => {
    const regex = /^\S+@\S+\.\S+$/;
    return regex.test(email);
  };

  const validatePassword = (password) => {
    // minimum 6 chars
    return password.length >= 6;
  };

  /* =========================
     REGISTER OWNER ONLY
  ========================= */

  const register = async () => {
    try {
      /* EMPTY CHECK */
      if (!username.trim() || !email.trim() || !password.trim()) {
        Alert.alert("Error", "Please fill all fields");
        return;
      }

      /* NAME VALIDATION */
      if (username.trim().length < 3) {
        Alert.alert(
          "Invalid Name",
          "Name must be at least 3 characters"
        );
        return;
      }

      /* EMAIL VALIDATION */
      if (!validateEmail(email.trim())) {
        Alert.alert(
          "Invalid Email",
          "Please enter a valid email address"
        );
        return;
      }

      /* PASSWORD VALIDATION */
      if (!validatePassword(password.trim())) {
        Alert.alert(
          "Weak Password",
          "Password must be at least 6 characters"
        );
        return;
      }

      setLoading(true);

      const res = await fetch(
        "http://192.168.1.6:8000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim(),
            password: password.trim(),
          }),
        }
      );

      const text = await res.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.log("Invalid JSON:", text);
        throw new Error("Server returned invalid response");
      }

      console.log("REGISTER RESPONSE:", data);

      /* BACKEND ERROR */
      if (!res.ok || data.success === false) {
        Alert.alert(
          "Registration Failed",
          data.message || "Something went wrong"
        );
        return;
      }

      /* SAVE TOKEN OPTIONAL */
      if (data.token) {
        await AsyncStorage.setItem("token", data.token);
      }

      Alert.alert(
        "Success",
        data.message || "Account created successfully"
      );

      navigation.replace("SignIn");

    } catch (error) {
      console.log("REGISTER ERROR:", error);

      Alert.alert(
        "Error",
        error.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#3A0CA3", "#7209B7"]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="paw" size={isTablet ? 90 : 150} color="#fff" />

        <Text style={styles.appName}>DermPaw AI</Text>

        <Text style={styles.subtitle}>
          Create your account
        </Text>
      </View>

      {/* CARD */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.cardContainer}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Get started free.</Text>

          <Text style={styles.desc}>
            Join to detect pet skin diseases
          </Text>

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

          {/* NAME */}
          <View style={styles.inputBox}>
            <TextInput
              placeholder="User Name"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
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

          {/* STRENGTH */}
          <View style={styles.strengthRow}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.bar,
                  {
                    backgroundColor:
                      strength >= i
                        ? "#4CAF50"
                        : "#E0E0E0",
                  },
                ]}
              />
            ))}

            <Text style={styles.strengthText}>
              {strength === 3
                ? "Strong"
                : strength === 2
                ? "Medium"
                : strength === 1
                ? "Weak"
                : ""}
            </Text>
          </View>

          {/* BUTTON */}
          <TouchableOpacity
            onPress={register}
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
                  <Text style={styles.buttonText}>
                    Sign Up
                  </Text>

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

          {/* LOGIN */}
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() => navigation.navigate("SignIn")}
            >
              <Text style={styles.loginLink}>
                {" "}
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* =========================
   STYLES
========================= */

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
    fontSize: isTablet ? 28 : 30,
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

  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  bar: {
    height: 5,
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 5,
  },

  strengthText: {
    marginLeft: 10,
    fontSize: 12,
    color: "#555",
  },

  buttonContainer: {
    marginTop: 10,
    width: "100%",
    height: 65,
    borderRadius: 40,
    overflow: "hidden",
  },

  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 20,
    paddingRight: 10,
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
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },

  loginText: {
    color: "#777",
  },

  loginLink: {
    color: "#6A11CB",
    fontWeight: "bold",
  },
});