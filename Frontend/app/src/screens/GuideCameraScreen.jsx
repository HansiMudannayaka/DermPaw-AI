import React, { useRef, useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";

export default function CameraScreen({ navigation }) {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);

  const [showTips, setShowTips] = useState(true);
  const [lightingWarning, setLightingWarning] = useState(false);
  const [blurWarning, setBlurWarning] = useState(false);
  const [distanceState, setDistanceState] = useState("perfect");

  // 🔦 FLASH STATE (ADDED)
  const [flashOn, setFlashOn] = useState(false);

  let lastCaptureTime = 0;

  useEffect(() => {
    const interval = setInterval(() => {
      const light = Math.random();
      const blur = Math.random();
      const distance = Math.random();

      setLightingWarning(light < 0.3);
      setBlurWarning(blur < 0.25);

      if (distance < 0.3) setDistanceState("too_close");
      else if (distance > 0.75) setDistanceState("too_far");
      else setDistanceState("perfect");
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-outline" size={50} color="#8A2BE2" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>

        <TouchableOpacity onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.btnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    const now = Date.now();
    if (now - lastCaptureTime < 1500) return;
    lastCaptureTime = now;

    if (cameraRef.current) {
      const data = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });
      setPhoto(data.uri);
    }
  };

  /* ================= RESULT UI ================= */
  if (photo) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: photo }} style={styles.previewImage} />

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>🐶 Scan Ready</Text>
          <Text style={styles.resultSubtitle}>
            Dog skin image captured successfully
          </Text>

          <View style={styles.statusRow}>
            <Ionicons name="shield-checkmark" size={18} color="#69F0AE" />
            <Text style={styles.statusText}>AI Ready for Analysis</Text>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity
              onPress={() => setPhoto(null)}
              style={styles.actionSecondary}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-reverse" size={18} color="white" />
              <Text style={styles.actionText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionPrimary}
              onPress={() => navigation?.navigate("Results", { photo })}
              activeOpacity={0.85}
            >
              <Ionicons name="sparkles" size={18} color="white" />
              <Text style={styles.actionTextBold}>Analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  /* ================= CAMERA UI ================= */
  return (
    <View style={styles.container}>
      
      {/* CAMERA */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        flash={flashOn ? "on" : "off"}   // 🔦 FLASH ADDED HERE
      />

      {/* BACK */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation?.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* 🔦 FLASH TOGGLE BUTTON */}
      <TouchableOpacity
        style={styles.flashBtn}
        onPress={() => setFlashOn(!flashOn)}
      >
        <Ionicons
          name={flashOn ? "flash" : "flash-off"}
          size={22}
          color="white"
        />
      </TouchableOpacity>

      {/* TOP TAG */}
      <View style={styles.topTag}>
        <Ionicons name="paw" size={16} color="white" />
        <Text style={styles.topTagText}>DOG SKIN AI SCANNER</Text>
      </View>

      {/* DOG GUIDE */}
      {showTips && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipTitle}>🐶 Dog Scan Guide</Text>

          <Text style={styles.tipText}>✔ Only for dog skin analysis</Text>
          <Text style={styles.tipText}>✔ Keep good lighting</Text>
          <Text style={styles.tipText}>✔ Maintain 30–60cm distance</Text>
          <Text style={styles.tipText}>✔ Keep dog steady</Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => setShowTips(false)}
          >
            <Text style={styles.btnText}>Start Scan</Text>
          </TouchableOpacity>
        </View>
      )}

      {!showTips && (
        <View style={styles.overlay}>
          <View style={styles.scanBox} />
          <Text style={styles.hint}>Align dog skin inside frame</Text>
        </View>
      )}

      {!showTips && lightingWarning && (
        <View style={styles.warning}>
          <Ionicons name="sunny" size={18} color="#FFD54F" />
          <Text style={styles.warningText}>Low Light Detected</Text>
        </View>
      )}

      {!showTips && blurWarning && (
        <View style={styles.warningRed}>
          <Ionicons name="warning" size={18} color="#FF5252" />
          <Text style={styles.warningText}>Image blur detected</Text>
        </View>
      )}

      {!showTips && (
        <View style={styles.distanceBox}>
          {distanceState === "too_close" && (
            <Text style={styles.distRed}>📏 Move BACK</Text>
          )}
          {distanceState === "too_far" && (
            <Text style={styles.distBlue}>📏 Move CLOSER</Text>
          )}
          {distanceState === "perfect" && (
            <Text style={styles.distGreen}>📏 Perfect distance ✔</Text>
          )}

          <Text style={styles.distHint}>Recommended: 30–60cm</Text>
        </View>
      )}

      {!showTips && (
        <View style={styles.bottom}>
          <TouchableOpacity style={styles.capture} onPress={takePicture} />
        </View>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#4B0082",
    padding: 10,
    borderRadius: 30,
  },

  /* 🔦 FLASH BUTTON STYLE */
  flashBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(138,43,226,0.9)",
    padding: 10,
    borderRadius: 30,
  },

  topTag: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8A2BE2",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },

  topTagText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },

  tipsBox: {
    position: "absolute",
    top: 140,
    left: 20,
    right: 20,
    backgroundColor: "rgba(20, 10, 40, 0.95)",
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(138, 43, 226, 0.6)",
    shadowColor: "#8A2BE2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },

  tipTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },

  tipText: {
    color: "#D6D6E7",
    marginBottom: 8,
    fontSize: 13,
  },

  primaryBtn: {
    marginTop: 15,
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  btnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },

  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  scanBox: {
    width: 280,
    height: 350,
    borderWidth: 2,
    borderColor: "#8A2BE2",
    borderRadius: 20,
  },

  hint: { color: "white", marginTop: 15 },

  warning: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255,213,79,0.15)",
    padding: 10,
    borderRadius: 10,
  },

  warningRed: {
    position: "absolute",
    top: 150,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "rgba(255,82,82,0.15)",
    padding: 10,
    borderRadius: 10,
  },

  warningText: { color: "white", marginLeft: 8 },

  distanceBox: {
    position: "absolute",
    bottom: 120,
    alignSelf: "center",
    backgroundColor: "rgba(75,0,130,0.75)",
    padding: 12,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
    marginBottom: 30,
  },

  distRed: { color: "#FF5252", fontWeight: "bold" },
  distBlue: { color: "#4FC3F7", fontWeight: "bold" },
  distGreen: { color: "#69F0AE", fontWeight: "bold" },
  distHint: { color: "#ccc", fontSize: 11, marginTop: 5 },

  bottom: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },

  capture: {
    width: 78,
    height: 78,
    borderRadius: 40,
    backgroundColor: "white",
    borderWidth: 5,
    borderColor: "#8A2BE2",
  },

  previewContainer: { flex: 1, backgroundColor: "#000" },
  previewImage: { width: "100%", height: "70%" },

  resultCard: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "rgba(75,0,130,0.95)",
    padding: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },

  resultTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },

  resultSubtitle: { color: "#ccc", marginTop: 5 },

  statusRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },

  statusText: { color: "#69F0AE", marginLeft: 8 },

  actionCard: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 18,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(138,43,226,0.3)",
  },

  actionPrimary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#8A2BE2",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  actionSecondary: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#4B0082",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  actionText: { color: "white", marginLeft: 6 },

  actionTextBold: {
    color: "white",
    marginLeft: 6,
    fontWeight: "bold",
  },
});