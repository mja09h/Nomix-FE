import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import { getUserById } from "../../../../api/auth";
import { getImageUrl } from "../../../../api";
import { User } from "../../../../types/User";
import Logo from "../../../../components/Logo";

const FollowersFollowing = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    tab === "following" ? "following" : "followers"
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Update active tab when param changes
  useEffect(() => {
    if (tab === "following") {
      setActiveTab("following");
    } else if (tab === "followers") {
      setActiveTab("followers");
    }
  }, [tab]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);

  const fetchData = async () => {
    if (!user?._id) return;

    try {
      setLoading(true);
      const userData = await getUserById(user._id);

      console.log("User data response:", userData);

      if (userData && userData.success) {
        const followerData = userData.data.followers || [];
        const followingData = userData.data.following || [];

        console.log("Followers data:", followerData);
        console.log("Following data:", followingData);

        // Check if followers/following are already populated objects or just IDs
        const isFollowersPopulated =
          followerData.length > 0 && typeof followerData[0] === "object";
        const isFollowingPopulated =
          followingData.length > 0 && typeof followingData[0] === "object";

        if (isFollowersPopulated) {
          // Already populated user objects
          setFollowers(followerData as User[]);
        } else {
          // Just IDs, need to fetch user details
          const followerPromises = followerData.map(async (id: string) => {
            try {
              const res = await getUserById(id);
              return res?.success ? res.data : null;
            } catch {
              return null;
            }
          });
          const followerResults = await Promise.all(followerPromises);
          setFollowers(followerResults.filter((u): u is User => u !== null));
        }

        if (isFollowingPopulated) {
          // Already populated user objects
          setFollowing(followingData as User[]);
        } else {
          // Just IDs, need to fetch user details
          const followingPromises = followingData.map(async (id: string) => {
            try {
              const res = await getUserById(id);
              return res?.success ? res.data : null;
            } catch {
              return null;
            }
          });
          const followingResults = await Promise.all(followingPromises);
          setFollowing(followingResults.filter((u): u is User => u !== null));
        }
      }
    } catch (error) {
      console.error("Failed to fetch followers/following:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [user?._id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const filteredUsers =
    activeTab === "followers"
      ? followers.filter((u) =>
          u.username?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : following.filter((u) =>
          u.username?.toLowerCase().includes(searchQuery.toLowerCase())
        );

  const renderUserItem = ({ item }: { item: User }) => {
    const userImage = item.profilePicture || (item as any).image;
    const imageUrl = userImage
      ? userImage.startsWith("http")
        ? userImage
        : getImageUrl(userImage)
      : null;

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.8}
        onPress={() => router.push(`/users/${item._id}`)}
      >
        <LinearGradient
          colors={["rgba(0, 255, 255, 0.1)", "rgba(255, 0, 255, 0.1)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.userCardGradient}
        >
          <View
            style={[
              styles.userCardContent,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {/* Profile Image */}
            <View style={styles.userImageContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.userImage} />
              ) : (
                <View style={styles.userPlaceholder}>
                  <Ionicons name="person" size={28} color="#666" />
                </View>
              )}
            </View>

            {/* User Info */}
            <View
              style={[styles.userInfo, isRTL && { alignItems: "flex-end" }]}
            >
              <Text style={styles.userName}>{item.username || "User"}</Text>
              {item.bio && (
                <Text style={styles.userBio} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
              <View
                style={[
                  styles.userStats,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={styles.userStatItem}>
                  <Ionicons name="people" size={12} color="#00FFFF" />
                  <Text style={styles.userStatText}>
                    {item.followers?.length || 0} followers
                  </Text>
                </View>
              </View>
            </View>

            {/* Arrow */}
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={20}
              color="#666"
            />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View
          style={[styles.headerRow, isRTL && { flexDirection: "row-reverse" }]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isRTL ? "المتابعون" : "Connections"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Toggle Buttons */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTab === "followers" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab("followers")}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "followers" && styles.toggleTextActive,
              ]}
            >
              {isRTL ? "المتابعون" : "Followers"} ({followers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              activeTab === "following" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab("following")}
          >
            <Text
              style={[
                styles.toggleText,
                activeTab === "following" && styles.toggleTextActive,
              ]}
            >
              {isRTL ? "أتابعهم" : "Following"} ({following.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            isRTL && { flexDirection: "row-reverse" },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#888"
            style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
          />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: "right" }]}
            placeholder={isRTL ? "ابحث عن المستخدمين..." : "Search users..."}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
          <Text style={styles.loadingText}>
            {isRTL ? "جاري التحميل..." : "Loading..."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00FFFF"
              colors={["#00FFFF"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name={
                  activeTab === "followers"
                    ? "people-outline"
                    : "person-add-outline"
                }
                size={64}
                color="#333"
              />
              <Text style={styles.emptyText}>
                {activeTab === "followers"
                  ? isRTL
                    ? "لا يوجد متابعون بعد"
                    : "No followers yet"
                  : isRTL
                  ? "لا تتابع أحداً بعد"
                  : "Not following anyone yet"}
              </Text>
              <Text style={styles.emptySubText}>
                {activeTab === "followers"
                  ? isRTL
                    ? "شارك وصفاتك لتحصل على متابعين"
                    : "Share your recipes to get followers"
                  : isRTL
                  ? "اكتشف مستخدمين جدد وتابعهم"
                  : "Discover and follow new users"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default FollowersFollowing;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
  },
  backgroundLogoContainer: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: [{ translateX: -100 }, { translateY: -100 }],
    opacity: 0.05,
    zIndex: -1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 255, 255, 0.1)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#00FFFF",
  },
  toggleText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#00FFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.1)",
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#666",
    marginTop: 10,
    fontSize: 14,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  userCardGradient: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  userCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "rgba(5, 5, 16, 0.8)",
  },
  userImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  userImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  userPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1A1A2E",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfo: {
    flex: 1,
    marginHorizontal: 12,
  },
  userName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 2,
  },
  userBio: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userStatText: {
    color: "#00FFFF",
    fontSize: 11,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    color: "#666",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 15,
  },
  emptySubText: {
    color: "#444",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
