import React, { useRef } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

/* DOCTOR SCREENS */
import DoctorHomeScreen from "../screens/DoctorHomeScreen";
import ChatsScreen from "../screens/ChatListScreen";
import AIReviewListScreen from "../screens/AIReviewListScreen";
import DoctorProfileScreen from "../screens/DoctorProfileScreen";

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get("window");

const TAB_WIDTH = width / 4;

export default function DoctorBottomTabs() {
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
        {/* 🔥 GLOW RING */}
        {focused && <View style={styles.glowRing} />}

        {/* ICON */}
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
            if (route.name === "Chats") iconName = "chatbubble-ellipses";
            if (route.name === "Reviews") iconName = "document-text";
            if (route.name === "Profile") iconName = "person";

            return <Icon name={iconName} focused={focused} />;
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={DoctorHomeScreen}
          listeners={{ tabPress: () => move(0) }}
        />

        <Tab.Screen
          name="Chats"
          component={ChatsScreen}
          listeners={{ tabPress: () => move(1) }}
        />

        <Tab.Screen
          name="Reviews"
          component={AIReviewListScreen}
          listeners={{ tabPress: () => move(2) }}
        />

        <Tab.Screen
          name="Profile"
          component={DoctorProfileScreen}
          listeners={{ tabPress: () => move(3) }}
        />
      </Tab.Navigator>

      {/* 🔥 MOVING PILL */}
      <Animated.View
        style={[
          styles.pill,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

/* ================= STYLES (UNCHANGED) ================= */

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