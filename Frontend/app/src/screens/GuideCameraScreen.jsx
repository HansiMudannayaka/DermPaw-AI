import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import {
    CameraView,
    useCameraPermissions,
} from "expo-camera";

import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

import { Ionicons } from "@expo/vector-icons";

import { ML_URL } from "../services/api";

const API_URL = ML_URL || "http://192.168.1.6:5000";

export default function CameraScreen({ navigation, route }) {
  const cameraRef = useRef(null);
  const lastCaptureTimeRef = useRef(0);

  const [permission, requestPermission] =
    useCameraPermissions();

  const [photo, setPhoto] = useState(null);
  const [base64Image, setBase64Image] = useState(null);

  const [showTips, setShowTips] = useState(true);
  const [lightingWarning, setLightingWarning] = useState(false);
  const [blurWarning, setBlurWarning] = useState(false);
  const [distanceState, setDistanceState] = useState("perfect");
  const [flashOn, setFlashOn] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ============================================================
  // DEMO CAMERA WARNINGS
  // ============================================================

  useEffect(() => {
    const interval = setInterval(() => {
      setLightingWarning(Math.random() < 0.3);
      setBlurWarning(Math.random() < 0.25);

      const d = Math.random();

      if (d < 0.3) {
        setDistanceState("too_close");
      } else if (d > 0.75) {
        setDistanceState("too_far");
      } else {
        setDistanceState("perfect");
      }
    }, 1500);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ============================================================
  // PERMISSION
  // ============================================================

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#8A2BE2"
        />

        <Text
          style={{
            color: "#ccc",
            marginTop: 12,
          }}
        >
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Ionicons
          name="camera-outline"
          size={50}
          color="#8A2BE2"
        />

        <Text style={styles.permissionTitle}>
          Camera Access Required
        </Text>

        <TouchableOpacity
          onPress={requestPermission}
          style={styles.primaryBtn}
        >
          <Text style={styles.btnText}>
            Allow Camera
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ============================================================
  // TAKE PICTURE
  // ============================================================

  const takePicture = async () => {
    const now = Date.now();

    if (
      now -
        lastCaptureTimeRef.current <
      1500
    ) {
      return;
    }

    lastCaptureTimeRef.current = now;

    if (!cameraRef.current) {
      return;
    }

    try {
      const data =
        await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: false,
        });

      if (!data?.uri) {
        throw new Error(
          "Camera did not return an image."
        );
      }

      setPhoto(data.uri);

      if (data.base64) {
        setBase64Image(
          `data:image/jpeg;base64,${data.base64}`
        );
      } else {
        setBase64Image(data.uri);
      }
    } catch (error) {
      console.error(
        "Camera capture error:",
        error
      );

      Alert.alert(
        "Camera Error",
        error?.message ||
          "Could not capture image."
      );
    }
  };

  // ============================================================
  // PICK FROM GALLERY
  // ============================================================

  const pickFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Needed",
          "Please allow access to your photo library to upload an image."
        );

        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          base64: true,
        });

      if (
        result.canceled ||
        !result.assets?.length
      ) {
        return;
      }

      const asset = result.assets[0];

      if (!asset.uri) {
        throw new Error(
          "Selected image URI is missing."
        );
      }

      setPhoto(asset.uri);

      if (asset.base64) {
        setBase64Image(
          `data:image/jpeg;base64,${asset.base64}`
        );
      } else {
        setBase64Image(asset.uri);
      }
    } catch (error) {
      console.error(
        "Gallery picker error:",
        error
      );

      Alert.alert(
        "Gallery Error",
        error?.message ||
          "Could not select image."
      );
    }
  };

  // ============================================================
  // RESET PHOTO
  // ============================================================

  const resetPhoto = () => {
    if (isAnalyzing) {
      return;
    }

    setPhoto(null);
    setBase64Image(null);
  };

  // ============================================================
  // ANALYZE PHOTO
  // ============================================================

  const analyzePhoto = async () => {
    if (!photo || isAnalyzing) {
      return;
    }

    setIsAnalyzing(true);

    try {
      console.log(
        "================================"
      );

      console.log(
        "AI SERVER:",
        API_URL
      );

      console.log(
        "HEALTH URL:",
        `${API_URL}/health`
      );

      console.log(
        "PREDICT URL:",
        `${API_URL}/predict`
      );

      console.log(
        "IMAGE URI:",
        photo
      );

      console.log(
        "================================"
      );

      // ------------------------------------------------------
      // 1. HEALTH CHECK
      // ------------------------------------------------------

      const health =
        await fetch(
          `${API_URL}/health`
        );

      console.log(
        "Health status:",
        health.status
      );

      if (!health.ok) {
        const healthText =
          await health.text();

        throw new Error(
          `Health check failed (${health.status}): ${healthText}`
        );
      }

      // ------------------------------------------------------
      // 2. CHECK LOCAL FILE
      // ------------------------------------------------------

      console.log(
        "Checking local image file..."
      );

      const fileInfo =
        await FileSystem.getInfoAsync(
          photo
        );

      console.log(
        "File exists:",
        fileInfo.exists
      );

      console.log(
        "File size:",
        fileInfo.size || "unknown"
      );

      if (!fileInfo.exists) {
        throw new Error(
          "Selected image file does not exist."
        );
      }

      // ------------------------------------------------------
      // 3. MIME TYPE
      // ------------------------------------------------------

      const lowerUri =
        photo.toLowerCase();

      let mimeType =
        "image/jpeg";

      if (
        lowerUri.endsWith(".png")
      ) {
        mimeType =
          "image/png";
      } else if (
        lowerUri.endsWith(".webp")
      ) {
        mimeType =
          "image/webp";
      }

      console.log(
        "Upload MIME:",
        mimeType
      );

      // ------------------------------------------------------
      // 4. DIRECT MULTIPART UPLOAD
      // ------------------------------------------------------

      console.log(
        "Starting multipart upload..."
      );

      const uploadResult =
        await FileSystem.uploadAsync(
          `${API_URL}/predict`,
          photo,
          {
            httpMethod: "POST",
            uploadType:
              FileSystem
                .FileSystemUploadType
                .MULTIPART,
            fieldName: "image",
            mimeType,
          }
        );

      console.log(
        "Prediction HTTP status:",
        uploadResult.status
      );

      console.log(
        "Prediction response length:",
        uploadResult.body?.length || 0
      );

      // ------------------------------------------------------
      // 5. PARSE JSON SAFELY
      // ------------------------------------------------------

      let result = {};

      try {
        result =
          uploadResult.body
            ? JSON.parse(
                uploadResult.body
              )
            : {};
      } catch (parseError) {
        console.warn(
          "Invalid response JSON:",
          uploadResult.body
        );

        throw new Error(
          "The AI server returned an unexpected response. Please try again."
        );
      }

      if (
        uploadResult.status < 200 ||
        uploadResult.status >= 300
      ) {
        console.warn(
          "Prediction status error:",
          uploadResult.status,
          result?.message || uploadResult.body
        );

        if (result?.status !== "rejected") {
          throw new Error(
            result?.message ||
              "Could not complete AI analysis. Please check your connection and try again."
          );
        }
      }

      console.log(
        "Prediction status:",
        result?.status
      );

      console.log(
        "Prediction stage:",
        result?.stage || "none"
      );

      console.log(
        "Prediction disease:",
        result?.disease || "none"
      );

      console.log(
        "Prediction confidence:",
        result?.confidence ?? "none"
      );

      // ------------------------------------------------------
      // REJECTED
      // ------------------------------------------------------

      if (
        result.status ===
        "rejected"
      ) {
        const title =
          result.title ||
          "Photo Needs Improvement";

        const message =
          result.message ||
          "The photo could not be verified as a clear dog skin image.";

        const instructions =
          Array.isArray(
            result.instructions
          ) &&
          result.instructions.length > 0
            ? result.instructions
            : result.tip
              ? [result.tip]
              : [];

        let alertBody =
          message;

        if (
          instructions.length > 0
        ) {
          alertBody +=
            "\n\nSuggestions to fix:\n" +
            instructions
              .map(
                (
                  item
                ) =>
                  `• ${item}`
              )
              .join(
                "\n"
              );
        }

        Alert.alert(
          `⚠️ ${title}`,
          alertBody,
          [
            {
              text: "Retake",
              onPress: resetPhoto,
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // RETAKE
      // ------------------------------------------------------

      if (
        result.status ===
        "retake"
      ) {
        const message =
          `${result.message || "Please retake the photo."}${
            result.tip
              ? `\n\n${result.tip}`
              : ""
          }`;

        Alert.alert(
          "Please Retake",
          message,
          [
            {
              text: "Retake",
              onPress: resetPhoto,
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // UNKNOWN / OOD
      // ------------------------------------------------------

      if (
        result.status ===
        "unknown"
      ) {
        Alert.alert(
          "Unknown Condition",
          result.message ||
            "The AI could not recognize this condition.",
          [
            {
              text: "OK",
              onPress: resetPhoto,
            },
          ]
        );

        return;
      }

      // ------------------------------------------------------
      // SERVER RETURNED ERROR JSON
      // ------------------------------------------------------

      if (
        result.status ===
        "error"
      ) {
        throw new Error(
          result.message ||
            "AI analysis failed."
        );
      }

      // ------------------------------------------------------
      // VALID PREDICTION
      // ------------------------------------------------------

      if (
        result.status !==
        "predicted"
      ) {
        throw new Error(
          `Unexpected AI response: ${
            result.status ||
            "unknown"
          }`
        );
      }

      // ------------------------------------------------------
      // NAVIGATE TO RESULTS
      // ------------------------------------------------------

      navigation?.navigate(
        "Results",
        {
          photo,
          base64Image:
            base64Image || photo,
          result,
          petId:
            route?.params?.petId,
          petName:
            route?.params?.petName,
        }
      );
    } catch (error) {
      console.warn(
        "========== AI ANALYSIS ERROR =========="
      );

      console.warn(
        "Message:",
        error?.message
      );

      console.warn(
        "API URL:",
        API_URL
      );

      console.warn(
        "======================================="
      );

      Alert.alert(
        "Analysis Error",
        error?.message ||
          "Cannot complete AI analysis."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ============================================================
  // PHOTO PREVIEW
  // ============================================================

  if (photo) {
    return (
      <View style={styles.previewContainer}>
        <Image
          source={{
            uri: photo,
          }}
          style={styles.previewImage}
        />

        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            🐶 Scan Ready
          </Text>

          <Text style={styles.resultSubtitle}>
            Dog skin image captured successfully
          </Text>

          <View style={styles.statusRow}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color="#69F0AE"
            />

            <Text style={styles.statusText}>
              AI Ready for Analysis
            </Text>
          </View>

          <View style={styles.actionCard}>
            <TouchableOpacity
              onPress={resetPhoto}
              style={styles.actionSecondary}
              activeOpacity={0.8}
              disabled={isAnalyzing}
            >
              <Ionicons
                name="camera-reverse"
                size={18}
                color="white"
              />

              <Text style={styles.actionText}>
                Retake
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionPrimary,
                isAnalyzing && {
                  opacity: 0.7,
                },
              ]}
              onPress={analyzePhoto}
              activeOpacity={0.85}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <ActivityIndicator
                    color="white"
                    size="small"
                  />

                  <Text style={styles.actionTextBold}>
                    Analyzing...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="sparkles"
                    size={18}
                    color="white"
                  />

                  <Text style={styles.actionTextBold}>
                    Analyze
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {isAnalyzing && (
            <Text style={styles.analyzingHint}>
              🧠 AI is analyzing your dog's skin...
            </Text>
          )}
        </View>
      </View>
    );
  }

  // ============================================================
  // CAMERA UI
  // ============================================================

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        enableTorch={flashOn}
      />

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() =>
          navigation?.goBack()
        }
      >
        <Ionicons
          name="arrow-back"
          size={24}
          color="white"
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.flashBtn}
        onPress={() =>
          setFlashOn(
            (previous) =>
              !previous
          )
        }
      >
        <Ionicons
          name={
            flashOn
              ? "flash"
              : "flash-off"
          }
          size={22}
          color="white"
        />
      </TouchableOpacity>

      <View style={styles.topTag}>
        <Ionicons
          name="paw"
          size={16}
          color="white"
        />

        <Text style={styles.topTagText}>
          DOG SKIN AI SCANNER
        </Text>
      </View>

      {showTips && (
        <View style={styles.tipsBox}>
          <Text style={styles.tipTitle}>
            🐶 Dog Scan Guide
          </Text>

          <Text style={styles.tipText}>
            ✔ Only for dog skin analysis
          </Text>

          <Text style={styles.tipText}>
            ✔ Keep good lighting
          </Text>

          <Text style={styles.tipText}>
            ✔ Maintain 30–60cm distance
          </Text>

          <Text style={styles.tipText}>
            ✔ Keep dog steady
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() =>
              setShowTips(false)
            }
          >
            <Text style={styles.btnText}>
              Start Scan
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!showTips && (
        <View style={styles.overlay}>
          <View style={styles.scanBox} />

          <Text style={styles.hint}>
            Align dog skin inside frame
          </Text>
        </View>
      )}

      {!showTips &&
        lightingWarning && (
          <View style={styles.warning}>
            <Ionicons
              name="sunny"
              size={18}
              color="#FFD54F"
            />

            <Text style={styles.warningText}>
              Low Light Detected
            </Text>
          </View>
        )}

      {!showTips &&
        blurWarning && (
          <View style={styles.warningRed}>
            <Ionicons
              name="warning"
              size={18}
              color="#FF5252"
            />

            <Text style={styles.warningText}>
              Image blur detected
            </Text>
          </View>
        )}

      {!showTips && (
        <View style={styles.distanceBox}>
          {distanceState ===
            "too_close" && (
            <Text style={styles.distRed}>
              📏 Move BACK
            </Text>
          )}

          {distanceState ===
            "too_far" && (
            <Text style={styles.distBlue}>
              📏 Move CLOSER
            </Text>
          )}

          {distanceState ===
            "perfect" && (
            <Text style={styles.distGreen}>
              📏 Perfect distance ✔
            </Text>
          )}

          <Text style={styles.distHint}>
            Recommended: 30–60cm
          </Text>
        </View>
      )}

      {!showTips && (
        <View style={styles.bottom}>
          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={pickFromGallery}
            >
              <Ionicons
                name="images"
                size={26}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.capture}
              onPress={takePicture}
            />

            <View
              style={
                styles.galleryBtnSpacer
              }
            />
          </View>

          <Text style={styles.galleryHint}>
            Or upload from gallery
          </Text>
        </View>
      )}
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  camera: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0D0D1A",
  },

  permissionTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#4B0082",
    padding: 10,
    borderRadius: 30,
  },

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
    backgroundColor: "rgba(20,10,40,0.95)",
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(138,43,226,0.6)",
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
    paddingHorizontal: 25,
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

  hint: {
    color: "white",
    marginTop: 15,
  },

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

  warningText: {
    color: "white",
    marginLeft: 8,
  },

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

  distRed: {
    color: "#FF5252",
    fontWeight: "bold",
  },

  distBlue: {
    color: "#4FC3F7",
    fontWeight: "bold",
  },

  distGreen: {
    color: "#69F0AE",
    fontWeight: "bold",
  },

  distHint: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 5,
  },

  bottom: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },

  capture: {
    width: 78,
    height: 78,
    borderRadius: 40,
    backgroundColor: "white",
    borderWidth: 5,
    borderColor: "#8A2BE2",
  },

  galleryBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(75,0,130,0.85)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 40,
  },

  galleryBtnSpacer: {
    width: 50,
    marginLeft: 40,
  },

  galleryHint: {
    color: "#ccc",
    fontSize: 11,
    marginTop: 10,
    textAlign: "center",
  },

  previewContainer: {
    flex: 1,
    backgroundColor: "#000",
  },

  previewImage: {
    width: "100%",
    height: "70%",
  },

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

  resultSubtitle: {
    color: "#ccc",
    marginTop: 5,
  },

  statusRow: {
    flexDirection: "row",
    marginTop: 10,
    alignItems: "center",
  },

  statusText: {
    color: "#69F0AE",
    marginLeft: 8,
  },

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

  actionText: {
    color: "white",
    marginLeft: 6,
  },

  actionTextBold: {
    color: "white",
    marginLeft: 6,
    fontWeight: "bold",
  },

  analyzingHint: {
    color: "#ccc",
    textAlign: "center",
    marginTop: 10,
    fontSize: 12,
  },
});
