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
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getAllIngredientsAdmin,
  adminDeleteIngredient,
  getReportsForIngredient,
} from "../../../api/ingredients";
import { getAllReports, Report } from "../../../api/reports";
import { Ingredient } from "../../../types/Recipe";
import Logo from "../../../components/Logo";

// Ingredient emoji mapping
const getIngredientEmoji = (name: string): string => {
  const lowerName = name.toLowerCase();
  const emojiMap: { [key: string]: string } = {
    tomato: "🍅",
    potato: "🥔",
    carrot: "🥕",
    onion: "🧅",
    garlic: "🧄",
    pepper: "🌶️",
    corn: "🌽",
    broccoli: "🥦",
    lettuce: "🥬",
    cucumber: "🥒",
    avocado: "🥑",
    eggplant: "🍆",
    mushroom: "🍄",
    peanut: "🥜",
    chestnut: "🌰",
    bread: "🍞",
    croissant: "🥐",
    baguette: "🥖",
    cheese: "🧀",
    egg: "🥚",
    butter: "🧈",
    milk: "🥛",
    honey: "🍯",
    salt: "🧂",
    apple: "🍎",
    pear: "🍐",
    orange: "🍊",
    lemon: "🍋",
    banana: "🍌",
    watermelon: "🍉",
    grape: "🍇",
    strawberry: "🍓",
    blueberry: "🫐",
    melon: "🍈",
    cherry: "🍒",
    peach: "🍑",
    mango: "🥭",
    pineapple: "🍍",
    coconut: "🥥",
    kiwi: "🥝",
    meat: "🥩",
    beef: "🥩",
    steak: "🥩",
    bacon: "🥓",
    chicken: "🍗",
    turkey: "🦃",
    fish: "🐟",
    salmon: "🍣",
    shrimp: "🦐",
    crab: "🦀",
    lobster: "🦞",
    squid: "🦑",
    rice: "🍚",
    pasta: "🍝",
    noodle: "🍜",
    pizza: "🍕",
    burger: "🍔",
    fries: "🍟",
    hotdog: "🌭",
    taco: "🌮",
    burrito: "🌯",
    salad: "🥗",
    soup: "🍲",
    sushi: "🍣",
    chocolate: "🍫",
    candy: "🍬",
    cookie: "🍪",
    cake: "🎂",
    ice: "🧊",
    coffee: "☕",
    tea: "🍵",
    wine: "🍷",
    beer: "🍺",
    water: "💧",
    oil: "🫒",
    olive: "🫒",
    sugar: "🍬",
    flour: "🌾",
    wheat: "🌾",
    herb: "🌿",
    basil: "🌿",
    mint: "🌿",
    parsley: "🌿",
    cilantro: "🌿",
    ginger: "🫚",
    cinnamon: "🪵",
    vanilla: "🌸",
  };

  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key)) {
      return emoji;
    }
  }
  return "🍳";
};

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

// Reports Modal
interface ReportsModalProps {
  visible: boolean;
  ingredient: Ingredient | null;
  reports: Report[];
  onClose: () => void;
}

const ReportsModal: React.FC<ReportsModalProps> = ({
  visible,
  ingredient,
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
            colors={["rgba(255, 215, 0, 0.1)", "#1A1A2E"]}
            style={reportsModalStyles.gradient}
          >
            <View style={reportsModalStyles.header}>
              <View style={reportsModalStyles.headerLeft}>
                <Ionicons name="flag" size={24} color="#FF0055" />
                <Text style={reportsModalStyles.title} numberOfLines={1}>
                  Reports: {ingredient?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

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
                  No reports for this ingredient
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
const AdminIngredients = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "reported">("all");

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
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);
  const [ingredientReports, setIngredientReports] = useState<Report[]>([]);

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
      const [ingredientsRes, reportsRes] = await Promise.all([
        getAllIngredientsAdmin(), // Uses admin endpoint
        getAllReports(),
      ]);

      setIngredients(ingredientsRes?.data || []);
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

  const getReportsCountForIngredient = (ingredientId: string) => {
    return allReports.filter(
      (report) =>
        report.targetType === "ingredient" &&
        (typeof report.targetId === "string"
          ? report.targetId === ingredientId
          : report.targetId?._id === ingredientId)
    ).length;
  };

  const filteredIngredients = ingredients.filter((ingredient) => {
    const matchesSearch = ingredient.name
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "reported") {
      const reportsCount = getReportsCountForIngredient(ingredient._id);
      return matchesSearch && reportsCount > 0;
    }

    return matchesSearch;
  });

  const sortedIngredients =
    filter === "reported"
      ? [...filteredIngredients].sort((a, b) => {
          const aReports = getReportsCountForIngredient(a._id);
          const bReports = getReportsCountForIngredient(b._id);
          return bReports - aReports;
        })
      : filteredIngredients;

  const handleViewReports = async (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setReportsModalVisible(true);

    try {
      // Fetch reports using the dedicated admin endpoint
      const result = await getReportsForIngredient(ingredient._id);
      setIngredientReports(result.data || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
      setIngredientReports([]);
    }
  };

  const handleDeleteIngredient = (ingredient: Ingredient) => {
    showAlert(
      "confirm",
      "Delete Ingredient",
      `Are you sure you want to delete "${ingredient.name}"? This will affect all recipes using this ingredient.`,
      async () => {
        setActionLoading(true);
        try {
          await adminDeleteIngredient(ingredient._id); // Uses admin delete endpoint
          setIngredients((prev) =>
            prev.filter((i) => i._id !== ingredient._id)
          );

          setAlertVisible(false);
          setTimeout(() => {
            showAlert(
              "success",
              "Deleted",
              "Ingredient has been deleted successfully"
            );
          }, 300);
        } catch (error) {
          setAlertVisible(false);
          setTimeout(() => {
            showAlert("error", "Error", "Failed to delete ingredient");
          }, 300);
        } finally {
          setActionLoading(false);
        }
      },
      "Delete"
    );
  };

  const renderIngredientItem = ({ item }: { item: Ingredient }) => {
    const reportsCount = getReportsCountForIngredient(item._id);
    const emoji = getIngredientEmoji(item.name);

    return (
      <View style={styles.ingredientCard}>
        <LinearGradient
          colors={[
            reportsCount > 0
              ? "rgba(255, 0, 85, 0.1)"
              : "rgba(255, 215, 0, 0.05)",
            "rgba(26, 26, 46, 0.8)",
          ]}
          style={styles.ingredientCardGradient}
        >
          <View style={styles.ingredientInfoRow}>
            <View style={styles.emojiContainer}>
              <Text style={styles.emojiText}>{emoji}</Text>
            </View>

            <View style={styles.ingredientDetails}>
              <Text style={styles.ingredientName}>{item.name}</Text>
              {item.quantity && (
                <Text style={styles.quantityText}>{item.quantity}</Text>
              )}
              <View style={styles.statsRow}>
                {reportsCount > 0 && (
                  <View style={styles.reportBadge}>
                    <Ionicons name="flag" size={10} color="#FF0055" />
                    <Text style={styles.reportBadgeText}>{reportsCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.actionsRow}>
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
              onPress={() => handleDeleteIngredient(item)}
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
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

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
            <Ionicons name="leaf" size={24} color="#FFD700" />
            <Text style={styles.headerTitle}>Manage Ingredients</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search ingredients..."
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

        <View style={styles.filterContainer}>
          {(["all", "reported"] as const).map((f) => (
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
                {f === "all" ? "All" : "Reported"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      ) : (
        <FlatList
          data={sortedIngredients}
          keyExtractor={(item) => item._id}
          renderItem={renderIngredientItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFD700"
              colors={["#FFD700"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="leaf-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No ingredients found</Text>
            </View>
          }
        />
      )}

      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
        onConfirm={alertType === "confirm" ? alertConfirmAction : undefined}
        confirmText={alertConfirmText}
        loading={actionLoading}
      />

      <ReportsModal
        visible={reportsModalVisible}
        ingredient={selectedIngredient}
        reports={ingredientReports}
        onClose={() => {
          setReportsModalVisible(false);
          setSelectedIngredient(null);
          setIngredientReports([]);
        }}
      />
    </View>
  );
};

export default AdminIngredients;

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
    borderBottomColor: "rgba(255, 215, 0, 0.2)",
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
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  filterText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FFD700",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  ingredientCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  ingredientCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
  },
  ingredientInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  emojiContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emojiText: {
    fontSize: 24,
  },
  ingredientDetails: {
    flex: 1,
    marginLeft: 14,
  },
  ingredientName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  quantityText: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 6,
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
