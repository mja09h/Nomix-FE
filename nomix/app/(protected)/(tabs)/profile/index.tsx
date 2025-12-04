import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { logout, getUserById } from "../../../../api/auth";
import { getImageUrl } from "../../../../api";
import { useAuth } from "../../../../context/AuthContext";
import { User } from "../../../../types/User";
import { getAllRecipes } from "../../../../api/recipes";

const Profile = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";
  const [logoutVisible, setLogoutVisible] = useState(false);
  const { user, logout: authLogout } = useAuth();
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRecipeCount, setUserRecipeCount] = useState(0);

  const fetchUserData = async () => {
    if (user?._id) {
      setLoading(true);
      try {
        // Fetch user profile data
        const userData = await getUserById(user._id);
        if (userData && userData.success) {
          setProfileData(userData.data);
        } else {
          setProfileData(user as User);
        }

        // Fetch recipes to count user's recipes
        const allRecipes = await getAllRecipes();
        const userRecipes = allRecipes.filter(
          (recipe) =>
            recipe.userId &&
            (typeof recipe.userId === "string"
              ? recipe.userId === user._id
              : recipe.userId._id === user._id)
        );
        setUserRecipeCount(userRecipes.length);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setProfileData(user as User);
      }
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [user?._id])
  );

  const handleLogout = () => {
    setLogoutVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutVisible(false);
    await authLogout();
    router.replace("/(auth)/login");
  };

  const cancelLogout = () => {
    setLogoutVisible(false);
  };

  const menuItems = [
    // Admin Dashboard - only show for admins
    ...(profileData?.isAdmin
      ? [
          {
            icon: "shield-checkmark",
            label: "Admin Dashboard",
            route: "/(protected)/admin",
            color: "#FFD700",
            isAdmin: true,
          },
        ]
      : []),
    {
      icon: "person-outline",
      label: t("edit_profile"),
      route: "/profile/edit",
    },
    {
      icon: "book-outline",
      label: "My Recipes",
      route: "/(protected)/myRecipes",
      color: "#00FFFF",
    },
    {
      icon: "heart-outline",
      label: t("favorites"),
      route: "/profile/favorites",
    },
    {
      icon: "heart",
      label: "Liked Recipes",
      route: "/profile/liked-recipes",
      color: "#FF0055",
    },
    {
      icon: "grid-outline",
      label: "Categories",
      route: "/(protected)/categories-manage",
    },
    {
      icon: "leaf-outline",
      label: "Ingredients",
      route: "/(protected)/ingredients",
    },
    {
      icon: "flag-outline",
      label: "My Reports",
      route: "/profile/my-reports",
      color: "#FF0055",
    },
    {
      icon: "settings-outline",
      label: t("settings.title"),
      route: "/profile/settings",
    },
    {
      icon: "help-circle-outline",
      label: t("help_support"),
      route: "/profile/help",
    },
  ];

  if (loading && !profileData) {
    return (
      <View
        style={[
          styles.root,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  const defaultImage =
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80"; // You can replace this with a local asset if preferred
  const displayImage = getImageUrl(profileData?.profilePicture) || defaultImage;
  const displayName = profileData?.name || profileData?.username || "User";
  const displayHandle = `@${profileData?.username || "user"}`;

  return (
    <View style={styles.root}>
      {/* Background Logo Animation */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Avatar Section */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Image
                  source={{ uri: displayImage }}
                  style={styles.avatarImage}
                  onError={(e) =>
                    console.error(
                      "Profile Image Load Error:",
                      e.nativeEvent.error
                    )
                  }
                />
              </View>
            </LinearGradient>
            <View style={styles.statusBadge} />
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userHandle}>{displayHandle}</Text>
          {profileData?.bio && (
            <Text style={styles.userBio}>{profileData.bio}</Text>
          )}

          {/* Stats Row */}
          <View
            style={[
              styles.statsContainer,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{userRecipeCount}</Text>
              <Text style={styles.statLabel}>{t("recipes")}</Text>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push("/profile/followers" as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>
                {profileData?.followers?.length || 0}
              </Text>
              <Text style={styles.statLabel}>{t("followers")}</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity
              style={styles.statItem}
              onPress={() =>
                router.push("/profile/followers?tab=following" as any)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.statNumber}>
                {profileData?.following?.length || 0}
              </Text>
              <Text style={styles.statLabel}>{t("following")}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Actions */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isRTL && { flexDirection: "row-reverse" },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                if (item.route) {
                  router.push(item.route);
                }
              }}
            >
              <View
                style={[
                  styles.menuItemLeft,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <LinearGradient
                  colors={
                    item.color
                      ? [`${item.color}20`, `${item.color}10`]
                      : ["rgba(0, 255, 255, 0.1)", "rgba(255, 0, 255, 0.1)"]
                  }
                  style={[
                    styles.iconContainer,
                    isRTL && { marginRight: 0, marginLeft: 15 },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={item.color || "#00FFFF"}
                  />
                </LinearGradient>
                <Text style={styles.menuLabel}>{item.label}</Text>
              </View>
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          ))}

          {/* Logout Button */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              styles.logoutItem,
              isRTL && { flexDirection: "row-reverse" },
            ]}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.menuItemLeft,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.iconContainer,
                  styles.logoutIconContainer,
                  isRTL && { marginRight: 0, marginLeft: 15 },
                ]}
              >
                <Ionicons name="log-out-outline" size={22} color="#FF0055" />
              </View>
              <Text style={[styles.menuLabel, styles.logoutLabel]}>
                {t("logout")}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Logout Modal */}
      <Modal
        transparent
        visible={logoutVisible}
        animationType="fade"
        onRequestClose={cancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={["rgba(0, 255, 255, 0.15)", "rgba(255, 0, 255, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalGradient}
            >
              <View style={styles.modalIconContainer}>
                <Ionicons name="log-out-outline" size={28} color="#FF0055" />
              </View>
              <Text style={styles.modalTitle}>{t("logout")}</Text>
              <Text style={styles.modalMessage}>{t("logout_confirm")}</Text>

              <View style={styles.modalButtonsRow}>
                <TouchableOpacity
                  onPress={cancelLogout}
                  activeOpacity={0.8}
                  style={[styles.modalButton, styles.modalCancelButton]}
                >
                  <Text style={styles.modalCancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={confirmLogout}
                  activeOpacity={0.8}
                  style={[styles.modalButton, styles.modalLogoutButton]}
                >
                  <Text style={styles.modalLogoutText}>{t("logout")}</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.15,
    zIndex: 0,
    transform: [{ scale: 1.5 }],
  },
  scrollContent: {
    paddingBottom: 100,
    zIndex: 1,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  avatarContainer: {
    marginBottom: 15,
    position: "relative",
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#050510",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  statusBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#00FF00",
    borderWidth: 3,
    borderColor: "#050510",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    marginBottom: 5,
  },
  userHandle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 20,
  },
  userBio: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: 15,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  menuContainer: {
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    marginBottom: 15,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  menuLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  logoutItem: {
    borderColor: "rgba(255, 0, 85, 0.2)",
    marginTop: 10,
  },
  logoutIconContainer: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  logoutLabel: {
    color: "#FF0055",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(5, 5, 16, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  modalGradient: {
    padding: 20,
  },
  modalIconContainer: {
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 20,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  modalLogoutButton: {
    backgroundColor: "#FF0055",
    shadowColor: "#FF0055",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCancelText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalLogoutText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
