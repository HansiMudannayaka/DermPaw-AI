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
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PRIMARY = "#4B0082";
const SECONDARY = "#8A2BE2";
const BG = "#F4F5FA";
const CARD = "#FFFFFF";

export default function ManagePetsScreen({ navigation }) {
  const [pets, setPets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPetId, setEditingPetId] = useState(null);

  const [newPet, setNewPet] = useState({
    name: "",
    age: "",
    weight: "",
    gender: "",
    description: "",
    color: "",
    image: "",
  });

  const fetchPets = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await fetch("http://172.20.10.4:8000/api/pets", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setPets(data.pets || []);
      }
    } catch (error) {
      console.log("Error fetching pets in ManagePetsScreen:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchPets();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Allow gallery access to select pet photos");
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
      setNewPet({ ...newPet, image: result.assets[0].uri });
    }
  };

  const handleAddPet = () => {
    setIsEditing(false);
    setNewPet({
      name: "",
      age: "",
      weight: "",
      gender: "",
      description: "",
      color: "",
      image: "",
    });
    setModalVisible(true);
  };

  const handleEditPet = (pet) => {
    setEditingPetId(pet._id);
    setNewPet({
      name: pet.name,
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender,
      description: pet.description,
      color: pet.color,
      image: pet.image,
    });
    setIsEditing(true);
    setModalVisible(true);
  };

  const savePet = async () => {
    const requiredFields = ["name", "age", "weight", "gender", "color", "description"];
    const emptyField = requiredFields.find(field => !newPet[field] || newPet[field].trim() === "");

    if (emptyField) {
      Alert.alert("Missing Field", `Please fill ${emptyField.charAt(0).toUpperCase() + emptyField.slice(1)}`);
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      let url = "http://172.20.10.4:8000/api/pets";
      let method = "POST";

      if (isEditing) {
        url = `http://172.20.10.4:8000/api/pets/${editingPetId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPet.name.trim(),
          age: newPet.age.trim(),
          weight: newPet.weight.trim(),
          gender: newPet.gender.trim(),
          description: newPet.description.trim(),
          color: newPet.color.trim(),
          image: newPet.image || "https://images.dog.ceo/breeds/shih-tzu/n02086240_2550.jpg",
        })
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("Success", isEditing ? "Pet updated successfully" : "Pet added successfully");
        fetchPets();
        setModalVisible(false);
      } else {
        Alert.alert("Error", data.message || "Failed to save pet");
      }
    } catch (error) {
      console.log("Error saving pet:", error);
      Alert.alert("Error", "Server not reachable");
    }
  };

  const handleDeletePet = (petId) => {
    Alert.alert("Delete Pet", "Are you sure you want to remove this pet profile?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            const res = await fetch(`http://172.20.10.4:8000/api/pets/${petId}`, {
              method: "DELETE",
              headers: {
                "Authorization": `Bearer ${token}`
              }
            });
            const data = await res.json();
            if (data.success) {
              Alert.alert("Deleted", "Pet profile deleted successfully");
              fetchPets();
            } else {
              Alert.alert("Error", data.message || "Failed to delete pet");
            }
          } catch (error) {
            console.log("Error deleting pet:", error);
            Alert.alert("Error", "Server not reachable");
          }
        }
      }
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      {/* ================= HEADER ================= */}
      <LinearGradient colors={[PRIMARY, SECONDARY]} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Pets</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={handleAddPet}>
          <Ionicons name="add-circle" size={26} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* ================= LIST ================= */}
      {pets.length > 0 ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {pets.map((pet) => (
            <View key={pet._id} style={styles.petCard}>
              <Image
                source={pet.image ? { uri: pet.image } : require("../../../assets/images/dog1.png")}
                style={styles.petImage}
              />
              <View style={styles.petDetails}>
                <Text style={styles.petName}>{pet.name}</Text>
                <Text style={styles.petInfo}>{pet.color || "Black"} • {pet.age || "2 Years"}</Text>
                <Text style={styles.petGender}>{pet.gender || "Female"}</Text>
                
                <TouchableOpacity 
                  style={styles.viewLink}
                  onPress={() => navigation.navigate("PetProfile")}
                >
                  <Text style={styles.viewLinkText}>View Details ›</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.actionColumn}>
                <TouchableOpacity style={styles.editIcon} onPress={() => handleEditPet(pet)}>
                  <Ionicons name="pencil" size={18} color="#8A2BE2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDeletePet(pet._id)}>
                  <Ionicons name="trash" size={18} color="#FF4D6D" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="paw" size={80} color="#E6D9FF" />
          <Text style={styles.emptyText}>No pets added yet 🐶</Text>
          <TouchableOpacity style={styles.addBtnEmpty} onPress={handleAddPet}>
            <Text style={styles.addBtnEmptyText}>+ Add Pet Profile</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ================= FLOATING ACTION BUTTON ================= */}
      {pets.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddPet}>
          <LinearGradient colors={["#8A2BE2", "#4B0082"]} style={styles.fabGradient}>
            <Ionicons name="add" size={26} color="#fff" />
            <Text style={styles.fabText}>Add Pet</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ================= ADD/EDIT PET MODAL ================= */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isEditing ? "Edit Pet Profile" : "Add New Pet"}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#4B0082" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Fill in your dog's profile details</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                {newPet.image ? (
                  <Image source={{ uri: newPet.image }} style={styles.pickedImg} />
                ) : (
                  <View style={styles.pickerPlaceholder}>
                    <Ionicons name="camera" size={30} color="#8A2BE2" />
                    <Text style={styles.pickerText}>Select Dog Photo</Text>
                  </View>
                )}
              </TouchableOpacity>

              {["name", "age", "weight", "gender", "color", "description"].map((field) => (
                <TextInput
                  key={field}
                  placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                  placeholderTextColor="#999"
                  style={[styles.input, { color: "#333" }]}
                  value={newPet[field]}
                  onChangeText={(t) => setNewPet({ ...newPet, [field]: t })}
                />
              ))}
            </ScrollView>

            <TouchableOpacity onPress={savePet} style={{ marginTop: 15 }}>
              <LinearGradient colors={["#8A2BE2", "#4B0082"]} style={styles.saveBtn}>
                <Ionicons name="paw" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.saveText}>Save Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    height: 110,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  addBtnHeader: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  petCard: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
  },
  petInfo: {
    color: "#666",
    fontSize: 13,
    marginTop: 4,
  },
  petGender: {
    color: "#8A2BE2",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  viewLink: {
    marginTop: 6,
  },
  viewLinkText: {
    color: "#8A2BE2",
    fontWeight: "600",
    fontSize: 13,
  },
  actionColumn: {
    justifyContent: "space-around",
    height: 80,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: "#EAEAEA",
  },
  editIcon: {
    padding: 8,
  },
  deleteIcon: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: PRIMARY,
    marginTop: 20,
    marginBottom: 20,
  },
  addBtnEmpty: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  addBtnEmptyText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    borderRadius: 30,
    elevation: 8,
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 30,
    gap: 6,
  },
  fabText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: PRIMARY,
  },
  modalSub: {
    color: "#777",
    marginTop: 5,
    marginBottom: 15,
  },
  imagePicker: {
    height: 120,
    borderRadius: 15,
    backgroundColor: "#F5F0FA",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E6D9FF",
    borderStyle: "dashed",
    overflow: "hidden",
  },
  pickerPlaceholder: {
    alignItems: "center",
  },
  pickerText: {
    color: "#8A2BE2",
    fontWeight: "600",
    marginTop: 5,
  },
  pickedImg: {
    width: "100%",
    height: "100%",
  },
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
  },
  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});
