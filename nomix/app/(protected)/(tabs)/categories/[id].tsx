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
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { getRecipesByCategory } from "../../../../api/recipes";
import { getImageUrl } from "../../../../api/index";
import { Recipe } from "../../../../types/Recipe";

const CategoryRecipes = () => {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name: string }>();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    let description = "";
    if (Array.isArray(item.instructions) && item.instructions.length > 0) {
      description = item.instructions[0];
    }

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.cardWrapper}
        onPress={() => router.push(`/recipes/${item._id}`)}
      >
        <LinearGradient
          colors={["#00FFFF", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.innerCard}>
            <View style={styles.imageContainer}>
              <Image
                source={{
                  uri:
                    getImageUrl(item.image) ||
                    "https://via.placeholder.com/150",
                }}
                style={styles.recipeImage}
              />
              {item.calories && (
                <View style={styles.calorieBadge}>
                  <Ionicons name="flame" size={12} color="#FFD700" />
                  <Text style={styles.calorieText}>{item.calories}</Text>
                </View>
              )}
            </View>

            <View style={styles.cardContent}>
              <View style={isRTL && { alignItems: "flex-end" }}>
                <Text style={styles.recipeName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text
                  style={[styles.recipeDesc, isRTL && { textAlign: "right" }]}
                  numberOfLines={2}
                >
                  {description || "No description"}
                </Text>
              </View>

              <View
                style={[
                  styles.statsRow,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <View style={styles.statItem}>
                  <Ionicons
                    name={
                      (item.likes?.length ?? 0) > 0 ? "heart" : "heart-outline"
                    }
                    size={14}
                    color={(item.likes?.length ?? 0) > 0 ? "#FF0055" : "#888"}
                  />
                  <Text style={styles.statText}>{item.likes?.length || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble-outline" size={14} color="#888" />
                  <Text style={styles.statText}>
                    {item.comments?.length || 0}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const categoryName = name ? decodeURIComponent(name) : "Category";

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
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
        <View style={styles.headerTitleContainer}>
          <Ionicons name="grid" size={20} color="#00FFFF" />
          <Text style={styles.headerTitle} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Recipe Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} found
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item._id}
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
              <View style={styles.emptyIconContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#333" />
              </View>
              <Text style={styles.emptyText}>No recipes in this category</Text>
              <Text style={styles.emptySubText}>
                Be the first to add a recipe here!
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/recipes/add")}
              >
                <LinearGradient
                  colors={["#00FFFF", "#FF00FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addButtonGradient}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addButtonText}>Add Recipe</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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
    opacity: 0.1,
    zIndex: 0,
    transform: [{ scale: 1.5 }],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  countText: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
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
    overflow: "hidden",
    flexDirection: "row",
    height: 120,
  },
  imageContainer: {
    width: 120,
    height: "100%",
    position: "relative",
  },
  recipeImage: {
    width: "100%",
    height: "100%",
  },
  calorieBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  calorieText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  recipeName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 12,
    color: "#AAAAAA",
    lineHeight: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#888",
    fontSize: 12,
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
  addButton: {
    marginTop: 25,
  },
  addButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
