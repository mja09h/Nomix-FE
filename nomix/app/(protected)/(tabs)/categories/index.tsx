import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import client from "../../../../api";
import { Category } from "../../../../types/Category";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 15;
const ITEM_WIDTH = (width - 40 - GAP * (COLUMN_COUNT - 1)) / COLUMN_COUNT;

const Categories = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const {
    data: categories,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const response = await client.get("/categories");
      return response.data as Category[];
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await client.post("/categories", { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setModalVisible(false);
      setNewCategoryName("");
      Alert.alert("Success", "Category created successfully!");
    },
    onError: (error: any) => {
      console.error("Create category error", error);
      Alert.alert("Error", "Failed to create category");
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert("Error", "Category name is required");
      return;
    }
    createCategoryMutation.mutate(newCategoryName);
  };

  // Fallback icons if not provided by backend (just for demo consistency)
  const getIcon = (name: string) => {
    if (name.toLowerCase().includes("cocktail")) return "wine";
    if (name.toLowerCase().includes("tea")) return "cafe";
    if (name.toLowerCase().includes("shot")) return "flash";
    if (name.toLowerCase().includes("healthy")) return "leaf";
    return "grid";
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
          <Text style={styles.headerTitle}>{t("categories")}</Text>
          <Text style={styles.headerSubtitle}>{t("explore_by_type")}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addButton}
        >
          <Ionicons name="add" size={28} color="#00FFFF" />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {t("create_new_category") || "Create Category"}
            </Text>

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
                <Text style={styles.buttonTextSmall}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateCategory}
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  <ActivityIndicator color="#050510" />
                ) : (
                  <Text style={[styles.buttonTextSmall, { color: "#050510" }]}>
                    Create
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor="#00FFFF"
            />
          }
        >
          <View
            style={[styles.grid, isRTL && { flexDirection: "row-reverse" }]}
          >
            {categories?.map((category) => (
              <TouchableOpacity
                key={category._id || category.id}
                activeOpacity={0.8}
                style={styles.cardWrapper}
                onPress={() => {
                  // Navigate to filtered recipes (Assuming route exists or simply log for now)
                  console.log("Navigate to category:", category.name);
                }}
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
                        colors={[
                          "rgba(0, 255, 255, 0.2)",
                          "rgba(255, 0, 255, 0.2)",
                        ]}
                        style={styles.iconBackground}
                      >
                        <Ionicons
                          name={getIcon(category.name) as any}
                          size={32}
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
                        style={[
                          styles.categoryName,
                          isRTL && { textAlign: "right" },
                        ]}
                        numberOfLines={2}
                      >
                        {category.name}
                      </Text>
                      {/* Backend might not return count yet */}
                      {/* <Text style={styles.itemCount}>
                        {category.count} {t("recipes")}
                      </Text> */}
                    </View>

                    {/* Arrow Icon */}
                    <View
                      style={[
                        styles.arrowContainer,
                        isRTL ? { left: 15, right: undefined } : { right: 15 },
                      ]}
                    >
                      <Ionicons
                        name={isRTL ? "arrow-back" : "arrow-forward"}
                        size={20}
                        color="#666"
                      />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    color: "#CCCCCC",
    marginTop: 5,
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  cardWrapper: {
    width: ITEM_WIDTH,
    shadowColor: "#00FFFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  cardBorder: {
    borderRadius: 25,
    padding: 1.5,
  },
  innerCard: {
    height: 160,
    borderRadius: 23.5,
    backgroundColor: "#1A1A2E",
    padding: 15,
    justifyContent: "space-between",
  },
  iconContainer: {
    alignItems: "flex-start",
  },
  iconBackground: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  textContainer: {
    gap: 4,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  itemCount: {
    fontSize: 12,
    color: "#888888",
  },
  arrowContainer: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    backgroundColor: "#1A1A2E",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 10,
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 15,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  createButton: {
    backgroundColor: "#00FFFF",
  },
  buttonTextSmall: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});
