import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function SelectPetToScanScreen({ navigation }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const res = await fetch("http://192.168.1.6:8000/api/pets", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (data.success) {
          setPets(data.pets || []);
        } else {
          setPets([]);
        }
      } catch (error) {
        console.log("Error fetching pets for Scan:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Refresh every time screen focuses
    const unsubscribe = navigation.addListener("focus", () => {
      setLoading(true);
      fetchPets();
    });
    
    return unsubscribe;
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8A2BE2" />
        <Text style={{ marginTop: 10, color: "#777" }}>Loading pets...</Text>
      </View>
    );
  }

  // If no pets, force them to create one
  if (pets.length === 0) {
    return (
      <View style={styles.center}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="paw" size={80} color="#E6D9FF" />
        <Text style={styles.emptyTitle}>No pets found</Text>
        <Text style={styles.emptySub}>You need to create a pet profile first before scanning.</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate("ManagePets")}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.createBtnText}>Create Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{ marginTop: 20 }}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={{ color: "#777", fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="close" size={24} color="#111" />
        </TouchableOpacity>
        <Text style={styles.title}>Select Pet to Scan</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.subtitle}>Which pet are you scanning today?</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet._id}
            style={styles.petCard}
            activeOpacity={0.7}
            onPress={() => {
              navigation.navigate("GuideCamera", { petId: pet._id, petName: pet.name });
            }}
          >
            <Image
              source={pet.image && pet.image.startsWith("http") ? { uri: pet.image } : require("../../../assets/images/dog.png")}
              style={styles.petImage}
            />
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSubInfo}>{pet.color || "Unknown Color"} • {pet.age || "Unknown Age"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8A2BE2" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.addPetCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("ManagePets")}
        >
          <View style={styles.addIconCircle}>
            <Ionicons name="add" size={24} color="#8A2BE2" />
          </View>
          <Text style={styles.addText}>Create New Pet Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#F4F5FA",
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  container: {
    flex: 1,
    backgroundColor: "#F4F5FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 50,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B0082",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginTop: 25,
    marginBottom: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  petCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 18,
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#333",
  },
  petSubInfo: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
  },
  addPetCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8D9FF",
    padding: 15,
    borderRadius: 18,
    marginTop: 5,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  addText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4B0082",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4B0082",
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#8A2BE2",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    marginTop: 30,
    gap: 8
  },
  createBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  }
});
