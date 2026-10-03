import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function DoctorPetProfile({ navigation, route }) {
  const { consultation, pet: passedPet } = route.params || {};

  const pet = {
    name: consultation?.pet?.name || consultation?.petName || passedPet?.petName || "Luna",
    image: consultation?.pet?.image || consultation?.petImage || "https://images.dog.ceo/breeds/retriever-golden/n02099601_3004.jpg",
    age: consultation?.pet?.age || "2 Years",
    weight: consultation?.pet?.weight || "24 Kg",
    gender: consultation?.pet?.gender || "Female",
    description: consultation?.pet?.description || "Healthy and active dog.",
    color: consultation?.pet?.color || "Golden",
  };

  const owner = {
    name: consultation?.owner?.name || consultation?.owner?.username || "Pet Owner",
    phone: consultation?.owner?.phone || "",
    image: consultation?.owner?.image || consultation?.owner?.profileImage || null,
  };

  const handleCall = () => {
    if (owner.phone) {
      Linking.openURL(`tel:${owner.phone}`);
    }
  };

  const handleChat = () => {
    navigation.navigate("ChatsScreen", {
      user: {
        id: consultation?._id,
        owner: owner.name,
        pet: pet.name,
        avatar: pet.image,
        original: consultation,
      },
      consultationId: consultation?._id,
      ownerId: consultation?.owner?._id || consultation?.owner,
      phone: owner.phone,
      fromScreen: "DoctorPetDetails",
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F0FF" }}>

      {/* HEADER IMAGE */}
      <View style={styles.topContainer}>
        <Image
          source={
            pet.image && (pet.image.startsWith("http") || pet.image.startsWith("data:"))
              ? { uri: pet.image }
              : require("../../../assets/images/dog1.png")
          }
          style={styles.topImage}
        />

        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color="#4B0082" />
        </TouchableOpacity>
      </View>

      {/* CONTENT */}
      <ScrollView style={styles.card} showsVerticalScrollIndicator={false}>

        <Text style={styles.name}>{pet.name}</Text>
        <Text style={styles.subText}>Color: {pet.color}</Text>

        {/* INFO */}
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{pet.age}</Text>
            <Text style={styles.chipLabel}>Age</Text>
          </View>

          <View style={styles.chip}>
            <Text style={styles.chipValue}>{pet.weight}</Text>
            <Text style={styles.chipLabel}>Weight</Text>
          </View>

          <View style={styles.chip}>
            <Text style={styles.chipValue}>{pet.gender}</Text>
            <Text style={styles.chipLabel}>Gender</Text>
          </View>
        </View>

        {/* ABOUT */}
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{pet.description}</Text>

        {/* OWNER */}
        <Text style={styles.sectionTitle}>Owner Details</Text>
        <View style={styles.ownerCard}>
          <Image source={{ uri: owner.image }} style={styles.ownerImg} />

          <View style={{ flex: 1 }}>
            <Text style={styles.ownerName}>{owner.name}</Text>
            <Text style={styles.phone}>{owner.phone}</Text>
          </View>
        </View>

        {/* ACTION BUTTONS */}
        <View style={styles.bottomRow}>

          <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
            <Ionicons name="call" size={18} color="#fff" />
            <Text style={styles.btnText}>Call Owner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
            <Ionicons name="chatbubble" size={18} color="#4B0082" />
            <Text style={styles.chatText}>Chat</Text>
          </TouchableOpacity>

        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  topContainer: { height: 280 },
  topImage: { width: "100%", height: "100%" },

  backBtn: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 20,
  },

  card: {
    backgroundColor: "#fff",
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4B0082",
  },

  subText: {
    color: "#777",
    marginBottom: 15,
  },

  chipRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  chip: {
    width: "30%",
    backgroundColor: "#F3ECFF",
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
  },

  chipValue: {
    fontWeight: "700",
    color: "#4B0082",
  },

  chipLabel: {
    fontSize: 12,
    color: "#777",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    marginTop: 10,
  },

  description: {
    color: "#555",
    lineHeight: 20,
  },

  ownerCard: {
    flexDirection: "row",
    backgroundColor: "#F3ECFF",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },

  ownerImg: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 10,
  },

  ownerName: {
    fontWeight: "700",
    fontSize: 15,
  },

  phone: {
    color: "#777",
    marginTop: 3,
  },

  bottomRow: {
    flexDirection: "row",
    marginTop: 25,
    gap: 10,
  },

  callBtn: {
    flex: 1,
    backgroundColor: "#4B0082",
    padding: 14,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  chatBtn: {
    flex: 1,
    backgroundColor: "#E6D9FF",
    padding: 14,
    borderRadius: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  btnText: {
    color: "#fff",
    fontWeight: "600",
  },

  chatText: {
    color: "#4B0082",
    fontWeight: "600",
  },
});