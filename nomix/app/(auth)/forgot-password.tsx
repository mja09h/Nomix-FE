import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../../components/Logo";
import { useLanguage } from "../../context/LanguageContext";

const ForgotPassword = () => {
  const router = useRouter();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [email, setEmail] = useState("");

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert(t("error"), t("auth.check_email"));
      return;
    }
    // Mock reset password logic
    Alert.alert(t("auth.reset_link_sent"), t("auth.check_email"), [
      { text: t("ok"), onPress: () => router.back() },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.root}
    >
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <Logo />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.title}>{t("auth.forgot_password")}</Text>
          <Text style={styles.subtitle}>{t("auth.reset_desc")}</Text>

          <View style={styles.inputContainer}>
            <View
              style={[
                styles.inputWrapper,
                isRTL && { flexDirection: "row-reverse" },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color="#00FFFF"
                style={[
                  styles.inputIcon,
                  isRTL ? { marginLeft: 10 } : { marginRight: 10 },
                ]}
              />
              <TextInput
                style={[styles.input, isRTL && { textAlign: "right" }]}
                placeholder={t("auth.email")}
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.resetButtonWrapper}
            onPress={handleResetPassword}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#00FFFF", "#FF00FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.resetButton}
            >
              <Text style={styles.resetButtonText}>
                {t("auth.send_reset_link")}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={20}
              color="#CCCCCC"
              style={isRTL ? { marginLeft: 8 } : { marginRight: 8 }}
            />
            <Text style={styles.backButtonText}>{t("auth.back_to_login")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 30,
  },
  logoSection: {
    alignItems: "center",
    marginBottom: 50,
  },
  formSection: {
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#CCCCCC",
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 30,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    height: 56,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
  },
  resetButtonWrapper: {
    width: "100%",
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  resetButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  resetButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  backButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    color: "#CCCCCC",
    fontSize: 16,
  },
});
