import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Image,
} from "react-native";
import React, { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { getAllCategories, createCategory } from "../../../../api/categories";
import { getAllRecipes } from "../../../../api/recipes";
import { getImageUrl } from "../../../../api/index";
import { Category } from "../../../../types/Category";
import { Recipe } from "../../../../types/Recipe";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 15;
const ITEM_WIDTH = (width - 40 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

// Icon mapping for categories
const getCategoryIcon = (name: string): string => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes("breakfast")) return "sunny";
  if (lowerName.includes("lunch")) return "restaurant";
  if (lowerName.includes("dinner")) return "moon";
  if (lowerName.includes("dessert") || lowerName.includes("sweet"))
    return "ice-cream";
  if (lowerName.includes("drink") || lowerName.includes("beverage"))
    return "wine";
  if (lowerName.includes("healthy") || lowerName.includes("salad"))
    return "leaf";
  if (lowerName.includes("fast") || lowerName.includes("quick")) return "flash";
  if (lowerName.includes("soup")) return "beaker";
  if (lowerName.includes("meat") || lowerName.includes("chicken"))
    return "nutrition";
  if (lowerName.includes("fish") || lowerName.includes("seafood"))
    return "fish";
  if (lowerName.includes("vegan") || lowerName.includes("vegetarian"))
    return "flower";
  if (lowerName.includes("pasta") || lowerName.includes("italian"))
    return "pizza";
  if (lowerName.includes("asian") || lowerName.includes("chinese"))
    return "flame";
  if (lowerName.includes("mexican")) return "bonfire";
  if (lowerName.includes("snack")) return "cafe";
  return "grid";
};

// Gradient colors for categories
const categoryGradients: string[][] = [
  ["#FF6B6B", "#FF8E8E"],
  ["#4ECDC4", "#6EE7E0"],
  ["#A78BFA", "#C4B5FD"],
  ["#F59E0B", "#FBBF24"],
  ["#EC4899", "#F472B6"],
  ["#10B981", "#34D399"],
  ["#3B82F6", "#60A5FA"],
  ["#8B5CF6", "#A78BFA"],
];

interface CategoryWithCount extends Category {
  recipeCount?: number;
}

type ViewMode = "categories" | "recipes";

const Categories = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [viewMode, setViewMode] = useState<ViewMode>("categories");
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    try {
      const [categoriesData, recipesData] = await Promise.all([
        getAllCategories(),
        getAllRecipes(),
      ]);

      setRecipes(recipesData);

      // Count recipes per category
      const categoriesWithCount = categoriesData.map((category) => {
        const recipeCount = recipesData.filter((recipe) =>
          recipe.category?.some((cat: any) =>
            typeof cat === "string"
              ? cat === category._id
              : cat._id === category._id
          )
        ).length;
        return { ...category, recipeCount };
      });

      setCategories(categoriesWithCount);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }
    setCreating(true);
    try {
      await createCategory(newCategoryName.trim());
      setModalVisible(false);
      setNewCategoryName("");
      fetchData();
      Alert.alert("Success", "Category created successfully!");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create category";
      Alert.alert("Error", msg);
    } finally {
      setCreating(false);
    }
  };

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: CategoryWithCount;
    index: number;
  }) => {
    const gradientColors = categoryGradients[index % categoryGradients.length];

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.cardWrapper}
        onPress={() =>
          router.push(
            `/categories/${item._id}?name=${encodeURIComponent(item.name)}`
          )
        }
      >
        <LinearGradient
          colors={["#00FFFF", "#FF00FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardBorder}
        >
          <View style={styles.innerCard}>
            <View
              style={[
                styles.iconContainer,
                isRTL && { alignItems: "flex-end" },
              ]}
            >
              <LinearGradient
                colors={gradientColors as [string, string]}
                style={styles.iconBackground}
              >
                <Ionicons
                  name={getCategoryIcon(item.name) as any}
                  size={28}
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>

            <View
              style={[
                styles.textContainer,
                isRTL && { alignItems: "flex-end" },
              ]}
            >
              <Text
                style={[styles.categoryName, isRTL && { textAlign: "right" }]}
                numberOfLines={2}
              >
                {item.name}
              </Text>
              <Text style={styles.itemCount}>
                {item.recipeCount || 0} {t("recipes")}
              </Text>
            </View>

            <View
              style={[
                styles.arrowContainer,
                isRTL ? { left: 12, right: undefined } : { right: 12 },
              ]}
            >
              <Ionicons
                name={isRTL ? "chevron-back" : "chevron-forward"}
                size={18}
                color="rgba(255,255,255,0.5)"
              />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    let description = "";
    if (Array.isArray(item.instructions) && item.instructions.length > 0) {
      const firstInstruction = item.instructions[0];
      description =
        typeof firstInstruction === "string" ? firstInstruction : "";
    }

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
            <View style={styles.recipeImageContainer}>
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

            <View style={styles.recipeContent}>
              <View style={isRTL ? { alignItems: "flex-end" } : undefined}>
                <Text style={styles.recipeName} numberOfLines={1}>
                  {String(item.name || "")}
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
                  styles.recipeStats,
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
                  <Ionicons name="eye-outline" size={14} color="#888" />
                  <Text style={styles.statText}>{item.views || 0}</Text>
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
      {/* Background Logo Animation */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 20 },
          isRTL && { flexDirection: "row-reverse" },
        ]}
      >
        <View
          style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}
        >
          <Text style={styles.headerTitle}>{t("recipes")}</Text>
          <Text style={styles.headerSubtitle}>{t("explore_by_type")}</Text>
        </View>
        {viewMode === "categories" && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Toggle Buttons */}
      <View style={styles.toggleContainer}>
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "categories" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("categories")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === "categories" ? "#000" : "#888"}
            />
            <Text
              style={[
                styles.toggleText,
                viewMode === "categories" && styles.toggleTextActive,
              ]}
            >
              Recipes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              viewMode === "recipes" && styles.toggleButtonActive,
            ]}
            onPress={() => setViewMode("recipes")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="restaurant"
              size={18}
              color={viewMode === "recipes" ? "#000" : "#888"}
            />
            <Text
              style={[
                styles.toggleText,
                viewMode === "recipes" && styles.toggleTextActive,
              ]}
            >
              My Recipes
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Category Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="Category Name"
              placeholderTextColor="#666"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateCategory}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.createButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : viewMode === "categories" ? (
        <FlatList
          key="categories-list"
          data={categories}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderCategoryItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
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
              <Ionicons name="grid-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No categories yet</Text>
              <Text style={styles.emptySubText}>
                Create your first category to organize recipes!
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          key="recipes-list"
          data={recipes}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.recipeListContent}
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
              <Text style={styles.emptyText}>No recipes yet</Text>
              <Text style={styles.emptySubText}>
                Start creating delicious recipes!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

export default Categories;

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
    zIndex: 10,
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // Toggle styles
  toggleContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  toggleWrapper: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 15,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleButtonActive: {
    backgroundColor: "#00FFFF",
  },
  toggleText: {
    color: "#888",
    fontSize: 15,
    fontWeight: "600",
  },
  toggleTextActive: {
    color: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: GAP,
  },
  cardWrapper: {
    width: ITEM_WIDTH,
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
    height: 140,
    borderRadius: 18.5,
    backgroundColor: "#1A1A2E",
    padding: 15,
    justifyContent: "space-between",
  },
  iconContainer: {
    alignItems: "flex-start",
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    gap: 4,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  itemCount: {
    fontSize: 12,
    color: "#888",
  },
  arrowContainer: {
    position: "absolute",
    top: 15,
  },
  // Recipe list styles
  recipeListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  recipeCardWrapper: {
    marginBottom: 16,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  recipeCardBorder: {
    borderRadius: 20,
    padding: 1.5,
  },
  recipeInnerCard: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18.5,
    overflow: "hidden",
    flexDirection: "row",
    height: 110,
  },
  recipeImageContainer: {
    width: 110,
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
  recipeContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  recipeName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  recipeDesc: {
    fontSize: 11,
    color: "#AAAAAA",
    lineHeight: 15,
  },
  recipeStats: {
    flexDirection: "row",
    gap: 12,
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  createButton: {
    backgroundColor: "#00FFFF",
  },
  createButtonText: {
    color: "#000000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
