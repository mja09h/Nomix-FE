import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../../context/LanguageContext";
import Logo from "../../components/Logo";
import ReportModal from "../../components/ReportModal";
import {
  getAllIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../../api/ingredients";
import { Ingredient } from "../../types/Recipe";

const IngredientsPage = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(
    null
  );
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportingIngredient, setReportingIngredient] =
    useState<Ingredient | null>(null);

  const fetchIngredients = async () => {
    try {
      const data = await getAllIngredients();
      setIngredients(data || []);
    } catch (error) {
      console.error("Failed to load ingredients", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIngredients();
  };

  const openAddModal = () => {
    setEditingIngredient(null);
    setIngredientName("");
    setIngredientQuantity("");
    setModalVisible(true);
  };

  const openEditModal = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setIngredientName(ingredient.name);
    setIngredientQuantity((ingredient as any).quantity || "");
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!ingredientName.trim()) {
      Alert.alert("Error", "Ingredient name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingIngredient) {
        await updateIngredient(
          editingIngredient._id,
          ingredientName.trim(),
          ingredientQuantity.trim() || undefined
        );
        Alert.alert("Success", "Ingredient updated successfully");
      } else {
        await createIngredient(
          ingredientName.trim(),
          ingredientQuantity.trim() || undefined
        );
        Alert.alert("Success", "Ingredient created successfully");
      }
      setModalVisible(false);
      fetchIngredients();
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to save ingredient";
      Alert.alert("Error", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (ingredient: Ingredient) => {
    Alert.alert(
      "Delete Ingredient",
      `Are you sure you want to delete "${ingredient.name}"? This will remove it from all recipes.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteIngredient(ingredient._id);
              Alert.alert("Success", "Ingredient deleted");
              fetchIngredients();
            } catch (error) {
              Alert.alert("Error", "Failed to delete ingredient");
            }
          },
        },
      ]
    );
  };

  const filteredIngredients = ingredients.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderIngredientItem = ({ item }: { item: Ingredient }) => (
    <View
      style={[styles.ingredientCard, isRTL && { flexDirection: "row-reverse" }]}
    >
      <View
        style={[styles.ingredientInfo, isRTL && { alignItems: "flex-end" }]}
      >
        <Text style={styles.ingredientName}>{item.name}</Text>
        {(item as any).quantity && (
          <Text style={styles.ingredientQuantity}>
            {(item as any).quantity}
          </Text>
        )}
      </View>
      <View style={[styles.actions, isRTL && { flexDirection: "row-reverse" }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={18} color="#00FFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => handleDelete(item)}
        >
          <Ionicons name="trash" size={18} color="#FF0055" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.reportBtn]}
          onPress={() => setReportingIngredient(item)}
        >
          <Ionicons name="flag" size={16} color="#FF0055" />
        </TouchableOpacity>
      </View>
    </View>
  );

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
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ingredients</Text>
        <TouchableOpacity onPress={openAddModal}>
          <LinearGradient colors={["#00FFFF", "#FF00FF"]} style={styles.addBtn}>
            <Ionicons name="add" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBox, isRTL && { flexDirection: "row-reverse" }]}
        >
          <Ionicons
            name="search-outline"
            size={20}
            color="#888"
            style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
          />
          <TextInput
            style={[styles.searchInput, isRTL && { textAlign: "right" }]}
            placeholder="Search ingredients..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <FlatList
          data={filteredIngredients}
          keyExtractor={(item) => item._id}
          renderItem={renderIngredientItem}
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
              <Ionicons name="leaf-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No ingredients found</Text>
              <Text style={styles.emptySubText}>Tap + to add one</Text>
            </View>
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalBorder}
            >
              <View style={styles.modalInner}>
                <Text style={styles.modalTitle}>
                  {editingIngredient ? "Edit Ingredient" : "Add Ingredient"}
                </Text>

                <Text style={styles.modalLabel}>Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={ingredientName}
                  onChangeText={setIngredientName}
                  placeholder="e.g. Chicken Breast"
                  placeholderTextColor="#666"
                />

                <Text style={styles.modalLabel}>
                  Default Quantity (Optional)
                </Text>
                <TextInput
                  style={styles.modalInput}
                  value={ingredientQuantity}
                  onChangeText={setIngredientQuantity}
                  placeholder="e.g. 500g"
                  placeholderTextColor="#666"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleSave}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text style={styles.saveBtnText}>
                        {editingIngredient ? "Update" : "Create"}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      {/* Report Ingredient Modal */}
      <ReportModal
        visible={!!reportingIngredient}
        onClose={() => setReportingIngredient(null)}
        targetType="ingredient"
        targetId={reportingIngredient?._id || ""}
        targetName={reportingIngredient?.name}
      />
    </View>
  );
};

export default IngredientsPage;

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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  ingredientCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  ingredientQuantity: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  reportBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.4)",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    opacity: 0.5,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
  },
  emptySubText: {
    color: "#AAAAAA",
    fontSize: 14,
    marginTop: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 20,
    overflow: "hidden",
  },
  modalBorder: {
    padding: 2,
    borderRadius: 20,
  },
  modalInner: {
    backgroundColor: "#1A1A2E",
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modalLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 15,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 16,
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
  },
  cancelBtnText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  saveBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    backgroundColor: "#00FFFF",
    alignItems: "center",
  },
  saveBtnText: {
    color: "#000000",
    fontWeight: "bold",
  },
});
