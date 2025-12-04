import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import React, { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import { getAllUsers, getUserById, toggleFollow } from "../../../../api/auth";
import { getImageUrl } from "../../../../api/index";
import { User } from "../../../../types/User";

interface UserWithFollowState extends User {
  isFollowing?: boolean;
}

const Users = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const isRTL = language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserWithFollowState[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      let allUsers: User[] = [];

      if (response && response.data) {
        allUsers = response.data.filter(
          (u: User) => u._id !== currentUser?._id
        );
      } else if (Array.isArray(response)) {
        allUsers = response.filter((u: User) => u._id !== currentUser?._id);
      }

      // Get current user's following list
      let followingIds: string[] = [];
      if (currentUser?._id) {
        const currentUserData = await getUserById(currentUser._id);
        if (currentUserData?.data?.following) {
          followingIds = currentUserData.data.following.map((f: any) =>
            typeof f === "string" ? f : f._id
          );
        }
      }

      // Add isFollowing state to each user
      const usersWithFollowState = allUsers.map((u) => ({
        ...u,
        isFollowing: followingIds.includes(u._id || ""),
      }));

      setUsers(usersWithFollowState);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [currentUser?._id])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleToggleFollow = async (userId: string, e: any) => {
    e.stopPropagation();
    if (followLoadingId) return;

    setFollowLoadingId(userId);
    try {
      const result = await toggleFollow(userId);
      if (result.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId
              ? {
                  ...u,
                  isFollowing: !u.isFollowing,
                  followers: u.isFollowing
                    ? (u.followers || []).slice(0, -1)
                    : [...(u.followers || []), currentUser?._id || ""],
                }
              : u
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle follow", error);
      Alert.alert("Error", "Failed to update follow status.");
    } finally {
      setFollowLoadingId(null);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: UserWithFollowState }) => {
    const displayImage =
      getImageUrl(item.profilePicture) ||
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80";

    const isLoadingFollow = followLoadingId === item._id;

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardWrapper}
        onPress={() => router.push(`/users/${item._id}`)}
      >
        <LinearGradient
          colors={["#00FFFF", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.innerCard}>
            <View style={styles.avatarContainer}>
              <Image source={{ uri: displayImage }} style={styles.avatar} />
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.name || item.username}
              </Text>
              <Text style={styles.userHandle}>@{item.username}</Text>
              <View style={styles.userStatsRow}>
                <Text style={styles.userStatText}>
                  {item.followers?.length || 0} followers
                </Text>
                <Text style={styles.userStatDot}>•</Text>
                <Text style={styles.userStatText}>
                  {item.recipes?.length || 0} recipes
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.followButton,
                item.isFollowing && styles.followingButton,
              ]}
              onPress={(e) => handleToggleFollow(item._id || "", e)}
              disabled={isLoadingFollow}
              activeOpacity={0.8}
            >
              {isLoadingFollow ? (
                <ActivityIndicator
                  size="small"
                  color={item.isFollowing ? "#00FFFF" : "#000"}
                />
              ) : (
                <Text
                  style={[
                    styles.followButtonText,
                    item.isFollowing && styles.followingButtonText,
                  ]}
                >
                  {item.isFollowing ? "Following" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View
        style={[styles.headerTop, isRTL && { flexDirection: "row-reverse" }]}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Discover Chefs</Text>
          <Text style={styles.headerSubtitle}>
            Find and follow amazing recipe creators
          </Text>
        </View>
      </View>

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
          style={[
            styles.searchIcon,
            isRTL ? { marginLeft: 10 } : { marginRight: 10 },
          ]}
        />
        <TextInput
          style={[styles.searchInput, isRTL && { textAlign: "right" }]}
          placeholder="Search users..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <View style={{ height: insets.top + 20 }} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00FFFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="people-outline" size={64} color="#333" />
              </View>
              <Text style={styles.emptyText}>No users found</Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? "Try a different search term"
                  : "Be the first to join the community!"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Users;

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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  searchIcon: {
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  cardWrapper: {
    marginBottom: 16,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  innerCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18.5,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  userHandle: {
    fontSize: 13,
    color: "#00FFFF",
    marginTop: 2,
  },
  userStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  userStatText: {
    fontSize: 11,
    color: "#888",
  },
  userStatDot: {
    color: "#555",
    marginHorizontal: 6,
  },
  followButton: {
    backgroundColor: "#00FFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#00FFFF",
  },
  followButtonText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "bold",
  },
  followingButtonText: {
    color: "#00FFFF",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
  },
  emptySubText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
