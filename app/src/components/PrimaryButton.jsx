import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import Colors from "../styles/colors";

export default function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 10
  },
  text: {
    color: Colors.white,
    fontWeight: "bold",
    fontSize: 16
  }
});