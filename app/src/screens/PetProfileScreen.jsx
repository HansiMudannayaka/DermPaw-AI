import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";

export default function PetProfile2({ navigation }) {
  const [pets, setPets] = useState([
    {
      id: 1,
      name: "Zara",
      image: "https://images.dog.ceo/breeds/shih-tzu/n02086240_2550.jpg",
      age: "3 Months",
      weight: "2.5 Kg",
      gender: "Female",
      description: "Adorable Shih Tzu puppy.",
      color: "Grey with Black",
    },
  ]);

  const [selectedPet, setSelectedPet] = useState(pets[0]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [newPet, setNewPet] = useState({
    name: "",
    age: "",
    weight: "",
    gender: "",
    description: "",
    color: "",
  });

  const owner = {
    name: "Divakaran K",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
  };

  useEffect(() => {
    (async () => {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Allow gallery access");
      }
    })();
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;

      const updated = pets.map((p) =>
        p.id === selectedPet.id ? { ...p, image: uri } : p
      );

      setPets(updated);
      setSelectedPet({ ...selectedPet, image: uri });
    }
  };

  const saveNewPet = () => {
    const requiredFields = [
      "name",
      "age",
      "weight",
      "gender",
      "description",
      "color",
    ];

    const emptyField = requiredFields.find(
      (field) => !newPet[field] || newPet[field].trim() === ""
    );

    if (emptyField) {
      Alert.alert("Missing Field", `Please fill ${emptyField.toUpperCase()}`);
      return;
    }

    if (isEditing) {
      const updated = pets.map((p) =>
        p.id === selectedPet.id ? { ...p, ...newPet } : p
      );
      setPets(updated);
      setSelectedPet({ ...selectedPet, ...newPet });
    } else {
      const pet = {
        id: Date.now(),
        ...newPet,
        image: "https://via.placeholder.com/150",
      };
      setPets([...pets, pet]);
      setSelectedPet(pet);
    }

    setNewPet({
      name: "",
      age: "",
      weight: "",
      gender: "",
      description: "",
      color: "",
    });

    setIsEditing(false);
    setModalVisible(false);
  };

  const editPet = () => {
    setNewPet({ ...selectedPet });
    setIsEditing(true);
    setModalVisible(true);
  };

  const deletePet = () => {
    if (pets.length === 1) {
      Alert.alert("Cannot delete", "At least one pet required");
      return;
    }

    Alert.alert("Delete Pet", "Are you sure?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updated = pets.filter((p) => p.id !== selectedPet.id);
          setPets(updated);
          setSelectedPet(updated[0]);
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}
        >
          <Ionicons name="arrow-back" size={20} color="#4B0082" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Pet Profile</Text>

        <Ionicons name="heart-outline" size={24} color="#4B0082" />
      </View>

      {/* IMAGE */}
      <View style={styles.imageWrapper}>
        <View style={styles.outerCircle}>
          <View style={styles.innerCircle}>
            <TouchableOpacity onPress={pickImage}>
              <Image source={{ uri: selectedPet.image }} style={styles.image} />
              <View style={styles.cameraIcon}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* NAME */}
      <Text style={styles.name}>{selectedPet.name}</Text>

      <Text style={styles.subText}>
        Color : {selectedPet.color || "Not set"}
      </Text>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <FontAwesome5 name="dog" size={16} color="#8A2BE2" />
          <Text style={styles.statText}>{selectedPet.age}</Text>
          <Text style={styles.statLabel}>Age</Text>
        </View>

        <View style={styles.statBox}>
          <MaterialIcons name="monitor-weight" size={18} color="#8A2BE2" />
          <Text style={styles.statText}>{selectedPet.weight}</Text>
          <Text style={styles.statLabel}>Weight</Text>
        </View>

        <View style={styles.statBox}>
          <FontAwesome5 name="paw" size={16} color="#8A2BE2" />
          <Text style={styles.statText}>{selectedPet.gender}</Text>
          <Text style={styles.statLabel}>Gender</Text>
        </View>
      </View>

      {/* ABOUT */}
      <Text style={styles.sectionTitle}>About</Text>
      <Text style={styles.description}>{selectedPet.description}</Text>

      {/* OWNER */}
      <View style={styles.ownerCard}>
        <Image source={{ uri: owner.image }} style={styles.ownerImg} />

        <View style={{ flex: 1 }}>
          <Text style={styles.ownerLabel}>Owned by</Text>
          <Text style={styles.ownerName}>{owner.name}</Text>
        </View>

        {/* ✅ NAVIGATION FIX HERE */}
        <TouchableOpacity
          onPress={() => navigation.navigate("OwnerProfile")}
        >
          <Text style={styles.viewProfile}>View Profile ›</Text>
        </TouchableOpacity>
      </View>

      {/* ACTION */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editBtn} onPress={editPet}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={deletePet}>
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* PET LIST */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.petRow}>
          {pets.map((pet) => (
            <TouchableOpacity
              key={pet.id}
              style={[
                styles.petCard,
                selectedPet.id === pet.id && styles.activeCard,
              ]}
              onPress={() => setSelectedPet(pet)}
            >
              <Image source={{ uri: pet.image }} style={styles.petImg} />
              <Text style={styles.petName}>{pet.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addCard}
            onPress={() => {
              setIsEditing(false);
              setNewPet({
                name: "",
                age: "",
                weight: "",
                gender: "",
                description: "",
                color: "",
              });
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={30} color="#4B0082" />
            <Text style={styles.petName}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MODAL (UNCHANGED) */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit Pet" : "Add New Pet"}
              </Text>

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4B0082" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>Fill pet details below</Text>

            {["name", "age", "weight", "gender", "color", "description"].map(
              (field) => (
                <TextInput
                  key={field}
                  placeholder={field.toUpperCase()}
                  style={styles.input}
                  value={newPet[field]}
                  onChangeText={(t) =>
                    setNewPet({ ...newPet, [field]: t })
                  }
                />
              )
            )}

            <TouchableOpacity onPress={saveNewPet}>
              <LinearGradient
                colors={["#6A0DAD", "#4B0082"]}
                style={styles.saveBtn}
              >
                <Ionicons name="paw" size={18} color="#fff" />
                <Text style={styles.saveText}>Save Pet</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F5FA", paddingHorizontal: 18 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 50,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#4B0082",
  },

  imageWrapper: { alignItems: "center", marginTop: 10 },

  outerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#E6D9FF",
    justifyContent: "center",
    alignItems: "center",
  },

  innerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#D1B3FF",
    justifyContent: "center",
    alignItems: "center",
  },

  image: { width: 160, height: 160, borderRadius: 80 },

  cameraIcon: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#8A2BE2",
    padding: 6,
    borderRadius: 20,
  },

  name: {
    textAlign: "center",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 12,
    color: "#111",
  },

  subText: { textAlign: "center", color: "#666", marginTop: 5 },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
  },

  statBox: { alignItems: "center", flex: 1 },

  statText: { fontWeight: "700", marginTop: 5, color: "#333" },

  statLabel: { fontSize: 12, color: "#888" },

  sectionTitle: {
    marginTop: 25,
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },

  description: {
    color: "#666",
    marginTop: 8,
    lineHeight: 20,
  },

  ownerCard: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "#F3E8FF",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  ownerImg: { width: 45, height: 45, borderRadius: 25, marginRight: 10 },

  ownerLabel: { fontSize: 12, color: "#777" },

  ownerName: { fontWeight: "700", color: "#111" },

  viewProfile: { color: "#8A2BE2", fontWeight: "600" },

  actionRow: { flexDirection: "row", marginTop: 20, gap: 10 },

  editBtn: {
    flex: 1,
    backgroundColor: "#8A2BE2",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  deleteBtn: {
    flex: 1,
    backgroundColor: "#FF4D6D",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  actionText: { color: "#fff", fontWeight: "600" },

  petRow: { flexDirection: "row", marginTop: 20 },

  petCard: {
    alignItems: "center",
    marginRight: 15,
    padding: 12,
    borderRadius: 15,
    backgroundColor: "#fff",
  },

  activeCard: { borderWidth: 2, borderColor: "#8A2BE2" },

  petImg: { width: 60, height: 60, borderRadius: 30 },

  petName: { marginTop: 6, fontWeight: "500", color: "#333" },

  addCard: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6D9FF",
    padding: 12,
    borderRadius: 15,
    width: 80,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  modalTitle: { fontSize: 20, fontWeight: "700", color: "#4B0082" },

  modalSub: { color: "#777", marginBottom: 10, marginTop: 5 },

  input: {
    backgroundColor: "#F5F0FA",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },

  saveText: { color: "#fff", fontWeight: "700" },

  cancel: { textAlign: "center", marginTop: 12, color: "#777" },
  backBtn: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: "#fff",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 6,
  elevation: 3,
},
});