import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "../../components/Logo";
import { useLanguage } from "../../context/LanguageContext";

const AiGenerator = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [ingredients, setIngredients] = useState("");
  const [mood, setMood] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<null | {
    name: string;
    description: string;
    instructions: string;
  }>(null);

  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isGenerating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.ease,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isGenerating]);

  useEffect(() => {
    if (generatedRecipe) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [generatedRecipe]);

  const handleGenerate = () => {
    if (!ingredients.trim()) return;

    setIsGenerating(true);
    setGeneratedRecipe(null);

    // Simulate AI generation delay
    setTimeout(() => {
      setIsGenerating(false);
      setGeneratedRecipe({
        name: "Neon AI Special",
        description: `A perfect blend based on ${ingredients} for a ${
          mood || "chill"
        } vibe.`,
        instructions:
          "1. Mix all ingredients in a shaker.\n2. Add ice and shake vigorously.\n3. Strain into a chilled glass.\n4. Garnish with a neon glow stick (optional).",
      });
    }, 2500);
  };

  return (
    <View style={styles.root}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

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
        <Text style={styles.headerTitle}>{t("ai_generator.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.formContainer}>
            <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
              {t("ai_generator.enter_ingredients")}{" "}
              <Ionicons name="flask-outline" size={16} color="#00FFFF" />
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                isRTL && { textAlign: "right" },
              ]}
              placeholder={t("ai_generator.ingredients_placeholder")}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={4}
              value={ingredients}
              onChangeText={setIngredients}
            />

            <Text style={[styles.label, isRTL && { textAlign: "right" }]}>
              {t("ai_generator.enter_mood")}{" "}
              <Ionicons name="color-wand-outline" size={16} color="#FF00FF" />
            </Text>
            <TextInput
              style={[styles.input, isRTL && { textAlign: "right" }]}
              placeholder={t("ai_generator.mood_placeholder")}
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={mood}
              onChangeText={setMood}
            />

            <TouchableOpacity
              onPress={handleGenerate}
              activeOpacity={0.8}
              disabled={isGenerating}
            >
              <Animated.View
                style={[
                  styles.generateButtonWrapper,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <LinearGradient
                  colors={
                    isGenerating
                      ? ["#2A2A4A", "#1A1A2E"]
                      : ["#00FFFF", "#FF00FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.generateButton}
                >
                  {isGenerating ? (
                    <View style={styles.generatingContainer}>
                      <ActivityIndicator color="#00FFFF" />
                      <Text style={styles.generatingText}>ANALYZING...</Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons
                        name="sparkles"
                        size={20}
                        color={isGenerating ? "#00FFFF" : "#FFFFFF"}
                        style={isRTL ? { marginLeft: 10 } : { marginRight: 10 }}
                      />
                      <Text
                        style={[
                          styles.generateButtonText,
                          isGenerating && { color: "#00FFFF" },
                        ]}
                      >
                        {t("ai_generator.generate_button")}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </View>

          {generatedRecipe && (
            <Animated.View
              style={[
                styles.resultContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      translateY: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <LinearGradient
                colors={["rgba(0, 255, 255, 0.1)", "rgba(255, 0, 255, 0.1)"]}
                style={styles.resultGradient}
              >
                <View
                  style={[
                    styles.resultHeader,
                    isRTL && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Ionicons
                    name="hardware-chip-outline"
                    size={24}
                    color="#00FFFF"
                  />
                  <Text
                    style={[
                      styles.resultTitle,
                      isRTL && { textAlign: "right" },
                    ]}
                  >
                    {generatedRecipe.name}
                  </Text>
                </View>

                <Text
                  style={[styles.resultDesc, isRTL && { textAlign: "right" }]}
                >
                  "{generatedRecipe.description}"
                </Text>

                <View style={styles.divider} />

                <Text
                  style={[
                    styles.resultInstructions,
                    isRTL && { textAlign: "right" },
                  ]}
                >
                  {generatedRecipe.instructions}
                </Text>
              </LinearGradient>
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default AiGenerator;

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
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    gap: 20,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 5,
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20, // Smoother corners
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    padding: 15,
    color: "#FFFFFF",
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  generateButtonWrapper: {
    marginTop: 20,
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  generateButton: {
    height: 56,
    borderRadius: 28, // Fully rounded pill shape
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  generatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  generatingText: {
    color: "#00FFFF",
    fontWeight: "bold",
    letterSpacing: 1,
    fontSize: 14,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  resultContainer: {
    marginTop: 30,
    borderRadius: 25, // Smooth rounded corners
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.3)",
  },
  resultGradient: {
    padding: 25,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 15,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#00FFFF",
    marginBottom: 5,
  },
  resultDesc: {
    fontSize: 16,
    color: "#CCCCCC",
    fontStyle: "italic",
    marginBottom: 15,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 15,
  },
  resultInstructions: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
  },
});
