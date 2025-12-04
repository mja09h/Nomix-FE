import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import { getUserById, toggleFollow } from "../../../../api/auth";
import { getAllRecipes } from "../../../../api/recipes";
import { getImageUrl } from "../../../../api/index";
import { User } from "../../../../types/User";
import { Recipe } from "../../../../types/Recipe";
import Logo from "../../../../components/Logo";
import ReportModal from "../../../../components/ReportModal";

const UserProfile = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const isRTL = language === "ar";

  const [user, setUser] = useState<User | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const isOwnProfile = currentUser?._id === id;

  const fetchUserData = async () => {
    if (!id) return;
    try {
      const [userResponse, allRecipes] = await Promise.all([
        getUserById(id),
        getAllRecipes(),
      ]);

      if (userResponse && userResponse.success) {
        setUser(userResponse.data);
      } else if (userResponse && userResponse.data) {
        setUser(userResponse.data);
      }

      // Filter recipes by this user
      const userRecipes = allRecipes.filter(
        (recipe: Recipe) =>
          recipe.userId &&
          (typeof recipe.userId === "string"
            ? recipe.userId === id
            : recipe.userId._id === id)
      );
      setRecipes(userRecipes);

      // Check if current user is following this user
      if (currentUser?._id && currentUser._id !== id) {
        const currentUserResponse = await getUserById(currentUser._id);
        if (currentUserResponse?.data?.following) {
          const followingIds = currentUserResponse.data.following.map(
            (f: any) => (typeof f === "string" ? f : f._id)
          );
          setIsFollowing(followingIds.includes(id));
        }
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [id, currentUser?._id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleToggleFollow = async () => {
    if (!id || followLoading || isOwnProfile) return;
    setFollowLoading(true);
    try {
      const result = await toggleFollow(id);
      if (result.success) {
        setIsFollowing(!isFollowing);
        // Update follower count locally
        if (user) {
          const newFollowersCount = isFollowing
            ? (user.followers?.length || 1) - 1
            : (user.followers?.length || 0) + 1;
          setUser({
            ...user,
            followers: Array(newFollowersCount).fill(""),
          });
        }
      }
    } catch (error) {
      console.error("Failed to toggle follow", error);
      Alert.alert("Error", "Failed to update follow status. Please try again.");
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#00FFFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <Ionicons name="alert-circle-outline" size={64} color="#FF0055" />
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayImage =
    getImageUrl(user.profilePicture) ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        {!isOwnProfile ? (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => setShowReportModal(true)}
          >
            <Ionicons name="flag" size={20} color="#FF0055" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00FFFF"
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarWrapper}>
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              <View style={styles.avatarInner}>
                <Image source={{ uri: displayImage }} style={styles.avatar} />
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.userName}>{user.name || user.username}</Text>
          <Text style={styles.userHandle}>@{user.username}</Text>

          {user.bio && <Text style={styles.userBio}>{user.bio}</Text>}

          {/* Follow Button */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[
                styles.followButton,
                isFollowing && styles.followingButton,
              ]}
              onPress={handleToggleFollow}
              disabled={followLoading}
              activeOpacity={0.8}
            >
              {followLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFollowing ? "#00FFFF" : "#000"}
                />
              ) : (
                <>
                  <Ionicons
                    name={isFollowing ? "checkmark" : "person-add"}
                    size={18}
                    color={isFollowing ? "#00FFFF" : "#000"}
                  />
                  <Text
                    style={[
                      styles.followButtonText,
                      isFollowing && styles.followingButtonText,
                    ]}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{recipes.length}</Text>
              <Text style={styles.statLabel}>Recipes</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {user.followers?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>
                {user.following?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Recipes Section */}
        <View style={styles.recipesSection}>
          <Text style={styles.sectionTitle}>
            {user.name || user.username}'s Recipes
          </Text>

          {recipes.length > 0 ? (
            <View style={styles.recipesGrid}>
              {recipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe._id}
                  activeOpacity={0.9}
                  style={styles.recipeCard}
                  onPress={() => router.push(`/recipes/${recipe._id}`)}
                >
                  <Image
                    source={{
                      uri:
                        getImageUrl(recipe.image) ||
                        "https://via.placeholder.com/150",
                    }}
                    style={styles.recipeImage}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.recipeGradient}
                  >
                    <Text style={styles.recipeName} numberOfLines={1}>
                      {String(recipe.name || "")}
                    </Text>
                    <View style={styles.recipeStats}>
                      <View style={styles.recipeStat}>
                        <Ionicons name="heart" size={12} color="#FF0055" />
                        <Text style={styles.recipeStatText}>
                          {recipe.likes?.length || 0}
                        </Text>
                      </View>
                      <View style={styles.recipeStat}>
                        <Ionicons name="eye" size={12} color="#888" />
                        <Text style={styles.recipeStatText}>
                          {recipe.views || 0}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.noRecipes}>
              <Ionicons name="restaurant-outline" size={48} color="#333" />
              <Text style={styles.noRecipesText}>No recipes yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="user"
        targetId={id || ""}
        targetName={user?.username}
      />
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.1,
    zIndex: 0,
    transform: [{ scale: 1.5 }],
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 18,
    marginTop: 15,
  },
  backLink: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderRadius: 10,
  },
  backLinkText: {
    color: "#00FFFF",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  reportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FF0055",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  avatarWrapper: {
    marginBottom: 15,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInner: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: "#050510",
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  userHandle: {
    fontSize: 16,
    color: "#00FFFF",
    marginTop: 4,
  },
  userBio: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 30,
    lineHeight: 20,
  },
  followButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#00FFFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    minWidth: 140,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#00FFFF",
  },
  followButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "bold",
  },
  followingButtonText: {
    color: "#00FFFF",
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  statBox: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  recipesSection: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#00FFFF",
    marginBottom: 15,
  },
  recipesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  recipeCard: {
    width: "48%",
    height: 150,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  recipeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    paddingTop: 30,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  recipeStats: {
    flexDirection: "row",
    gap: 10,
    marginTop: 5,
  },
  recipeStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  recipeStatText: {
    color: "#FFFFFF",
    fontSize: 11,
  },
  noRecipes: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noRecipesText: {
    color: "#666",
    fontSize: 14,
    marginTop: 10,
  },
});
