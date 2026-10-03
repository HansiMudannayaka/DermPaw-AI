import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

/* AUTH / ENTRY */
import Welcome from "../screens/WelcomeScreen";
import OnBoarding from "../screens/OnboardingScreen";
import SignIn from "../screens/SignInScreen";
import SignUp from "../screens/SignUpScreen";

/* APPS */
import BottomTabs from "../navigation/BottomTabs";
import DoctorBottomTabs from "../navigation/DoctorBottomTabs";
import HomeScreen from "../screens/HomeScreen";

/* SHARED SCREENS */
import ScanScreen from "../screens/ScanScreen";
import ReportsScreen from "../screens/ReportScreen";
import VetAdviceScreen from "../screens/VetAdviceScreen";
import VetAdviceHistoryScreen from "../screens/VetAdviceHistoryScreen";
import GuideCameraScreen from "../screens/GuideCameraScreen";
import ResultScreen from "../screens/ResultScreen";

/* 🐾 OWNER ARTICLES */
import OwnerArticlesScreen from "../screens/OwnerArticlesScreen";
import ArticleDetailsScreen from "../screens/ArticleDetailsScreen";

/* PROFILE */
import OwnerProfileScreen from "../screens/OwnerProfileScreen";
import ManagePetsScreen from "../screens/ManagePetsScreen";
import PetProfileScreen from "../screens/PetProfileScreen";

/* 🐶 DOCTOR FLOW */
import DoctorPetDetailsScreen from "../screens/DoctorPetDetailsScreen";
import DoctorPetProfileScreen from "../screens/DoctorPetProfileScreen";
import SelectDoctorScreen from "../screens/SelectDoctorScreen";
import DoctorHomeScreen from "../screens/DoctorHomeScreen";

/* 💬 CHAT FLOW */
import ChatListScreen from "../screens/ChatListScreen";
import ChatsScreen from "../screens/ChatsScreen";
import PetOwnerChatScreen from "../screens/PetOwnerChatScreen";

/* 🤖 AI FLOW */
import AIResultDetail from "../screens/AIResultDetailScreen";
import AIReviewList from "../screens/AIReviewListScreen";
import AddReviewScreen from "../screens/AddReviewScreen";
import SummaryScreen from "../screens/ReviewSummaryScreen";
import DermPawAIAgent from "../screens/DermPawAIAgentScreen";

/* 🩺 FIND DOCTORS */
import FindDoctorScreen from "../screens/FindDoctorScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false }}
    >
      {/* AUTH */}
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="OnBoarding" component={OnBoarding} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />

      {/* MAIN APPS */}
      <Stack.Screen name="DoctorHome" component={DoctorHomeScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />

      <Stack.Screen name="MainApp" component={BottomTabs} />
      <Stack.Screen name="DoctorApp" component={DoctorBottomTabs} />

      {/* SHARED FLOW */}
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="VetAdvice" component={VetAdviceScreen} />
      <Stack.Screen
        name="VetAdviceHistory"
        component={VetAdviceHistoryScreen}
      />
      <Stack.Screen name="GuideCamera" component={GuideCameraScreen} />
      <Stack.Screen name="Results" component={ResultScreen} />

      {/* 🐾 OWNER ARTICLES */}
      <Stack.Screen
        name="OwnerArticles"
        component={OwnerArticlesScreen}
      />
      <Stack.Screen
        name="ArticleDetailsScreen"
        component={ArticleDetailsScreen}
      />

      {/* PROFILE */}
      <Stack.Screen
        name="OwnerProfile"
        component={OwnerProfileScreen}
      />
      <Stack.Screen
        name="ManagePets"
        component={ManagePetsScreen}
      />
      <Stack.Screen
        name="PetProfile"
        component={PetProfileScreen}
      />

      {/* 🐶 DOCTOR FLOW */}
      <Stack.Screen
        name="DoctorPetDetails"
        component={DoctorPetDetailsScreen}
      />
      <Stack.Screen
        name="DoctorPetProfile"
        component={DoctorPetProfileScreen}
      />
      <Stack.Screen
        name="SelectDoctor"
        component={SelectDoctorScreen}
      />

      {/* 💬 CHAT FLOW */}
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
      />
      <Stack.Screen
        name="ChatsScreen"
        component={ChatsScreen}
      />

      {/* 🤖 AI FLOW */}
      <Stack.Screen
        name="AIResultDetail"
        component={AIResultDetail}
      />
      <Stack.Screen
        name="AIReviewList"
        component={AIReviewList}
      />
      <Stack.Screen
        name="AddReview"
        component={AddReviewScreen}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
      />
      <Stack.Screen
        name="DermPawAIAgent"
        component={DermPawAIAgent}
      />

      {/* 🩺 FIND DOCTORS */}
      <Stack.Screen
        name="FindDoctorScreen"
        component={FindDoctorScreen}
      />
      <Stack.Screen
        name="PetOwnerChatScreen"
        component={PetOwnerChatScreen}
      />
    </Stack.Navigator>
  );
}