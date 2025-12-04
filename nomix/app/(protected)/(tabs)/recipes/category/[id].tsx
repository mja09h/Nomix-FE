import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import Logo from "../../../../../components/Logo";
import ReportModal from "../../../../../components/ReportModal";
import { useLanguage } from "../../../../../context/LanguageContext";
import { getRecipesByCategory } from "../../../../../api/recipes";
import { getImageUrl } from "../../../../../api/index";
import { Recipe } from "../../../../../types/Recipe";

const CategoryRecipes = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const fetchRecipes = async () => {
    if (!id) return;
    try {
      const data = await getRecipesByCategory(id);
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching category recipes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecipes();
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    // Get description (use recipe.description or fallback to first instruction)
    let description = item.description || "";
    if (
      !description &&
      Array.isArray(item.instructions) &&
      item.instructions.length > 0
    ) {
      const firstInstruction = item.instructions[0];
      description =
        typeof firstInstruction === "string" ? firstInstruction : "";
    }

    const authorName =
      item.userId && typeof item.userId === "object"
        ? item.userId.username
        : null;

    // Get main image (first image from images array or fallback to image field)
    const mainImageUrl =
      item.images && item.images.length > 0
        ? getImageUrl(item.images[0])
        : getImageUrl(item.image);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.recipeCardWrapper}
        onPress={() => router.push(`/recipes/${item._id}`)}
      >
        <LinearGradient
          colors={["#00FFFF", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.recipeCardBorder}
        >
          <View style={styles.recipeInnerCard}>
            {/* Large centered main image */}
            <View style={styles.recipeImageContainer}>
              <Image
                source={{
                  uri: mainImageUrl || "https://via.placeholder.com/300",
                }}
                style={styles.recipeImage}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.recipeImageOverlay}
              />
              {item.calories ? (
                <View style={styles.calorieBadge}>
                  <Ionicons name="flame" size={12} color="#FFD700" />
                  <Text style={styles.calorieText}>{item.calories}</Text>
                </View>
              ) : null}
              {/* Image count badge */}
              {item.images && item.images.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <Ionicons name="images" size={12} color="#FFF" />
                  <Text style={styles.imageCountText}>
                    {item.images.length}
                  </Text>
                </View>
              )}
            </View>

            {/* Recipe info below image */}
            <View style={styles.recipeContent}>
              <View style={isRTL ? { alignItems: "flex-end" } : undefined}>
                <Text style={styles.recipeName} numberOfLines={2}>
                  {item.name}
                </Text>
                {description && (
                  <Text
                    style={[
                      styles.recipeDescription,
                      isRTL && { textAlign: "right" },
                    ]}
                    numberOfLines={2}
                  >
                    {description}
                  </Text>
                )}
                {authorName && (
                  <Text style={styles.authorText}>by @{authorName}</Text>
                )}
              </View>

              <View
                style={[
                  styles.socialRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={styles.socialItem}>
                  <Ionicons
                    name={
                      (item.likes?.length ?? 0) > 0 ? "heart" : "heart-outline"
                    }
                    size={14}
                    color={(item.likes?.length ?? 0) > 0 ? "#FF0055" : "#888"}
                  />
                  <Text
                    style={[
                      styles.socialText,
                      (item.likes?.length ?? 0) > 0 && styles.socialTextLiked,
                    ]}
                  >
                    {item.likes?.length || 0}
                  </Text>
                </View>
                <View style={styles.socialItem}>
                  <Ionicons name="chatbubble-outline" size={14} color="#888" />
                  <Text style={styles.socialText}>
                    {item.comments?.length || 0}
                  </Text>
                </View>
                <View style={styles.socialItem}>
                  <Ionicons name="eye-outline" size={14} color="#888" />
                  <Text style={styles.socialText}>{item.views || 0}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {name || "Category"}
          </Text>
          <Text style={styles.headerSubtitle}>
            {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => setShowReportModal(true)}
        >
          <Ionicons name="flag" size={18} color="#FF0055" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.listContent}
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
              <Ionicons name="restaurant-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No recipes in this category</Text>
              <Text style={styles.emptySubText}>
                Be the first to add a recipe here!
              </Text>
            </View>
          }
        />
      )}

      {/* Report Category Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="category"
        targetId={id || ""}
        targetName={name || "Category"}
      />
    </View>
  );
};

export default CategoryRecipes;

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
  header: {
    flexDirection: "row",
    alignItems: "center",
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 2,
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
  // Recipe Card Styles - matching All Recipes
  recipeCardWrapper: {
    marginBottom: 20,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  recipeCardBorder: {
    borderRadius: 24,
    padding: 2,
  },
  recipeInnerCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 22,
    overflow: "hidden",
    flexDirection: "column",
  },
  recipeImageContainer: {
    width: "100%",
    height: 180,
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  recipeImageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  imageCountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  imageCountText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "600",
  },
  calorieBadge: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  calorieText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  recipeContent: {
    padding: 14,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 22,
  },
  recipeDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 4,
    lineHeight: 16,
  },
  authorText: {
    fontSize: 11,
    color: "#00FFFF",
    marginBottom: 2,
  },
  socialRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 10,
  },
  socialItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  socialText: {
    color: "#888",
    fontSize: 12,
  },
  socialTextLiked: {
    color: "#FF0055",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
