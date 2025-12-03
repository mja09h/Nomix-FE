import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { useLanguage } from "../../../context/LanguageContext";
import { createRecipe } from "../../../api/recipes";
import { getAllCategories, createCategory } from "../../../api/categories";
import { getAllIngredients, createIngredient } from "../../../api/ingredients";
import { Category } from "../../../types/Category";
import { Ingredient } from "../../../types/Recipe";

const AddRecipe = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");

  // Data sources
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);

  // Selections (IDs)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);

  // Instructions (Text)
  const [instructionsList, setInstructionsList] = useState<string[]>([]);
  const [currentInstruction, setCurrentInstruction] = useState("");

  // Search states for ingredients
  const [ingredientSearch, setIngredientSearch] = useState("");
  const [showIngredientPicker, setShowIngredientPicker] = useState(false);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);

  // Category modal states
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categories, ingredients] = await Promise.all([
          getAllCategories(),
          getAllIngredients(),
        ]);
        setAvailableCategories(categories || []);
        setAvailableIngredients(ingredients || []);
      } catch (e) {
        console.log("Failed to fetch options", e);
        // Alert.alert("Error", "Could not load categories or ingredients.");
      }
    };
    fetchData();
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      return [...prev, id];
    });
  };

  const toggleIngredient = (id: string) => {
    setSelectedIngredients((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      return [...prev, id];
    });
  };

  const addInstruction = () => {
    if (currentInstruction.trim()) {
      setInstructionsList((prev) => [...prev, currentInstruction.trim()]);
      setCurrentInstruction("");
    }
  };

  const removeInstruction = (index: number) => {
    setInstructionsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddNewIngredient = async () => {
    if (!ingredientSearch.trim()) return;

    setIsAddingIngredient(true);
    try {
      const newIngredient = await createIngredient(ingredientSearch.trim());
      setAvailableIngredients((prev) => [...prev, newIngredient]);
      setSelectedIngredients((prev) => [...prev, newIngredient._id]);
      setIngredientSearch("");
      Alert.alert("Success", `"${newIngredient.name}" added!`);
    } catch (error: any) {
      const msg =
        error.response?.data?.message || "Failed to create ingredient";
      Alert.alert("Error", msg);
    } finally {
      setIsAddingIngredient(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!categorySearch.trim()) return;

    setIsAddingCategory(true);
    try {
      const newCategory = await createCategory(categorySearch.trim());
      setAvailableCategories((prev) => [...prev, newCategory]);
      setSelectedCategories((prev) => [
        ...prev,
        newCategory._id || newCategory.id || "",
      ]);
      setCategorySearch("");
      Alert.alert("Success", `"${newCategory.name}" added!`);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to create category";
      Alert.alert("Error", msg);
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleCreate = async () => {
    if (
      !name ||
      !image ||
      instructionsList.length === 0 ||
      selectedIngredients.length === 0 ||
      selectedCategories.length === 0
    ) {
      Alert.alert(
        "Missing Fields",
        "Please fill in all required fields (Name, Image, Categories, Ingredients, Instructions)."
      );
      return;
    }

    setIsLoading(true);
    try {
      const recipeData = {
        name,
        image,
        calories: calories ? Number(calories) : undefined,
        protein: protein ? Number(protein) : undefined,
        fat: fat ? Number(fat) : undefined,
        carbohydrates: carbs ? Number(carbs) : undefined,
        ingredients: selectedIngredients, // IDs
        instructions: instructionsList,
        category: selectedCategories, // IDs
      };

      await createRecipe(recipeData);

      Alert.alert("Success", "Recipe created successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error(error);
      const msg =
        error.response?.data?.message ||
        "Failed to create recipe. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    placeholder: string,
    keyboardType: "default" | "numeric" = "default"
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
        {label}
      </Text>
      <TextInput
        style={[styles.input, isRTL && { textAlign: "right" }]}
        value={value}
        onChangeText={setValue}
        placeholder={placeholder}
        placeholderTextColor="#666"
        keyboardType={keyboardType}
      />
    </View>
  );

  // Filter ingredients for picker
  const filteredIngredients = availableIngredients.filter((i) =>
    i.name.toLowerCase().includes(ingredientSearch.toLowerCase())
  );

  // Filter categories for picker
  const filteredCategories = availableCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, isRTL && { flexDirection: "row-reverse" }]}>
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
        <Text style={styles.headerTitle}>Add Recipe</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Image Picker */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="camera-outline" size={40} color="#00FFFF" />
              <Text style={styles.uploadText}>Upload Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {renderInput("Recipe Name", name, setName, "e.g. Spicy Chicken Pasta")}

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Categories
          </Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowCategoryPicker(true)}
          >
            <Text style={styles.selectButtonText}>+ Select Categories</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.chipContainer,
              { marginTop: 10 },
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {selectedCategories.map((id) => {
              const cat = availableCategories.find(
                (c) => (c._id || c.id) === id
              );
              if (!cat) return null;
              return (
                <View key={id} style={styles.chip}>
                  <Text style={styles.chipText}>{cat.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleCategory(id)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF0055" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Ingredient Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Ingredients
          </Text>

          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowIngredientPicker(true)}
          >
            <Text style={styles.selectButtonText}>+ Select Ingredients</Text>
          </TouchableOpacity>

          <View
            style={[
              styles.chipContainer,
              { marginTop: 10 },
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            {selectedIngredients.map((id) => {
              const ing = availableIngredients.find((i) => i._id === id);
              if (!ing) return null;
              return (
                <View key={id} style={styles.chip}>
                  <Text style={styles.chipText}>{ing.name}</Text>
                  <TouchableOpacity
                    onPress={() => toggleIngredient(id)}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="close-circle" size={16} color="#FF0055" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
            Instructions
          </Text>
          <View
            style={[
              styles.addItemContainer,
              isRTL && { flexDirection: "row-reverse" },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                styles.addItemInput,
                isRTL && { textAlign: "right" },
              ]}
              value={currentInstruction}
              onChangeText={setCurrentInstruction}
              placeholder="Add step..."
              placeholderTextColor="#666"
              onSubmitEditing={addInstruction}
            />
            <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 10, gap: 8 }}>
            {instructionsList.map((step, index) => (
              <View
                key={index}
                style={[
                  styles.instructionItem,
                  isRTL && { flexDirection: "row-reverse" },
                ]}
              >
                <Text style={styles.instructionNumber}>{index + 1}.</Text>
                <Text
                  style={[
                    styles.instructionText,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  {step}
                </Text>
                <TouchableOpacity
                  onPress={() => removeInstruction(index)}
                  style={{ padding: 5 }}
                >
                  <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionHeader, isRTL && { textAlign: "right" }]}>
          Nutrition (Optional)
        </Text>
        <View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]}>
          <View
            style={{
              flex: 1,
              marginRight: isRTL ? 0 : 10,
              marginLeft: isRTL ? 10 : 0,
            }}
          >
            {renderInput("Calories", calories, setCalories, "kcal", "numeric")}
          </View>
          <View style={{ flex: 1 }}>
            {renderInput("Protein (g)", protein, setProtein, "g", "numeric")}
          </View>
        </View>
        <View style={[styles.row, isRTL && { flexDirection: "row-reverse" }]}>
          <View
            style={{
              flex: 1,
              marginRight: isRTL ? 0 : 10,
              marginLeft: isRTL ? 10 : 0,
            }}
          >
            {renderInput("Carbs (g)", carbs, setCarbs, "g", "numeric")}
          </View>
          <View style={{ flex: 1 }}>
            {renderInput("Fat (g)", fat, setFat, "g", "numeric")}
          </View>
        </View>

        <TouchableOpacity
          onPress={handleCreate}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#00FFFF", "#FF00FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButton}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.createButtonText}>Create Recipe</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Ingredient Picker Modal */}
      <Modal visible={showIngredientPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Ingredients</Text>
              <TouchableOpacity onPress={() => setShowIngredientPicker(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
              <TextInput
                style={[styles.modalSearch, { marginBottom: 0, flex: 1 }]}
                placeholder="Search or add new..."
                placeholderTextColor="#666"
                value={ingredientSearch}
                onChangeText={setIngredientSearch}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: ingredientSearch.trim()
                      ? "#00FFFF"
                      : "#333",
                  },
                ]}
                onPress={handleAddNewIngredient}
                disabled={!ingredientSearch.trim() || isAddingIngredient}
              >
                {isAddingIngredient ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Ionicons
                    name="add"
                    size={24}
                    color={ingredientSearch.trim() ? "#000" : "#666"}
                  />
                )}
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredIngredients}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => {
                const isSelected = selectedIngredients.includes(item._id);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => toggleIngredient(item._id)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#00FFFF" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#666" }}>
                    {ingredientSearch
                      ? `No results. Tap + to add "${ingredientSearch}"`
                      : "No ingredients available"}
                  </Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowIngredientPicker(false)}
            >
              <Text style={styles.modalDoneText}>
                Done ({selectedIngredients.length} selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Categories</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
              <TextInput
                style={[styles.modalSearch, { marginBottom: 0, flex: 1 }]}
                placeholder="Search or add new..."
                placeholderTextColor="#666"
                value={categorySearch}
                onChangeText={setCategorySearch}
              />
              <TouchableOpacity
                style={[
                  styles.addButton,
                  {
                    backgroundColor: categorySearch.trim() ? "#00FFFF" : "#333",
                  },
                ]}
                onPress={handleAddNewCategory}
                disabled={!categorySearch.trim() || isAddingCategory}
              >
                {isAddingCategory ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Ionicons
                    name="add"
                    size={24}
                    color={categorySearch.trim() ? "#000" : "#666"}
                  />
                )}
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredCategories}
              keyExtractor={(item) =>
                item._id || item.id || Math.random().toString()
              }
              renderItem={({ item }) => {
                const isSelected = selectedCategories.includes(
                  item._id || item.id || ""
                );
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemSelected,
                    ]}
                    onPress={() => toggleCategory(item._id || item.id || "")}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextSelected,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#00FFFF" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#666" }}>
                    {categorySearch
                      ? `No results. Tap + to add "${categorySearch}"`
                      : "No categories available"}
                  </Text>
                </View>
              }
            />
            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => setShowCategoryPicker(false)}
            >
              <Text style={styles.modalDoneText}>
                Done ({selectedCategories.length} selected)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AddRecipe;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050510",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  imagePicker: {
    width: "100%",
    height: 200,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    marginBottom: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderStyle: "dashed",
  },
  previewImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: {
    color: "#00FFFF",
    marginTop: 10,
    fontWeight: "600",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: "#FFFFFF",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 15,
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    fontSize: 16,
  },
  addItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addItemInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: "#00FFFF",
    width: 50,
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 5,
  },
  chip: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selectedChip: {
    backgroundColor: "#00FFFF",
    borderColor: "#00FFFF",
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  selectedChipText: {
    color: "#000000",
    fontWeight: "bold",
  },
  removeBtn: {
    padding: 2,
  },
  selectButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  selectButtonText: {
    color: "#00FFFF",
    fontWeight: "bold",
  },
  instructionItem: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    gap: 10,
  },
  instructionNumber: {
    color: "#00FFFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  instructionText: {
    color: "#FFF",
    flex: 1,
    fontSize: 14,
  },
  sectionHeader: {
    color: "#00FFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },
  row: {
    flexDirection: "row",
  },
  createButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#1A1A2E",
    height: "80%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalSearch: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 10,
    color: "#FFF",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pickerItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  pickerItemText: {
    color: "#AAA",
    fontSize: 16,
  },
  pickerItemTextSelected: {
    color: "#FFF",
    fontWeight: "bold",
  },
  modalDoneBtn: {
    backgroundColor: "#00FFFF",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  modalDoneText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
});
