import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Animated,
  TextInput,
  Image,
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getAllRecipesAdmin,
  adminDeleteRecipe,
  getReportsForRecipe,
} from "../../../api/recipes";
import { getAllReports, Report } from "../../../api/reports";
import { getImageUrl } from "../../../api/index";
import { Recipe } from "../../../types/Recipe";
import Logo from "../../../components/Logo";

// Custom Alert Component
interface CustomAlertProps {
  visible: boolean;
  type: "success" | "error" | "confirm" | "info";
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.5);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return {
          icon: "checkmark-circle",
          color: "#00FF88",
          bgColor: "rgba(0, 255, 136, 0.2)",
        };
      case "error":
        return {
          icon: "alert-circle",
          color: "#FF0055",
          bgColor: "rgba(255, 0, 85, 0.2)",
        };
      case "confirm":
        return {
          icon: "help-circle",
          color: "#FFD700",
          bgColor: "rgba(255, 215, 0, 0.2)",
        };
      default:
        return {
          icon: "information-circle",
          color: "#00FFFF",
          bgColor: "rgba(0, 255, 255, 0.2)",
        };
    }
  };

  const { icon, color, bgColor } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={alertStyles.overlay}>
        <Animated.View
          style={[
            alertStyles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[bgColor, "rgba(26, 26, 46, 0.95)"]}
            style={alertStyles.gradient}
          >
            <View
              style={[alertStyles.iconContainer, { backgroundColor: bgColor }]}
            >
              <Ionicons name={icon as any} size={40} color={color} />
            </View>
            <Text style={[alertStyles.title, { color }]}>{title}</Text>
            <Text style={alertStyles.message}>{message}</Text>
            <View style={alertStyles.buttonRow}>
              {type === "confirm" ? (
                <>
                  <TouchableOpacity
                    style={alertStyles.cancelButton}
                    onPress={onClose}
                    disabled={loading}
                  >
                    <Text style={alertStyles.cancelButtonText}>
                      {cancelText}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      alertStyles.confirmButton,
                      { backgroundColor: color },
                    ]}
                    onPress={onConfirm}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={alertStyles.confirmButtonText}>
                        {confirmText}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[alertStyles.okButton, { backgroundColor: color }]}
                  onPress={onClose}
                >
                  <Text style={alertStyles.okButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
  okButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  okButtonText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
  },
});

// Recipe Reports Modal
interface RecipeReportsModalProps {
  visible: boolean;
  recipe: Recipe | null;
  reports: Report[];
  onClose: () => void;
}

const RecipeReportsModal: React.FC<RecipeReportsModalProps> = ({
  visible,
  recipe,
  reports,
  onClose,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFD700";
      case "reviewed":
        return "#00FFFF";
      case "resolved":
        return "#00FF88";
      case "dismissed":
        return "#888";
      default:
        return "#888";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={reportsModalStyles.overlay}>
        <View style={reportsModalStyles.container}>
          <LinearGradient
            colors={["rgba(255, 0, 255, 0.1)", "#1A1A2E"]}
            style={reportsModalStyles.gradient}
          >
            {/* Header */}
            <View style={reportsModalStyles.header}>
              <View style={reportsModalStyles.headerLeft}>
                <Ionicons name="flag" size={24} color="#FF0055" />
                <Text style={reportsModalStyles.title} numberOfLines={1}>
                  Reports: {recipe?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Reports List */}
            {reports.length > 0 ? (
              <FlatList
                data={reports}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={reportsModalStyles.reportItem}>
                    <View style={reportsModalStyles.reportHeader}>
                      <Text style={reportsModalStyles.reportReason}>
                        {item.reason}
                      </Text>
                      <View
                        style={[
                          reportsModalStyles.statusBadge,
                          {
                            backgroundColor: `${getStatusColor(item.status)}20`,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            reportsModalStyles.statusText,
                            { color: getStatusColor(item.status) },
                          ]}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                    <Text style={reportsModalStyles.reporterText}>
                      By: @
                      {item.reporter && typeof item.reporter === "object"
                        ? item.reporter.username || "Unknown"
                        : "Unknown"}
                    </Text>
                    {item.description && (
                      <Text style={reportsModalStyles.description}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={reportsModalStyles.date}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <View style={reportsModalStyles.emptyContainer}>
                <Ionicons name="checkmark-circle" size={48} color="#00FF88" />
                <Text style={reportsModalStyles.emptyText}>
                  No reports for this recipe
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const reportsModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  container: {
    maxHeight: "70%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    padding: 20,
    minHeight: 300,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
  },
  reportItem: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.2)",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  reportReason: {
    color: "#FF0055",
    fontSize: 14,
    fontWeight: "600",
  },
  reporterText: {
    color: "#00FFFF",
    fontSize: 12,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  description: {
    color: "#AAAAAA",
    fontSize: 13,
    marginBottom: 8,
  },
  date: {
    color: "#666",
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: "#00FF88",
    fontSize: 14,
    marginTop: 10,
  },
});

// Main Component
const AdminRecipes = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "reported" | "popular">("all");

  // Modal States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm">(
    "success"
  );
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertConfirmAction, setAlertConfirmAction] = useState<() => void>(
    () => {}
  );
  const [alertConfirmText, setAlertConfirmText] = useState("Confirm");
  const [actionLoading, setActionLoading] = useState(false);

  const [reportsModalVisible, setReportsModalVisible] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeReports, setRecipeReports] = useState<Report[]>([]);

  const showAlert = (
    type: "success" | "error" | "confirm",
    title: string,
    message: string,
    onConfirm?: () => void,
    confirmText?: string
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    if (onConfirm) {
      setAlertConfirmAction(() => onConfirm);
    }
    if (confirmText) {
      setAlertConfirmText(confirmText);
    }
    setAlertVisible(true);
  };

  const fetchData = async () => {
    try {
      const [recipesRes, reportsRes] = await Promise.all([
        getAllRecipesAdmin(), // Uses admin endpoint to get ALL recipes
        getAllReports(),
      ]);

      setRecipes(recipesRes?.data || []);
      setAllReports(reportsRes || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
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

  const getReportsCountForRecipe = (recipeId: string) => {
    return allReports.filter(
      (report) =>
        report.targetType === "recipe" &&
        (typeof report.targetId === "string"
          ? report.targetId === recipeId
          : report.targetId?._id === recipeId)
    ).length;
  };

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch = recipe.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "reported") {
      const reportsCount = getReportsCountForRecipe(recipe._id);
      return matchesSearch && reportsCount > 0;
    }
    if (filter === "popular") {
      return matchesSearch && (recipe.likes?.length || 0) > 5;
    }

    return matchesSearch;
  });

  // Sort by reports count for "reported" filter
  const sortedRecipes =
    filter === "reported"
      ? [...filteredRecipes].sort((a, b) => {
          const aReports = getReportsCountForRecipe(a._id);
          const bReports = getReportsCountForRecipe(b._id);
          return bReports - aReports;
        })
      : filteredRecipes;

  const handleViewReports = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setReportsModalVisible(true);

    try {
      // Fetch reports using the dedicated admin endpoint
      const result = await getReportsForRecipe(recipe._id);
      setRecipeReports(result.data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setRecipeReports([]);
    }
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    showAlert(
      "confirm",
      "Delete Recipe",
      `Are you sure you want to delete "${recipe.name}"? This action cannot be undone.`,
      async () => {
        setActionLoading(true);
        try {
          await adminDeleteRecipe(recipe._id); // Uses admin delete endpoint
          setRecipes((prev) => prev.filter((r) => r._id !== recipe._id));

          setAlertVisible(false);
          setTimeout(() => {
            showAlert(
              "success",
              "Deleted",
              "Recipe has been deleted successfully"
            );
          }, 300);
        } catch (error) {
          setAlertVisible(false);
          setTimeout(() => {
            showAlert("error", "Error", "Failed to delete recipe");
          }, 300);
        } finally {
          setActionLoading(false);
        }
      },
      "Delete"
    );
  };

  const handleViewRecipe = (recipe: Recipe) => {
    router.push(`/recipes/${recipe._id}`);
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const mainImage =
      item.images && item.images.length > 0 ? item.images[0] : item.image;
    const imageUrl = mainImage ? getImageUrl(mainImage) : null;
    const reportsCount = getReportsCountForRecipe(item._id);
    const authorName =
      item.userId && typeof item.userId === "object"
        ? item.userId.username
        : "Unknown";

    return (
      <View style={styles.recipeCard}>
        <LinearGradient
          colors={[
            reportsCount > 0
              ? "rgba(255, 0, 85, 0.1)"
              : "rgba(255, 0, 255, 0.05)",
            "rgba(26, 26, 46, 0.8)",
          ]}
          style={styles.recipeCardGradient}
        >
          {/* Recipe Info Row */}
          <TouchableOpacity
            style={styles.recipeInfoRow}
            onPress={() => handleViewRecipe(item)}
            activeOpacity={0.8}
          >
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.recipeImage} />
            ) : (
              <View style={styles.recipeImagePlaceholder}>
                <Ionicons name="restaurant" size={24} color="#666" />
              </View>
            )}

            <View style={styles.recipeDetails}>
              <Text style={styles.recipeName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.authorText}>by @{authorName}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="heart" size={12} color="#FF0055" />
                  <Text style={styles.statText}>{item.likes?.length || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="eye" size={12} color="#00FFFF" />
                  <Text style={styles.statText}>{item.views || 0}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="chatbubble" size={12} color="#FFD700" />
                  <Text style={styles.statText}>
                    {item.comments?.length || 0}
                  </Text>
                </View>
                {reportsCount > 0 && (
                  <View style={styles.reportBadge}>
                    <Ionicons name="flag" size={10} color="#FF0055" />
                    <Text style={styles.reportBadgeText}>{reportsCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Actions Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.viewBtn]}
              onPress={() => handleViewRecipe(item)}
            >
              <Ionicons name="eye-outline" size={16} color="#00FFFF" />
              <Text style={[styles.actionBtnText, { color: "#00FFFF" }]}>
                View
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.reportsBtn]}
              onPress={() => handleViewReports(item)}
            >
              <Ionicons name="flag-outline" size={16} color="#FF0055" />
              <Text style={[styles.actionBtnText, { color: "#FF0055" }]}>
                Reports {reportsCount > 0 && `(${reportsCount})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDeleteRecipe(item)}
            >
              <Ionicons name="trash-outline" size={16} color="#FF0055" />
              <Text style={[styles.actionBtnText, { color: "#FF0055" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
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
        <View style={styles.headerRow}>
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
          <View style={styles.headerCenter}>
            <Ionicons name="restaurant" size={24} color="#FF00FF" />
            <Text style={styles.headerTitle}>Manage Recipes</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
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

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(["all", "reported", "popular"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f && styles.filterTextActive,
                ]}
              >
                {f === "all"
                  ? "All"
                  : f === "reported"
                  ? "Reported"
                  : "Popular"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF00FF" />
        </View>
      ) : (
        <FlatList
          data={sortedRecipes}
          keyExtractor={(item) => item._id}
          renderItem={renderRecipeItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF00FF"
              colors={["#FF00FF"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No recipes found</Text>
            </View>
          }
        />
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => {
          setAlertVisible(false);
        }}
        onConfirm={alertType === "confirm" ? alertConfirmAction : undefined}
        confirmText={alertConfirmText}
        loading={actionLoading}
      />

      {/* Recipe Reports Modal */}
      <RecipeReportsModal
        visible={reportsModalVisible}
        recipe={selectedRecipe}
        reports={recipeReports}
        onClose={() => {
          setReportsModalVisible(false);
          setSelectedRecipe(null);
          setRecipeReports([]);
        }}
      />
    </View>
  );
};

export default AdminRecipes;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    borderBottomColor: "rgba(255, 0, 255, 0.2)",
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
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  filterTabActive: {
    backgroundColor: "rgba(255, 0, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#FF00FF",
  },
  filterText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FF00FF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  recipeCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  recipeCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 255, 0.2)",
  },
  recipeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  recipeImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  recipeDetails: {
    flex: 1,
    marginLeft: 14,
  },
  recipeName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  authorText: {
    color: "#00FFFF",
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
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
  reportBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportBadgeText: {
    color: "#FF0055",
    fontSize: 10,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  viewBtn: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  reportsBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  deleteBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 15,
  },
});
