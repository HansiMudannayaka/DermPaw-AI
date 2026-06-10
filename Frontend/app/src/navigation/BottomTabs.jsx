import React, { useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* SCREENS */
import HomeScreen from "../screens/HomeScreen";
import ScanScreen from "../screens/ScanScreen";
import ReportScreen from "../screens/ReportScreen";

/* 🔥 CHANGE HERE */
import PetProfileScreen from "../screens/PetProfileScreen";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

const TAB_WIDTH = width / 4;

export default function BottomTabs() {
  const translateX = useRef(new Animated.Value(0)).current;

  const move = (index) => {
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      useNativeDriver: true,
    }).start();
  };

  const Icon = ({ name, focused }) => {
    return (
      <View style={styles.iconWrapper}>
        {focused && <View style={styles.glowRing} />}

        <Ionicons
          name={name}
          size={22}
          color={focused ? "#fff" : "#aaa"}
        />
      </View>
    );
  };

  return (
    <View style={styles.wrapper}>

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,

          tabBarIcon: ({ focused }) => {
            let iconName = "";

            if (route.name === "Home") iconName = "home";
            if (route.name === "Scan") iconName = "scan";
            if (route.name === "Reports") iconName = "document-text";
            if (route.name === "Profile") iconName = "person";

            return <Icon name={iconName} focused={focused} />;
          },
        })}
      >

        <Tab.Screen
          name="Home"
          component={HomeScreen}
          listeners={{ tabPress: () => move(0) }}
        />

        <Tab.Screen
          name="Scan"
          component={ScanScreen}
          listeners={{ tabPress: () => move(1) }}
        />

        <Tab.Screen
          name="Reports"
          component={ReportScreen}
          listeners={{ tabPress: () => move(2) }}
        />

        {/* 🔥 THIS NOW OPENS PET PROFILE */}
        <Tab.Screen
          name="Profile"
          component={PetProfileScreen}
          listeners={{ tabPress: () => move(3) }}
        />

      </Tab.Navigator>

      <Animated.View
        style={[
          styles.pill,
          { transform: [{ translateX }] },
        ]}
      />

    </View>
  );
}
/* ================= STYLES ================= */

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },

  tabBar: {
    position: "absolute",
    height: 80,
    borderRadius: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },

  /* ICON WRAPPER */
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
    
  },

  /* 🔥 GLOW EFFECT */
  glowRing: {
    position: "absolute",
    width: 90,
    height: 55,
    borderRadius: 40,
    backgroundColor: "#4B0082", // soft purple glow
  

    elevation: 8,
  },

 
});