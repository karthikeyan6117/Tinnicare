import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { endpoints } from "../constants/api";
import { colors } from "../constants/theme";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import CreateProfileScreen from "../screens/CreateProfileScreen";
import DashboardScreen from "../screens/DashboardScreen";
import SymptomTrackingScreen from "../screens/SymptomTrackingScreen";
import TriggerTrackingScreen from "../screens/TriggerTrackingScreen";
import InsightsScreen from "../screens/InsightsScreen";
import CarePlanScreen from "../screens/CarePlanScreen";
import ProfileScreen from "../screens/ProfileScreen";
import DailyCheckScreen from "../screens/DailyCheckScreen";
import SoundTherapyScreen from "../screens/SoundTherapyScreen";
import ChatbotScreen from "../screens/ChatbotScreen";

type RootStackParamList = {
  Auth: undefined;
  CreateProfile: undefined;
  Main: undefined;
};

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type MainStackParamList = {
  MainTabs: undefined;
  DailyCheck: undefined;
  SoundTherapy: undefined;
  Chatbot: undefined;
};

type MainTabParamList = {
  Dashboard: undefined;
  Symptoms: undefined;
  Triggers: undefined;
  Insights: undefined;
  CarePlan: undefined;
  Profile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: "#fff",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: { paddingBottom: 8, height: 60 },
      }}
    >
      <MainTab.Screen name="Dashboard" component={DashboardScreen} options={{ title: "Home" }} />
      <MainTab.Screen name="Symptoms" component={SymptomTrackingScreen} options={{ title: "Symptoms" }} />
      <MainTab.Screen name="Triggers" component={TriggerTrackingScreen} options={{ title: "Triggers" }} />
      <MainTab.Screen name="Insights" component={InsightsScreen} options={{ title: "Insights" }} />
      <MainTab.Screen name="CarePlan" component={CarePlanScreen} options={{ title: "Care Plan" }} />
      <MainTab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
    </MainTab.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen name="DailyCheck" component={DailyCheckScreen} options={{ headerShown: true, title: "Daily Check-In", headerStyle: { backgroundColor: colors.primary }, headerTintColor: "#fff" }} />
      <MainStack.Screen name="SoundTherapy" component={SoundTherapyScreen} options={{ headerShown: true, title: "Sound Therapy", headerStyle: { backgroundColor: colors.secondary }, headerTintColor: "#fff" }} />
      <MainStack.Screen name="Chatbot" component={ChatbotScreen} options={{ headerShown: true, title: "AI Assistant", headerStyle: { backgroundColor: colors.accent }, headerTintColor: "#fff" }} />
    </MainStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [needsProfile, setNeedsProfile] = useState<boolean | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user) { setNeedsProfile(null); return; }
    if (user.role !== "patient") { setNeedsProfile(false); return; }
    setProfileLoading(true);
    api.get(endpoints.auth.profileStatus).then((r) => {
      setNeedsProfile(!r.data.completed);
    }).catch(() => {
      setNeedsProfile(true);
    }).finally(() => setProfileLoading(false));
  }, [user]);

  if (isLoading || (user && profileLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          needsProfile ? (
            <RootStack.Screen name="CreateProfile" component={CreateProfileScreen} />
          ) : (
            <RootStack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
