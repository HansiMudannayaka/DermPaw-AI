/* =========================================================
   DERMPAW AI AGENT CHAT
   Purple Doctor-Chat Style UI
========================================================= */

import React, { useState, useEffect, useRef } from "react";

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  initializeAgentSession,
  sendAgentMessage,
} from "../services/agentApi";

const { width, height } = Dimensions.get("window");

/* =========================================================
   COLORS
========================================================= */

const PRIMARY = "#3A0070";
const SECONDARY = "#6A1B9A";
const LIGHT_PURPLE = "#F1E7FA";
const SOFT_PURPLE = "#F7F2FB";
const BORDER_PURPLE = "#E2D2F0";

const BG = "#F4F5FA";
const WHITE = "#FFFFFF";

const TEXT_DARK = "#171717";
const TEXT_MUTED = "#777777";

const SUCCESS = "#16A34A";
const WARNING = "#F59E0B";
const DANGER = "#DC2626";

/* =========================================================
   QUICK ACTIONS (Suggested Question Shortcuts)
========================================================= */

const QUICK_ACTIONS = [
  {
    id: "what_does_result_mean",
    label: "What does my result mean?",
    icon: "help-circle-outline",
  },
  {
    id: "tell_about_condition",
    label: "About this condition",
    icon: "book-open-outline",
  },
  {
    id: "should_see_vet",
    label: "Should I see a vet?",
    icon: "medkit-outline",
  },
];

/* =========================================================
   HELPER - FORMAT TIME
========================================================= */

const formatMessageTime = (timestamp) => {
  if (!timestamp) return "";

  try {
    const date = new Date(timestamp);

    if (isNaN(date.getTime())) return "";

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "";
  }
};

/* =========================================================
   MAIN SCREEN
========================================================= */

export default function DermPawAIAgentScreen({ route, navigation }) {
  const {
    petId = null,
    scanId = null,
    prediction = null,
    confidence = 0,
    allScores = {},
    diseaseInfo = {},
    photo = null,
    gradCam = null,
  } = route?.params || {};

  /* =======================================================
     STATES
  ======================================================= */

  const [sessionId, setSessionId] = useState(null);

  const [messages, setMessages] = useState([]);

  const [inputText, setInputText] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  const [uncertaintyInfo, setUncertaintyInfo] = useState({
    level: "LOW",
    normalizedEntropy: 0,
  });

  const [safetyInfo, setSafetyInfo] = useState({
    level: "NORMAL",
    requiresVetReview: false,
    reasons: [],
  });

  const scrollViewRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function startSession() {
      setIsLoading(true);

      try {
        const predPayload = {
          disease: prediction || null,
          confidence: Number(confidence) || 0,
          allScores: allScores || {},
          diseaseInfo: diseaseInfo || {},
        };

        const res = await initializeAgentSession({
          petId,
          scanId,
          prediction: predPayload,
          image: photo || "",
          gradCamImage: gradCam || "",
        });

        if (isMounted && res.success) {
          setSessionId(res.session?._id || null);

          setMessages(
            res.messages ||
              res.session?.messages ||
              []
          );

          if (res.uncertainty) {
            setUncertaintyInfo(res.uncertainty);
          }

          if (res.safety) {
            setSafetyInfo(res.safety);
          }
        }
      } catch (error) {
        console.error("Session start error:", error);

        Alert.alert(
          "Connection Note",
          "The AI assistant could not connect. Please check your connection."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    startSession();

    return () => {
      isMounted = false;
    };
  }, []);


  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({
        animated: true,
      });
    }, 150);
  }, [messages, isLoading]);

  const handleSend = async (
    customText,
    customIntent
  ) => {
    const textToSend =
      customText !== undefined
        ? customText
        : inputText.trim();

    const intentToSend =
      customIntent || "";

    if (!textToSend && !intentToSend) {
      return;
    }

    if (!sessionId) {
      Alert.alert(
        "Please wait",
        "The AI assistant is still initializing."
      );

      return;
    }

    setInputText("");

    setIsLoading(true);

    /* Add user message immediately */

    if (textToSend) {
      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          type: "text",
          content: textToSend,
          timestamp: new Date().toISOString(),
        },
      ]);
    }

    try {
      const res = await sendAgentMessage({
        sessionId,
        message: textToSend,
        actionIntent: intentToSend,
      });

      if (res.success) {
        setMessages(res.messages || []);

        if (res.uncertainty) {
          setUncertaintyInfo(res.uncertainty);
        }

        if (res.safety) {
          setSafetyInfo(res.safety);
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        error.message ||
          "Failed to communicate with the AI Assistant."
      );
    } finally {
      setIsLoading(false);
    }
  };

  /* =======================================================
     UNCERTAINTY COLOR
  ======================================================= */

  const getUncertaintyColor = (
    level
  ) => {
    if (level === "LOW") {
      return SUCCESS;
    }

    if (level === "MEDIUM") {
      return WARNING;
    }

    return DANGER;
  };

  /* =======================================================
     DISEASE NAME
  ======================================================= */

  const diseaseName =
    diseaseInfo?.full_name ||
    (prediction
      ? String(prediction).toUpperCase()
      : "Prediction unavailable");

  /* =======================================================
     RENDER MESSAGE
  ======================================================= */

  const renderMessage = (
    msg,
    index
  ) => {
    const isUser =
      msg.role === "user";

    const isEscalation =
      msg.type === "escalation";

    const time =
      formatMessageTime(
        msg.timestamp
      );

    return (
      <View
        key={`${index}-${msg.timestamp || ""}`}
        style={[
          styles.messageWrapper,
          isUser
            ? styles.userMessageWrapper
            : styles.aiMessageWrapper,
        ]}
      >
        {/* AI AVATAR */}

        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons
              name="paw"
              size={15}
              color={PRIMARY}
            />
          </View>
        )}

        <View
          style={[
            styles.messageColumn,
            isUser &&
              styles.userMessageColumn,
          ]}
        >
          {/* MESSAGE BUBBLE */}

          <View
            style={[
              styles.messageBubble,

              isUser
                ? styles.userBubble
                : styles.aiBubble,

              isEscalation &&
                styles.escalationBubble,
            ]}
          >
            {/* ESCALATION HEADER */}

            {isEscalation && (
              <View
                style={
                  styles.escalationHeader
                }
              >
                <View
                  style={
                    styles.warningIcon
                  }
                >
                  <Ionicons
                    name="warning"
                    size={15}
                    color={DANGER}
                  />
                </View>

                <Text
                  style={
                    styles.escalationTitle
                  }
                >
                  Veterinarian Attention
                </Text>
              </View>
            )}

            {/* MESSAGE */}

            <Text
              style={[
                styles.messageText,

                isUser
                  ? styles.userMessageText
                  : styles.aiMessageText,
              ]}
            >
              {msg.content}
            </Text>

            {/* EVIDENCE */}

            {msg.evidenceSources &&
              msg.evidenceSources.length >
                0 && (
                <View
                  style={
                    styles.evidenceContainer
                  }
                >
                  <Ionicons
                    name="book-outline"
                    size={13}
                    color={PRIMARY}
                  />

                  <Text
                    style={
                      styles.evidenceText
                    }
                  >
                    Source:{" "}
                    {
                      msg
                        .evidenceSources[0]
                        .source
                    }
                  </Text>
                </View>
              )}

            {/* ESCALATION BUTTON */}

            {isEscalation && (
              <TouchableOpacity
                style={
                  styles.vetButton
                }
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate(
                    "SelectDoctor",
                    {
                      photo,

                      result: {
                        disease:
                          prediction,

                        confidence:
                          confidence,
                      },
                    }
                  )
                }
              >
                <Ionicons
                  name="medkit-outline"
                  size={17}
                  color="#fff"
                />

                <Text
                  style={
                    styles.vetButtonText
                  }
                >
                  Consult a Veterinarian
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color="#fff"
                />
              </TouchableOpacity>
            )}
          </View>

          {/* TIME */}

          {time ? (
            <View
              style={[
                styles.timeRow,

                isUser &&
                  styles.timeRowUser,
              ]}
            >
              <Text
                style={styles.timeText}
              >
                {time}
              </Text>

              {isUser && (
                <Ionicons
                  name="checkmark-done"
                  size={13}
                  color={PRIMARY}
                />
              )}
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff"
      />

      {/* ===================================================
          HEADER
      =================================================== */}

      <View style={styles.header}>
        {/* BACK */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            navigation.goBack()
          }
          activeOpacity={0.8}
        >
          <Ionicons
            name="arrow-back"
            size={21}
            color="#111"
          />
        </TouchableOpacity>

        {/* AI PROFILE */}

        <View style={styles.profileArea}>
          <View
            style={styles.headerAvatar}
          >
            <Ionicons
              name="paw"
              size={20}
              color="#fff"
            />
          </View>

          <View style={styles.profileInfo}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              DermPaw AI
            </Text>

            <View
              style={styles.activeRow}
            >
              <View
                style={styles.activeDot}
              />

              <Text
                style={styles.activeText}
              >
                AI Assistant
              </Text>
            </View>
          </View>
        </View>

        {/* VET BUTTON */}

        <TouchableOpacity
          style={styles.headerAction}
          onPress={() =>
            navigation.navigate(
              "SelectDoctor",
              {
                photo,

                result: {
                  disease:
                    prediction,

                  confidence:
                    confidence,
                },
              }
            )
          }
        >
          <Ionicons
            name="medkit-outline"
            size={21}
            color={PRIMARY}
          />
        </TouchableOpacity>
      </View>

      {/* ===================================================
          PREDICTION SUMMARY
      =================================================== */}

      <View
        style={styles.predictionCard}
      >
        <View
          style={styles.predictionTop}
        >
          {/* IMAGE */}

          {photo ? (
            <Image
              source={{
                uri: photo,
              }}
              style={
                styles.predictionImage
              }
              resizeMode="cover"
            />
          ) : (
            <View
              style={
                styles.imagePlaceholder
              }
            >
              <Ionicons
                name="image-outline"
                size={28}
                color={PRIMARY}
              />
            </View>
          )}

          {/* DETAILS */}

          <View
            style={
              styles.predictionDetails
            }
          >
            <Text
              style={
                styles.predictionLabel
              }
            >
              AI Prediction
            </Text>

            <Text
              style={
                styles.predictionDisease
              }
              numberOfLines={2}
            >
              {diseaseName}
            </Text>

            <View
              style={
                styles.confidenceRow
              }
            >
              <View
                style={
                  styles.confidenceIcon
                }
              >
                <Ionicons
                  name="analytics-outline"
                  size={14}
                  color={PRIMARY}
                />
              </View>

              <Text
                style={
                  styles.confidenceText
                }
              >
                {Number(confidence) || 0}%
                confidence
              </Text>
            </View>
          </View>
        </View>

        {/* CONFIDENCE BAR */}

        <View
          style={styles.progressBackground}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      confidence
                    ) || 0
                  )
                )}%`,
              },
            ]}
          />
        </View>

        {/* STATUS */}

        <View
          style={
            styles.predictionFooter
          }
        >
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  getUncertaintyColor(
                    uncertaintyInfo.level
                  ) + "15",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    getUncertaintyColor(
                      uncertaintyInfo.level
                    ),
                },
              ]}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color:
                    getUncertaintyColor(
                      uncertaintyInfo.level
                    ),
                },
              ]}
            >
              {uncertaintyInfo.level} uncertainty
            </Text>
          </View>

          {safetyInfo.requiresVetReview && (
            <View
              style={
                styles.vetAttentionBadge
              }
            >
              <Ionicons
                name="warning-outline"
                size={13}
                color={DANGER}
              />

              <Text
                style={
                  styles.vetAttentionText
                }
              >
                Vet review advised
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* ===================================================
          CHAT
      =================================================== */}

      <KeyboardAvoidingView
        style={styles.chatArea}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        keyboardVerticalOffset={
          Platform.OS === "ios"
            ? 5
            : 0
        }
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatScroll}
          contentContainerStyle={
            styles.chatContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* DATE LABEL */}

          <View
            style={styles.todayContainer}
          >
            <View
              style={styles.todayLine}
            />

            <Text
              style={styles.todayText}
            >
              TODAY
            </Text>

            <View
              style={styles.todayLine}
            />
          </View>

          {/* INITIAL IMAGE MESSAGE */}

          {photo && (
            <View
              style={styles.scanMessage}
            >
              <View
                style={styles.aiAvatar}
              >
                <Ionicons
                  name="paw"
                  size={15}
                  color={PRIMARY}
                />
              </View>

              <View
                style={
                  styles.scanMessageColumn
                }
              >
                <View
                  style={
                    styles.scanBubble
                  }
                >
                  <Text
                    style={
                      styles.scanTitle
                    }
                  >
                    🐾 Your scan
                  </Text>

                  <Image
                    source={{
                      uri: photo,
                    }}
                    style={
                      styles.chatPredictionImage
                    }
                    resizeMode="cover"
                  />

                  <View
                    style={
                      styles.scanResultBox
                    }
                  >
                    <Text
                      style={
                        styles.scanResultLabel
                      }
                    >
                      Detected condition
                    </Text>

                    <Text
                      style={
                        styles.scanResult
                      }
                    >
                      {diseaseName}
                    </Text>

                    <Text
                      style={
                        styles.scanConfidence
                      }
                    >
                      Confidence:{" "}
                      {Number(
                        confidence
                      ) || 0}
                      %
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    styles.scanTime
                  }
                >
                  Scan result
                </Text>
              </View>
            </View>
          )}

          {/* MESSAGES */}

          {messages.map(
            renderMessage
          )}

          {/* =================================================
              LOADING
          ================================================= */}

          {isLoading && (
            <View
              style={
                styles.typingContainer
              }
            >
              <View
                style={styles.aiAvatar}
              >
                <Ionicons
                  name="paw"
                  size={15}
                  color={PRIMARY}
                />
              </View>

              <View
                style={
                  styles.typingBubble
                }
              >
                <ActivityIndicator
                  size="small"
                  color={PRIMARY}
                />

                <Text
                  style={
                    styles.typingText
                  }
                >
                  DermPaw is thinking...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* =================================================
            QUICK ACTIONS (Suggested Question Shortcuts)
        ================================================= */}

        <View
          style={
            styles.quickActionsWrapper
          }
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.quickActionsContent
            }
          >
            {QUICK_ACTIONS.map(
              (item) => (
                <TouchableOpacity
                  key={item.id}
                  style={
                    styles.quickAction
                  }
                  onPress={() =>
                    handleSend(
                      item.label,
                      item.id
                    )
                  }
                  disabled={
                    isLoading
                  }
                  activeOpacity={
                    0.8
                  }
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={
                      PRIMARY
                    }
                  />

                  <Text
                    style={
                      styles.quickActionText
                    }
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>

        {/* =================================================
            INPUT BAR
        ================================================= */}

        <View
          style={styles.inputContainer}
        >
          {/* ATTACH */}

          <TouchableOpacity
            style={
              styles.inputIconButton
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="attach-outline"
              size={22}
              color={PRIMARY}
            />
          </TouchableOpacity>

          {/* INPUT */}

          <TextInput
            style={styles.textInput}
            placeholder="Ask DermPaw AI..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={
              setInputText
            }
            multiline
            maxLength={500}
            onSubmitEditing={() =>
              handleSend()
            }
          />

          {/* SEND */}

          <TouchableOpacity
            style={[
              styles.sendButton,
              !inputText.trim() &&
                styles.sendButtonDisabled,
            ]}
            onPress={() =>
              handleSend()
            }
            disabled={
              !inputText.trim() ||
              isLoading
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  /* =======================================================
     CONTAINER
  ======================================================= */

  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    backgroundColor: WHITE,

    paddingHorizontal: 14,

    paddingTop:
      Platform.OS === "android"
        ? 12
        : 8,

    paddingBottom: 12,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth: 1,

    borderBottomColor:
      "#EEEEEE",

    elevation: 3,

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 2,
    },

    shadowOpacity: 0.06,

    shadowRadius: 4,

    zIndex: 10,
  },

  backButton: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor: BG,

    justifyContent: "center",

    alignItems: "center",
  },

  profileArea: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    marginLeft: 11,
  },

  headerAvatar: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: PRIMARY,

    justifyContent: "center",

    alignItems: "center",
  },

  profileInfo: {
    marginLeft: 10,

    flex: 1,
  },

  headerTitle: {
    fontSize: 16,

    fontWeight: "800",

    color: TEXT_DARK,
  },

  activeRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 2,
  },

  activeDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor:
      SUCCESS,

    marginRight: 5,
  },

  activeText: {
    fontSize: 11,

    color: TEXT_MUTED,

    fontWeight: "500",
  },

  headerAction: {
    width: 40,
    height: 40,

    borderRadius: 20,

    backgroundColor:
      LIGHT_PURPLE,

    justifyContent: "center",

    alignItems: "center",
  },

  /* =======================================================
     PREDICTION CARD
  ======================================================= */

  predictionCard: {
    backgroundColor: WHITE,

    marginHorizontal: 12,

    marginTop: 10,

    borderRadius: 18,

    padding: 12,

    borderWidth: 1,

    borderColor:
      BORDER_PURPLE,

    elevation: 2,

    shadowColor: "#000",

    shadowOpacity: 0.04,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  predictionTop: {
    flexDirection: "row",

    alignItems: "center",
  },

  predictionImage: {
    width: 72,
    height: 72,

    borderRadius: 14,

    backgroundColor: BG,
  },

  imagePlaceholder: {
    width: 72,
    height: 72,

    borderRadius: 14,

    backgroundColor:
      LIGHT_PURPLE,

    justifyContent: "center",

    alignItems: "center",
  },

  predictionDetails: {
    flex: 1,

    marginLeft: 12,
  },

  predictionLabel: {
    fontSize: 10,

    color: TEXT_MUTED,

    fontWeight: "600",

    textTransform: "uppercase",

    letterSpacing: 0.6,
  },

  predictionDisease: {
    fontSize: 16,

    color: PRIMARY,

    fontWeight: "800",

    marginTop: 3,
  },

  confidenceRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 5,
  },

  confidenceIcon: {
    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor:
      LIGHT_PURPLE,

    justifyContent: "center",

    alignItems: "center",

    marginRight: 5,
  },

  confidenceText: {
    fontSize: 11,

    color: TEXT_MUTED,

    fontWeight: "600",
  },

  progressBackground: {
    height: 5,

    backgroundColor:
      "#EDE8F2",

    borderRadius: 5,

    marginTop: 11,

    overflow: "hidden",
  },

  progressFill: {
    height: "100%",

    backgroundColor:
      PRIMARY,

    borderRadius: 5,
  },

  predictionFooter: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "space-between",

    marginTop: 9,
  },

  statusBadge: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 12,
  },

  statusDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    marginRight: 5,
  },

  statusText: {
    fontSize: 10,

    fontWeight: "700",

    textTransform:
      "capitalize",
  },

  vetAttentionBadge: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor:
      "#FEE2E2",

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: 12,
  },

  vetAttentionText: {
    fontSize: 10,

    color: DANGER,

    fontWeight: "700",

    marginLeft: 4,
  },

  /* =======================================================
     CHAT
  ======================================================= */

  chatArea: {
    flex: 1,
  },

  chatScroll: {
    flex: 1,
  },

  chatContent: {
    paddingHorizontal: 13,

    paddingTop: 5,

    paddingBottom: 12,
  },

  /* =======================================================
     TODAY
  ======================================================= */

  todayContainer: {
    flexDirection: "row",

    alignItems: "center",

    marginVertical: 9,
  },

  todayLine: {
    flex: 1,

    height: 1,

    backgroundColor:
      "#E4E0E8",
  },

  todayText: {
    fontSize: 9,

    color: "#999",

    fontWeight: "700",

    marginHorizontal: 10,

    letterSpacing: 0.7,
  },

  /* =======================================================
     MESSAGE
  ======================================================= */

  messageWrapper: {
    flexDirection: "row",

    marginVertical: 4,

    alignItems: "flex-end",
  },

  userMessageWrapper: {
    justifyContent:
      "flex-end",
  },

  aiMessageWrapper: {
    justifyContent:
      "flex-start",
  },

  aiAvatar: {
    width: 28,
    height: 28,

    borderRadius: 14,

    backgroundColor:
      LIGHT_PURPLE,

    justifyContent: "center",

    alignItems: "center",

    marginRight: 7,

    marginBottom: 20,
  },

  messageColumn: {
    maxWidth: "79%",
  },

  userMessageColumn: {
    alignItems: "flex-end",
  },

  messageBubble: {
    paddingHorizontal: 13,

    paddingVertical: 10,

    borderRadius: 18,
  },

  userBubble: {
    backgroundColor:
      PRIMARY,

    borderBottomRightRadius: 5,
  },

  aiBubble: {
    backgroundColor:
      WHITE,

    borderBottomLeftRadius: 5,

    borderWidth: 1,

    borderColor:
      "#E8E3EC",

    elevation: 1,
  },

  escalationBubble: {
    backgroundColor:
      "#FFF7F7",

    borderColor:
      "#FECACA",
  },

  messageText: {
    fontSize: 14,

    lineHeight: 20,
  },

  userMessageText: {
    color: WHITE,
  },

  aiMessageText: {
    color: TEXT_DARK,
  },

  /* =======================================================
     TIME
  ======================================================= */

  timeRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 3,

    marginLeft: 4,
  },

  timeRowUser: {
    marginRight: 4,

    justifyContent:
      "flex-end",
  },

  timeText: {
    fontSize: 10,

    color: "#8A8A8A",

    marginRight: 3,
  },

  /* =======================================================
     EVIDENCE
  ======================================================= */

  evidenceContainer: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 8,

    paddingTop: 7,

    borderTopWidth: 1,

    borderTopColor:
      "#EDE7F2",
  },

  evidenceText: {
    fontSize: 10,

    color: PRIMARY,

    fontStyle: "italic",

    marginLeft: 5,

    flex: 1,
  },

  /* =======================================================
     ESCALATION
  ======================================================= */

  escalationHeader: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 7,
  },

  warningIcon: {
    width: 28,
    height: 28,

    borderRadius: 14,

    backgroundColor:
      "#FEE2E2",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 7,
  },

  escalationTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: DANGER,
  },

  vetButton: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent:
      "center",

    backgroundColor:
      DANGER,

    borderRadius: 12,

    paddingVertical: 10,

    paddingHorizontal: 11,

    marginTop: 10,
  },

  vetButtonText: {
    color: WHITE,

    fontSize: 12,

    fontWeight: "700",

    marginHorizontal: 6,
  },

  /* =======================================================
     SCAN IMAGE MESSAGE
  ======================================================= */

  scanMessage: {
    flexDirection: "row",

    alignItems: "flex-end",

    marginVertical: 7,
  },

  scanMessageColumn: {
    maxWidth: "82%",
  },

  scanBubble: {
    backgroundColor: WHITE,

    borderRadius: 18,

    borderBottomLeftRadius: 5,

    padding: 10,

    borderWidth: 1,

    borderColor:
      BORDER_PURPLE,

    elevation: 2,
  },

  scanTitle: {
    fontSize: 12,

    color: PRIMARY,

    fontWeight: "800",

    marginBottom: 8,
  },

  chatPredictionImage: {
    width:
      Math.min(
        width * 0.65,
        260
      ),

    height:
      Math.min(
        width * 0.65,
        220
      ),

    borderRadius: 13,

    backgroundColor: BG,
  },

  scanResultBox: {
    backgroundColor:
      SOFT_PURPLE,

    borderRadius: 11,

    padding: 9,

    marginTop: 8,
  },

  scanResultLabel: {
    fontSize: 9,

    color: TEXT_MUTED,

    textTransform:
      "uppercase",

    fontWeight: "600",
  },

  scanResult: {
    fontSize: 14,

    color: PRIMARY,

    fontWeight: "800",

    marginTop: 2,
  },

  scanConfidence: {
    fontSize: 10,

    color: TEXT_MUTED,

    marginTop: 3,
  },

  scanTime: {
    fontSize: 10,

    color: "#888",

    marginTop: 4,

    marginLeft: 4,
  },


  /* =======================================================
     TYPING
  ======================================================= */

  typingContainer: {
    flexDirection: "row",

    alignItems: "flex-end",

    marginVertical: 6,
  },

  typingBubble: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: WHITE,

    borderRadius: 17,

    paddingHorizontal: 12,

    paddingVertical: 9,

    borderWidth: 1,

    borderColor:
      "#E8E3EC",
  },

  typingText: {
    fontSize: 11,

    color: TEXT_MUTED,

    fontStyle: "italic",

    marginLeft: 7,
  },

  /* =======================================================
     QUICK ACTIONS
  ======================================================= */

  quickActionsWrapper: {
    backgroundColor:
      BG,

    paddingTop: 5,

    paddingBottom: 4,
  },

  quickActionsContent: {
    paddingHorizontal: 12,
  },

  quickAction: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: WHITE,

    borderWidth: 1,

    borderColor:
      BORDER_PURPLE,

    borderRadius: 20,

    paddingHorizontal: 11,

    paddingVertical: 7,

    marginRight: 7,
  },

  quickActionText: {
    fontSize: 10,

    color: PRIMARY,

    fontWeight: "600",

    marginLeft: 5,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputContainer: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: WHITE,

    paddingHorizontal: 10,

    paddingTop: 8,

    paddingBottom:
      Platform.OS === "ios"
        ? 10
        : 8,

    borderTopWidth: 1,

    borderTopColor:
      "#E6E2EA",

    elevation: 8,

    shadowColor: "#000",

    shadowOpacity: 0.06,

    shadowRadius: 5,

    shadowOffset: {
      width: 0,
      height: -2,
    },
  },

  inputIconButton: {
    width: 38,
    height: 38,

    borderRadius: 19,

    justifyContent:
      "center",

    alignItems: "center",

    backgroundColor:
      LIGHT_PURPLE,
  },

  textInput: {
    flex: 1,

    minHeight: 42,

    maxHeight: 90,

    backgroundColor:
      BG,

    borderRadius: 20,

    paddingHorizontal: 14,

    paddingVertical:
      Platform.OS === "ios"
        ? 10
        : 8,

    marginHorizontal: 7,

    fontSize: 13,

    color: TEXT_DARK,
  },

  sendButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor:
      PRIMARY,

    justifyContent:
      "center",

    alignItems: "center",
  },

  sendButtonDisabled: {
    opacity: 0.45,
  },
});