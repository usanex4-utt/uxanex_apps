
import React, { useEffect } from "react";

import {
  View,
  Text,
  ActivityIndicator,
} from "react-native";

import {
  NavigationContainer,
  DarkTheme,
} from "@react-navigation/native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import { useDispatch, useSelector } from "react-redux";

// ── Authentication ──────────────────────────────────────────────
import { useAuth } from "../context/AuthContext";

// ── Redux ───────────────────────────────────────────────────────
import { fetchNotifications } from "../store/slices/notificationsSlice";
import { selectUnreadCount } from "../store/selectors";

// ── Auth Screens ───────────────────────────────────────────────
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";

// ── Main Screens ───────────────────────────────────────────────
import HomeScreen from "../screens/main/HomeScreen";
import ReelsScreen from "../screens/main/ReelsScreen";
import SearchScreen from "../screens/main/SearchScreen";
import NotificationsScreen from "../screens/main/NotificationsScreen";
import ProfileScreen from "../screens/main/ProfileScreen";

// ── Detail Screens ─────────────────────────────────────────────
import ChatScreen from "../screens/detail/ChatScreen";
import CoupleChatScreen from "../screens/detail/CoupleChatScreen";
import ReelUploadScreen from "../screens/detail/ReelUploadScreen";
import NexaScreen from "../screens/detail/NexaScreen";

// ── Moment Screens ─────────────────────────────────────────────
import MomentEditorScreen from "../components/moments/MomentEditorScreen";
import MomentArchiveScreen from "../components/moments/MomentArchiveScreen";
import MomentSettingsScreen from "../components/moments/MomentSettingsScreen";

// ── Navigators ─────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Dark Theme ─────────────────────────────────────────────────
const theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#05070b",
    card: "#070a0f",
    border: "#121923",
    primary: "#247cff",
  },
};

// ── Tab Icons ──────────────────────────────────────────────────
const ICONS = {
  Home: ["home", "home-outline"],
  Reels: ["play-circle", "play-circle-outline"],
  Search: ["search", "search-outline"],
  Alerts: ["notifications", "notifications-outline"],
  Profile: ["person", "person-outline"],
};

// ── Bottom Tab Navigator ───────────────────────────────────────
function Tabs() {
  const dispatch = useDispatch();

  const unreadCount = useSelector(selectUnreadCount);

  // Fetch notifications initially and every 60 seconds.
  useEffect(() => {
    dispatch(fetchNotifications());

    const intervalId = setInterval(() => {
      dispatch(fetchNotifications());
    }, 60000);

    return () => {
      clearInterval(intervalId);
    };
  }, [dispatch]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#247cff",
        tabBarInactiveTintColor: "#687486",

        tabBarStyle: {
          backgroundColor: "#070a0f",
          borderTopColor: "#121923",
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
        },

        tabBarHideOnKeyboard: true,
        lazy: true,

        tabBarIcon: ({ focused, color }) => {
          const icons = ICONS[route.name] || ICONS.Home;

          const iconName = icons[focused ? 0 : 1];

          const icon = (
            <Ionicons
              name={iconName}
              size={22}
              color={color}
            />
          );

          // Notification badge
          if (route.name === "Alerts" && unreadCount > 0) {
            return (
              <View>
                {icon}

                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: "#ff3b5c",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 3,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: "800",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </Text>
                </View>
              </View>
            );
          }

          return icon;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Reels"
        component={ReelsScreen}
      />

      <Tab.Screen
        name="Search"
        component={SearchScreen}
      />

      <Tab.Screen
        name="Alerts"
        component={NotificationsScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ me: true }}
      />
    </Tab.Navigator>
  );
}

// ── Main Navigation ────────────────────────────────────────────
export default function Navigation() {
  const { user, booting } = useAuth();

  // Authentication loading screen
  if (booting) {
    return (
      <View
        className="flex-1 bg-bg items-center justify-center"
        style={{ backgroundColor: "#05070b" }}
      >
        <ActivityIndicator
          size="large"
          color="#247cff"
        />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: "#05070b",
          },
          animation: "slide_from_right",
        }}
      >
        {user ? (
          <>
            {/* Main Tabs */}
            <Stack.Screen
              name="Tabs"
              component={Tabs}
            />

            {/* User Profile */}
            <Stack.Screen
              name="UserProfile"
              component={ProfileScreen}
            />

            {/* Reels */}
            <Stack.Screen
              name="ReelUpload"
              component={ReelUploadScreen}
              options={{
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />

            {/* Chat */}
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
            />

            {/* Couple Chat */}
            <Stack.Screen
              name="CoupleChat"
              component={CoupleChatScreen}
            />

            {/* NEXA AI */}
            <Stack.Screen
              name="Nexa"
              component={NexaScreen}
            />

            {/* Create Moment */}
            <Stack.Screen
              name="MomentCreate"
              component={MomentEditorScreen}
              options={{
                animation: "slide_from_bottom",
                presentation: "modal",
              }}
            />

            {/* Moment Archive */}
            <Stack.Screen
              name="MomentArchive"
              component={MomentArchiveScreen}
            />

            {/* Moment Settings */}
            <Stack.Screen
              name="MomentSettings"
              component={MomentSettingsScreen}
            />
          </>
        ) : (
          <>
            {/* Login */}
            <Stack.Screen
              name="Login"
              component={LoginScreen}
            />

            {/* Register */}
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
            />

            {/* Forgot Password */}
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
