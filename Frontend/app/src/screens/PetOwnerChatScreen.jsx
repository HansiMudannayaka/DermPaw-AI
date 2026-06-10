/* =========================
   PURPLE THEME CHAT SCREEN
========================= */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY = "#3A0070";
const BG = "#F4F5FA";

const messages = [
  {
    id: "1",
    text: "Hi Doctor, my dog has skin redness.",
    sender: "me",
    time: "10:00",
  },
  {
    id: "2",
    text: "Please send a clear image.",
    sender: "doctor",
    time: "10:02",
  },
  {
    id: "3",
    text: "Here is the image doctor.",
    sender: "me",
    time: "10:05",
  },
  {
    id: "4",
    text: "Looks like allergy symptoms.",
    sender: "doctor",
    time: "10:08",
  },
];

export default function ChatScreen({ navigation }) {
  const [message, setMessage] = useState("");

  const renderItem = ({ item }) => {
    const isMe = item.sender === "me";

    return (
      <View
        style={[
          styles.messageContainer,
          {
            alignSelf: isMe
              ? "flex-end"
              : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMe
                ? PRIMARY
                : "#fff",
            },
          ]}
        >
          <Text
            style={{
              color: isMe ? "#fff" : "#222",
              fontSize: 14,
              lineHeight: 21,
            }}
          >
            {item.text}
          </Text>
        </View>

        <Text style={styles.time}>
          {item.time}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        {/* ROUNDED BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color="#111"
          />
        </TouchableOpacity>

        {/* PROFILE */}
        <View style={styles.profileRow}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2",
            }}
            style={styles.avatar}
          />

          <View>
            <Text style={styles.name}>
              Dr. Sarah
            </Text>

            <Text style={styles.online}>
              Online
            </Text>
          </View>
        </View>

        {/* RIGHT ICONS */}
        <View style={styles.rightIcons}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons
              name="call-outline"
              size={20}
              color={PRIMARY}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.iconBtn,
              { marginLeft: 10 },
            ]}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={18}
              color="#555"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* CHAT LIST */}
      <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 15,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      />

      {/* MESSAGE INPUT */}
      <View style={styles.inputContainer}>
        <TouchableOpacity>
          <Ionicons
            name="attach"
            size={24}
            color={PRIMARY}
          />
        </TouchableOpacity>

        <TextInput
          placeholder="Write a message..."
          value={message}
          onChangeText={setMessage}
          style={styles.input}
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.sendBtn}>
          <Ionicons
            name="send"
            size={18}
            color="#fff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =========================
   STYLES
========================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* HEADER */
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },

  /* ROUNDED BACK BUTTON */
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F4F5FA",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },

  /* PROFILE */
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 10,
  },

  name: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },

  online: {
    fontSize: 12,
    color: "#00B761",
    marginTop: 2,
  },

  /* RIGHT ICONS */
  rightIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F5FA",
    justifyContent: "center",
    alignItems: "center",
  },

  /* MESSAGE */
  messageContainer: {
    marginBottom: 15,
    maxWidth: "80%",
  },

  messageBubble: {
    padding: 14,
    borderRadius: 18,
  },

  time: {
    fontSize: 11,
    color: "#777",
    marginTop: 5,
    marginLeft: 5,
  },

  /* INPUT */
  inputContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 10,
  },

  input: {
    flex: 1,
    height: 48,
    backgroundColor: "#F4F5FA",
    borderRadius: 18,
    marginHorizontal: 12,
    paddingHorizontal: 15,
    color: "#111",
  },

  /* SEND BUTTON */
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
});