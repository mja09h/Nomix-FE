import { StyleSheet, Platform } from "react-native";
import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  schedulePushNotification,
  cancelAllNotifications,
} from "../../../utils/notifications";
import { getNotificationsEnabled } from "../../../utils/preferences";
import * as Device from "expo-device";

const _layout = () => {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const setupRecurringNotifications = async () => {
      // Don't run this logic on web or emulators if it causes issues, though the utils guard should handle it.
      if (!Device.isDevice && Platform.OS !== "web") {
        // Optional: log that we are skipping recurring setup on simulator
      }

      const enabled = await getNotificationsEnabled();
      if (enabled) {
        // Cancel existing to avoid duplicates
        await cancelAllNotifications();

        // Schedule new recurring notification every 3 minutes (180 seconds)
        await schedulePushNotification(
          "New Recipe Alert!",
          "Check out this new recipe you might like 🍲",
          {},
          { seconds: 180, repeats: true }
        );
      } else {
        await cancelAllNotifications();
      }
    };

    setupRecurringNotifications();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#050510",
          borderTopColor: "rgba(0, 255, 255, 0.3)",
          height: 60 + insets.bottom, // Dynamic height based on safe area
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10, // Adjust padding for safe area
          paddingTop: 10,
        },
        tabBarActiveTintColor: "#00FFFF",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Recipes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;

const styles = StyleSheet.create({});
