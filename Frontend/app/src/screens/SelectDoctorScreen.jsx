import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Modal,
  Dimensions,
  Animated,
  Pressable,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { height, width } = Dimensions.get("window");

// Constants
const COLORS = {
  PRIMARY: "#4B0082",
  SECONDARY: "#8A2BE2",
  BG: "#F6F1FF",
  CARD: "#FFFFFF",
  SUCCESS: "#16A34A",
  ERROR: "#DC2626",
  WARNING: "#F59E0B",
  TEXT_PRIMARY: "#111111",
  TEXT_SECONDARY: "#777777",
  TEXT_LIGHT: "#999999",
};

const STATUS_CONFIG = {
  Available: { color: COLORS.SUCCESS, icon: "checkmark-circle" },
  Busy: { color: COLORS.ERROR, icon: "time" },
  "On Leave": { color: COLORS.WARNING, icon: "calendar" },
};

const DoctorCard = React.memo(({ doctor, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={() => onPress(doctor)} activeOpacity={0.7}>
    <Image source={{ uri: doctor.image || "https://i.pravatar.cc/150?img=32" }} style={styles.image} />
    
    <View style={styles.info}>
      <Text style={styles.name} numberOfLines={1}>
        {doctor.name || doctor.username}
      </Text>
      <Text style={styles.specialty}>{doctor.specialization || doctor.specialty || "Veterinarian"}</Text>
      <View style={styles.metaContainer}>
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FBBF24" />
          <Text style={styles.meta}>{doctor.rating || "5.0"}</Text>
        </View>
        <Text style={styles.meta}>•</Text>
        <Text style={styles.meta}>{doctor.experience || "5 yrs"}</Text>
      </View>
    </View>

    <View style={styles.right}>
      <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[doctor.status || "Available"]?.color + '20' }]}>
        <Ionicons 
          name={STATUS_CONFIG[doctor.status || "Available"]?.icon || "checkmark-circle"} 
          size={10} 
          color={STATUS_CONFIG[doctor.status || "Available"]?.color} 
        />
        <Text style={[styles.statusText, { color: STATUS_CONFIG[doctor.status || "Available"]?.color }]}>
          {doctor.status || "Available"}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
));

export default function SelectDoctorScreen({ navigation, route }) {
  const { photo, result } = route.params || {};

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;

  // Fetch doctors from backend
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch("http://172.20.10.4:8000/api/users");
        const data = await res.json();
        const docs = data.filter((u) => u.role === "doctor" || !u.role);
        setDoctors(docs);
      } catch (err) {
        console.log("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  // Filter doctors based on search
  const filteredDoctors = useMemo(() => {
    if (!search.trim()) return doctors;
    
    return doctors.filter((doc) =>
      `${doc.name || doc.username} ${doc.specialization || doc.specialty || ""} ${doc.education || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, doctors]);

  const openDoctor = useCallback((doctor) => {
    setSelectedDoctor(doctor);
    setVisible(true);
    
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const closeSheet = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }, [slideAnim]);

  const sendRequest = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      
      const payload = {
        doctorId: selectedDoctor._id,
        petName: "My Dog",
        petImage: photo || "",
        aiResult: result || {}
      };

      const res = await fetch("http://172.20.10.4:8000/api/consultations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert(
          "Request Sent",
          `Your consultation request has been sent to ${selectedDoctor.name || selectedDoctor.username}. You'll receive a response shortly.`,
          [
            {
              text: "OK",
              onPress: () => {
                closeSheet();
                navigation.navigate("DoctorRequestSent", {
                  doctor: selectedDoctor,
                  petImage: photo,
                  aiResult: result,
                  status: "pending",
                  timestamp: new Date().toISOString(),
                });
              },
            },
          ]
        );
      } else {
        Alert.alert("Error", data.message || "Failed to submit request");
      }
    } catch (err) {
      console.log("Error submitting request:", err);
      Alert.alert("Error", "Server not reachable");
    } finally {
      setIsLoading(false);
    }
  }, [selectedDoctor, photo, result, navigation, closeSheet]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <Ionicons name="search-outline" size={64} color={COLORS.TEXT_LIGHT} />
      <Text style={styles.emptyStateTitle}>No doctors found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your search or check back later
      </Text>
    </View>
  ), []);

  const renderHeader = useCallback(() => (
    <>
      {/* Hero Section */}
      <LinearGradient 
        colors={[COLORS.PRIMARY, COLORS.SECONDARY]} 
        style={styles.heroCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>AI Case Review</Text>
          {result && (
            <>
              <Text style={styles.heroDesc}>
                Diagnosis: {result.disease}
              </Text>
              <View style={styles.confidenceContainer}>
                <View style={styles.confidenceBar}>
                  <View 
                    style={[
                      styles.confidenceFill, 
                      { width: `${result.confidence || 0}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.confidenceText}>
                  {result.confidence || 0}% confidence
                </Text>
              </View>
            </>
          )}
        </View>
        <Ionicons name="medkit" size={48} color="rgba(255,255,255,0.15)" />
      </LinearGradient>

      {/* Search Box */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={COLORS.TEXT_LIGHT} />
        <TextInput
          placeholder="Search by name, specialty, or education..."
          placeholderTextColor={COLORS.TEXT_LIGHT}
          value={search}
          onChangeText={setSearch}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close-circle" size={18} color={COLORS.TEXT_LIGHT} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Count */}
      <View style={styles.resultsCount}>
        <Text style={styles.resultsCountText}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} available
        </Text>
      </View>
    </>
  ), [result, search, filteredDoctors.length]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.BG} barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle}>Select Veterinarian</Text>
          <Text style={styles.subHeader}>Choose a doctor for AI review consultation</Text>
        </View>
      </View>

      {/* Doctor List */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <DoctorCard doctor={item} onPress={openDoctor} />
        )}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
      />

      {/* Bottom Sheet Modal */}
      <Modal 
        visible={visible} 
        transparent 
        animationType="none"
        onRequestClose={closeSheet}
      >
        <Pressable style={styles.backdrop} onPress={closeSheet}>
          <View style={styles.backdropTouchArea} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.handle} />
          
          {selectedDoctor && (
            <View style={styles.sheetContent}>
              <Image source={{ uri: selectedDoctor.image }} style={styles.avatar} />
              
              <Text style={styles.docName}>{selectedDoctor.name}</Text>
              <Text style={styles.docSpec}>{selectedDoctor.specialty}</Text>
              
              <View style={styles.docDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="star" size={14} color="#FBBF24" />
                  <Text style={styles.detailText}>
                    {selectedDoctor.rating} ({selectedDoctor.reviewCount} reviews)
                  </Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="briefcase" size={14} color={COLORS.TEXT_SECONDARY} />
                  <Text style={styles.detailText}>{selectedDoctor.experience} experience</Text>
                </View>
              </View>

              <View style={styles.caseBox}>
                <Text style={styles.caseTitle}>Case Summary</Text>
                <Text style={styles.caseText}>
                  Diagnosis: {result?.disease || "Not specified"}
                </Text>
                {result?.symptoms && (
                  <Text style={styles.caseSubtext}>
                    Symptoms: {result.symptoms}
                  </Text>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.btn, isLoading && styles.btnDisabled]} 
                onPress={sendRequest}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Send Consultation Request</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.BG,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  headerTextWrap: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.PRIMARY,
  },

  subHeader: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },

  heroCard: {
    borderRadius: 22,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  heroTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  heroTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },

  heroDesc: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    marginBottom: 8,
  },

  confidenceContainer: {
    marginTop: 4,
  },

  confidenceBar: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },

  confidenceFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },

  confidenceText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
  },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
  },

  resultsCount: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  resultsCountText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
    fontWeight: "500",
  },

  listContent: {
    paddingBottom: 120,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.CARD,
    padding: 14,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  image: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },

  specialty: {
    fontSize: 12,
    color: COLORS.SECONDARY,
    marginBottom: 4,
    fontWeight: "500",
  },

  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  meta: {
    fontSize: 11,
    color: COLORS.TEXT_SECONDARY,
  },

  right: {
    alignItems: "flex-end",
    justifyContent: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 32,
  },

  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.TEXT_PRIMARY,
    marginTop: 16,
    marginBottom: 8,
  },

  emptyStateText: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  backdropTouchArea: {
    flex: 1,
  },

  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: COLORS.CARD,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },

  sheetContent: {
    alignItems: "center",
    padding: 24,
  },

  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: COLORS.PRIMARY,
  },

  docName: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },

  docSpec: {
    fontSize: 14,
    color: COLORS.SECONDARY,
    marginBottom: 12,
    fontWeight: "500",
  },

  docDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },

  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  detailText: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },

  caseBox: {
    backgroundColor: COLORS.BG,
    padding: 16,
    borderRadius: 14,
    width: "100%",
    marginBottom: 20,
  },

  caseTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.PRIMARY,
    marginBottom: 8,
  },

  caseText: {
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },

  caseSubtext: {
    fontSize: 12,
    color: COLORS.TEXT_SECONDARY,
  },

  btn: {
    backgroundColor: COLORS.PRIMARY,
    padding: 16,
    borderRadius: 14,
    width: "100%",
    shadowColor: COLORS.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  btnDisabled: {
    opacity: 0.7,
  },

  btnText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
    fontSize: 15,
  },
});