import { StyleSheet, Platform, Image, View } from "react-native";
import React, { useEffect } from "react";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#050510",
          borderTopColor: "rgba(0, 255, 255, 0.3)",
          height: 75 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#00FFFF",
        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              {focused && (
                <LinearGradient
                  colors={["rgba(0, 255, 255, 0.4)", "rgba(138, 43, 226, 0.3)"]}
                  style={styles.activeGlow}
                />
              )}
              <View
                style={[styles.iconCircle, focused && styles.iconCircleActive]}
              >
                <Image
                  source={require("../../../assets/nomix-home.png")}
                  style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}
                />
              </View>
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              {focused && (
                <LinearGradient
                  colors={["rgba(0, 255, 255, 0.4)", "rgba(138, 43, 226, 0.3)"]}
                  style={styles.activeGlow}
                />
              )}
              <View
                style={[styles.iconCircle, focused && styles.iconCircleActive]}
              >
                <Image
                  source={require("../../../assets/nomix-recipes.png")}
                  style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}
                />
              </View>
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              {focused && (
                <LinearGradient
                  colors={["rgba(0, 255, 255, 0.4)", "rgba(138, 43, 226, 0.3)"]}
                  style={styles.activeGlow}
                />
              )}
              <View
                style={[styles.iconCircle, focused && styles.iconCircleActive]}
              >
                <Image
                  source={require("../../../assets/nomix-users.png")}
                  style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}
                />
              </View>
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              {focused && (
                <LinearGradient
                  colors={["rgba(0, 255, 255, 0.4)", "rgba(138, 43, 226, 0.3)"]}
                  style={styles.activeGlow}
                />
              )}
              <View
                style={[styles.iconCircle, focused && styles.iconCircleActive]}
              >
                <Image
                  source={require("../../../assets/nomix-profile.png")}
                  style={[styles.tabIcon, { opacity: focused ? 1 : 0.6 }]}
                />
              </View>
              {focused && <View style={styles.activeIndicator} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 70,
    height: 65,
    position: "relative",
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  iconCircleActive: {
    backgroundColor: "rgba(0, 255, 255, 0.15)",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.5)",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  tabIcon: {
    width: 48,
    height: 48,
    borderRadius: 25,
  },
  activeGlow: {
    position: "absolute",
    width: 75,
    height: 75,
    borderRadius: 38,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00FFFF",
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },
});
