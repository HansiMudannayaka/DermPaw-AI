import { useRef, useState } from "react";



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



import { Ionicons } from "@expo/vector-icons";



import * as FileSystem from "expo-file-system/legacy";



import { ML_URL } from "../services/api";



const API_URL =

  ML_URL || "http://192.168.1.6:5000";



export default function CameraScreen({

  navigation,

  route,

}) {

  const cameraRef = useRef(null);



  const [permission, requestPermission] =

    useCameraPermissions();



  const [photo, setPhoto] =

    useState(null);



  const [isCapturing, setIsCapturing] =

    useState(false);



  const [isAnalyzing, setIsAnalyzing] =

    useState(false);



  const [torchOn, setTorchOn] =

    useState(false);



  // ============================================================

  // CAMERA PERMISSION LOADING

  // ============================================================



  if (!permission) {

    return (

      <View style={styles.center}>

        <ActivityIndicator

          size="large"

          color="#8A2BE2"

        />



        <Text style={styles.permissionText}>

          Checking camera permission...

        </Text>

      </View>

    );

  }



  // ============================================================

  // CAMERA PERMISSION DENIED

  // ============================================================



  if (!permission.granted) {

    return (

      <View style={styles.center}>

        <Ionicons

          name="camera-outline"

          size={60}

          color="#8A2BE2"

        />



        <Text style={styles.permissionTitle}>

          Camera Access Required

        </Text>



        <Text style={styles.permissionDescription}>

          DermPaw AI needs camera access to scan your dog's skin.

        </Text>



        <TouchableOpacity

          style={styles.allowBtn}

          onPress={requestPermission}

        >

          <Text style={styles.allowBtnText}>

            Allow Camera

          </Text>

        </TouchableOpacity>

      </View>

    );

  }



  // ============================================================

  // CAPTURE PHOTO

  // ============================================================



  const takePicture = async () => {

    if (

      !cameraRef.current ||

      isCapturing

    ) {

      return;

    }



    try {

      setIsCapturing(true);



      const result =

        await cameraRef.current.takePictureAsync({

          quality: 0.7,

          skipProcessing: false,

        });



      if (!result?.uri) {

        throw new Error(

          "Camera did not return an image."

        );

      }



      console.log(

        "Captured image URI:",

        result.uri

      );



      setPhoto(result.uri);

    } catch (error) {

      console.error(

        "Camera capture error:",

        error?.message

      );



      Alert.alert(

        "Camera Error",

        error?.message ||

          "Could not capture the photo."

      );

    } finally {

      setIsCapturing(false);

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

  };



  // ============================================================

  // ANALYZE PHOTO

  // ============================================================



  const analyzePhoto = async () => {

    if (

      !photo ||

      isAnalyzing

    ) {

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



      // ========================================================

      // 1. CHECK FLASK HEALTH

      // ========================================================



      const healthResponse =

        await fetch(

          `${API_URL}/health`

        );



      console.log(

        "Health status:",

        healthResponse.status

      );



      if (!healthResponse.ok) {

        const healthText =

          await healthResponse.text();



        throw new Error(

          `AI server health check failed. HTTP ${healthResponse.status}: ${healthText}`

        );

      }



      // ========================================================

      // 2. CHECK LOCAL FILE

      // ========================================================



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

        fileInfo.size ||

          "unknown"

      );



      if (!fileInfo.exists) {

        throw new Error(

          "Captured image file does not exist."

        );

      }



      // ========================================================

      // 3. DETERMINE MIME TYPE

      // ========================================================



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



      // ========================================================

      // 4. DIRECT MULTIPART UPLOAD

      // ========================================================



      console.log(

        "Starting multipart upload..."

      );



      const uploadResult =

        await FileSystem.uploadAsync(

          `${API_URL}/predict`,

          photo,

          {

            httpMethod:

              "POST",



            uploadType:

              FileSystem

                .FileSystemUploadType

                .MULTIPART,



            fieldName:

              "image",



            mimeType,

          }

        );



      console.log(

        "Prediction HTTP status:",

        uploadResult.status

      );



      console.log(

        "Prediction response length:",

        uploadResult.body?.length ||

          0

      );



      // ========================================================

      // 5. PARSE RESPONSE BEFORE HANDLING HTTP ERRORS

      let result;
      try {
        result = uploadResult.body ? JSON.parse(uploadResult.body) : {};
      } catch {
        throw new Error("AI server returned an invalid response. Please try again.");
      }

      // Flask returns 400 for missing or invalid images. Show its clear message.
      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        if (result?.status === "rejected") {
          Alert.alert(
            "",
            result.message || "Please choose another photo and try again.",
            [{ text: "Retake", onPress: resetPhoto }]
          );
          return;
        }
        throw new Error(
          result?.message || "The AI server could not analyze this photo. Please try again."
        );
      }

      // ========================================================
      // 7. SAFE LOGGING

      // ========================================================



      console.log(

        "AI status:",

        result?.status

      );



      console.log(

        "AI stage:",

        result?.stage ||

          "none"

      );



      console.log(

        "Disease:",

        result?.disease ||

          "none"

      );



      console.log(

        "Confidence:",

        result?.confidence ??

          "none"

      );



      // ========================================================

      // 8. IMAGE REJECTED

      // ========================================================



      if (result.status === "rejected") {
        const title =
          result.title ||
          "Photo Needs Improvement";

        const message =
          result.message ||
          "Please take another clear photo of your dog's skin.";

        const instructions = Array.isArray(result.instructions)
          ? result.instructions.filter((item) => typeof item === "string" && item.trim())
          : result.tip
            ? [result.tip]
            : [];

        let details = message;
        if (instructions.length > 0) {
          details +=
            "\n\nSuggestions to fix:\n" +
            instructions.map((item) => `• ${item}`).join("\n");
        }

        Alert.alert(
          `⚠️ ${title}`,
          details,
          [{ text: "Retake", onPress: resetPhoto }]
        );
        return;
      }

      // ========================================================
      // 9. RETAKE REQUIRED

      // ========================================================



      if (

        result.status ===

        "retake"

      ) {

        let message =

          result.message ||

          "Please capture another image.";



        if (result.tip) {

          message +=

            `\n\n${result.tip}`;

        }



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



      // ========================================================

      // 10. UNKNOWN / OOD

      // ========================================================



      if (

        result.status ===

        "unknown"

      ) {

        Alert.alert(

          "Unknown Condition",

          result.message ||

            "The AI could not confidently identify this condition.",

          [

            {

              text: "Retake",

              onPress: resetPhoto,

            },

            {

              text: "OK",

              style: "cancel",

            },

          ]

        );



        return;

      }



      // ========================================================

      // 11. SERVER ERROR JSON

      // ========================================================



      if (

        result.status ===

        "error"

      ) {

        throw new Error(

          result.message ||

            "AI prediction failed."

        );

      }



      // ========================================================

      // 12. SUCCESS STATUS CHECK

      // ========================================================



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



      // ========================================================

      // 13. NAVIGATE TO RESULTS

      // ========================================================



      console.log(

        "Prediction successful."

      );



      navigation?.navigate(

        "Results",

        {

          photo,

          result,



          petId:

            route?.params?.petId,



          petName:

            route?.params?.petName,

        }

      );

    } catch (error) {

      console.error(

        "========== AI ANALYSIS ERROR =========="

      );



      console.error(

        "Message:",

        error?.message

      );



      console.error(

        "API URL:",

        API_URL

      );



      console.error(

        "======================================="

      );



      Alert.alert(

        "Analysis Error",

        error?.message ||

          "Could not complete AI prediction."

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

        <View style={styles.previewHeader}>

          <TouchableOpacity

            style={styles.previewBackBtn}

            onPress={resetPhoto}

            disabled={isAnalyzing}

          >

            <Ionicons

              name="arrow-back"

              size={24}

              color="#fff"

            />

          </TouchableOpacity>



          <Text style={styles.previewTitle}>

            Review Photo

          </Text>



          <View

            style={{

              width: 44,

            }}

          />

        </View>



        <Image

          source={{

            uri: photo,

          }}

          style={styles.previewImage}

          resizeMode="contain"

        />



        <View style={styles.previewInfo}>

          <Ionicons

            name="information-circle-outline"

            size={20}

            color="#C4B5FD"

          />



          <Text style={styles.previewInfoText}>

            Make sure the affected skin area is clear,

            bright and in focus.

          </Text>

        </View>



        <View style={styles.previewActions}>

          <TouchableOpacity

            style={styles.retakeBtn}

            disabled={isAnalyzing}

            onPress={resetPhoto}

          >

            <Ionicons

              name="camera-reverse-outline"

              size={20}

              color="#fff"

            />



            <Text style={styles.buttonText}>

              Retake

            </Text>

          </TouchableOpacity>



          <TouchableOpacity

            style={[

              styles.analyzeBtn,

              isAnalyzing &&

                styles.disabledButton,

            ]}

            onPress={analyzePhoto}

            disabled={isAnalyzing}

          >

            {isAnalyzing ? (

              <>

                <ActivityIndicator

                  size="small"

                  color="#fff"

                />



                <Text style={styles.buttonText}>

                  Analyzing...

                </Text>

              </>

            ) : (

              <>

                <Ionicons

                  name="sparkles"

                  size={20}

                  color="#fff"

                />



                <Text style={styles.buttonText}>

                  Analyze

                </Text>

              </>

            )}

          </TouchableOpacity>

        </View>

      </View>

    );

  }



  // ============================================================

  // CAMERA VIEW

  // ============================================================



  return (

    <View style={styles.container}>

      <CameraView

        ref={cameraRef}

        style={styles.camera}

        facing="back"

        enableTorch={torchOn}

      />



      {/* TOP OVERLAY */}



      <View style={styles.topOverlay}>

        <Text style={styles.cameraTitle}>

          Skin Scanner

        </Text>



        <Text style={styles.cameraSubtitle}>

          Position the affected area inside the guide

        </Text>

      </View>



      {/* TORCH */}



      <TouchableOpacity

        style={[

          styles.flashBtn,

          torchOn &&

            styles.flashBtnActive,

        ]}

        onPress={() =>

          setTorchOn(

            (previous) =>

              !previous

          )

        }

      >

        <Ionicons

          name={

            torchOn

              ? "flash"

              : "flash-off"

          }

          size={24}

          color="#fff"

        />

      </TouchableOpacity>



      {/* SCAN GUIDE */}



      <View

        pointerEvents="none"

        style={styles.scanGuideContainer}

      >

        <View style={styles.scanGuide}>

          <View

            style={[

              styles.corner,

              styles.topLeft,

            ]}

          />



          <View

            style={[

              styles.corner,

              styles.topRight,

            ]}

          />



          <View

            style={[

              styles.corner,

              styles.bottomLeft,

            ]}

          />



          <View

            style={[

              styles.corner,

              styles.bottomRight,

            ]}

          />

        </View>



        <Text style={styles.guideText}>

          Keep the skin area clear and focused

        </Text>

      </View>



      {/* CAPTURE */}



      <View style={styles.bottomContainer}>

        <TouchableOpacity

          style={styles.captureOuter}

          onPress={takePicture}

          disabled={isCapturing}

          activeOpacity={0.8}

        >

          {isCapturing ? (

            <ActivityIndicator

              size="small"

              color="#8A2BE2"

            />

          ) : (

            <View

              style={styles.captureInner}

            />

          )}

        </TouchableOpacity>



        <Text style={styles.captureText}>

          Tap to capture

        </Text>

      </View>

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

    paddingHorizontal: 30,

  },



  permissionTitle: {

    color: "#fff",

    fontSize: 22,

    fontWeight: "800",

    marginTop: 18,

  },



  permissionDescription: {

    color: "#A1A1AA",

    fontSize: 14,

    textAlign: "center",

    lineHeight: 21,

    marginTop: 10,

  },



  permissionText: {

    color: "#aaa",

    marginTop: 10,

  },



  allowBtn: {

    backgroundColor: "#8A2BE2",

    paddingHorizontal: 30,

    paddingVertical: 14,

    borderRadius: 28,

    marginTop: 24,

  },



  allowBtnText: {

    color: "#fff",

    fontWeight: "700",

    fontSize: 15,

  },



  topOverlay: {

    position: "absolute",

    top: 60,

    left: 25,

    right: 80,

  },



  cameraTitle: {

    color: "#fff",

    fontSize: 24,

    fontWeight: "800",

  },



  cameraSubtitle: {

    color: "rgba(255,255,255,0.8)",

    fontSize: 13,

    lineHeight: 18,

    marginTop: 5,

  },



  flashBtn: {

    position: "absolute",

    top: 58,

    right: 20,

    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor:

      "rgba(0,0,0,0.45)",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 1,

    borderColor:

      "rgba(255,255,255,0.2)",

  },



  flashBtnActive: {

    backgroundColor:

      "rgba(138,43,226,0.85)",

  },



  scanGuideContainer: {

    position: "absolute",

    top: "27%",

    left: 30,

    right: 30,

    alignItems: "center",

  },



  scanGuide: {

    width: "100%",

    aspectRatio: 1,

    maxWidth: 320,

    position: "relative",

  },



  corner: {

    position: "absolute",

    width: 45,

    height: 45,

    borderColor: "#A855F7",

  },



  topLeft: {

    top: 0,

    left: 0,

    borderTopWidth: 4,

    borderLeftWidth: 4,

    borderTopLeftRadius: 16,

  },



  topRight: {

    top: 0,

    right: 0,

    borderTopWidth: 4,

    borderRightWidth: 4,

    borderTopRightRadius: 16,

  },



  bottomLeft: {

    bottom: 0,

    left: 0,

    borderBottomWidth: 4,

    borderLeftWidth: 4,

    borderBottomLeftRadius: 16,

  },



  bottomRight: {

    bottom: 0,

    right: 0,

    borderBottomWidth: 4,

    borderRightWidth: 4,

    borderBottomRightRadius: 16,

  },



  guideText: {

    color: "#fff",

    fontSize: 13,

    marginTop: 18,

    backgroundColor:

      "rgba(0,0,0,0.45)",

    paddingHorizontal: 16,

    paddingVertical: 8,

    borderRadius: 18,

  },



  bottomContainer: {

    position: "absolute",

    bottom: 45,

    width: "100%",

    alignItems: "center",

  },



  captureOuter: {

    width: 82,

    height: 82,

    borderRadius: 41,

    borderWidth: 5,

    borderColor: "#fff",

    justifyContent: "center",

    alignItems: "center",

    backgroundColor:

      "rgba(255,255,255,0.18)",

  },



  captureInner: {

    width: 64,

    height: 64,

    borderRadius: 32,

    backgroundColor: "#8A2BE2",

  },



  captureText: {

    color: "#fff",

    marginTop: 9,

    fontSize: 12,

    fontWeight: "600",

  },



  previewContainer: {

    flex: 1,

    backgroundColor: "#080808",

  },



  previewHeader: {

    paddingTop: 55,

    paddingHorizontal: 20,

    paddingBottom: 15,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    backgroundColor: "#111",

  },



  previewBackBtn: {

    width: 44,

    height: 44,

    borderRadius: 22,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor:

      "rgba(255,255,255,0.1)",

  },



  previewTitle: {

    color: "#fff",

    fontWeight: "800",

    fontSize: 18,

  },



  previewImage: {

    flex: 1,

    width: "100%",

  },



  previewInfo: {

    flexDirection: "row",

    alignItems: "center",

    marginHorizontal: 20,

    marginTop: 14,

    padding: 13,

    borderRadius: 14,

    backgroundColor:

      "rgba(139,92,246,0.15)",

  },



  previewInfoText: {

    flex: 1,

    color: "#D4D4D8",

    fontSize: 12,

    lineHeight: 18,

    marginLeft: 9,

  },



  previewActions: {

    flexDirection: "row",

    paddingHorizontal: 20,

    paddingTop: 16,

    paddingBottom: 35,

    gap: 12,

  },



  retakeBtn: {

    flex: 1,

    backgroundColor: "#3F3F46",

    paddingVertical: 15,

    borderRadius: 16,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 8,

  },



  analyzeBtn: {

    flex: 1,

    backgroundColor: "#8A2BE2",

    paddingVertical: 15,

    borderRadius: 16,

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 8,

  },



  disabledButton: {

    opacity: 0.65,

  },



  buttonText: {

    color: "#fff",

    fontWeight: "700",

    fontSize: 14,

  },

});