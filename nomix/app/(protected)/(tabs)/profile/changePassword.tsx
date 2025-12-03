import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import { useAuth } from "../../../../context/AuthContext";
import { changePassword } from "../../../../api/auth";

const ChangePassword = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("error"), t("fill_all_fields"));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), t("passwords_do_not_match"));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t("error"), t("password_too_short"));
      return;
    }

    setIsLoading(true);

    try {
      if (user?._id) {
        const result = await changePassword(user._id, {
          oldPassword: currentPassword,
          newPassword: newPassword,
        });

        if (result.success) {
          Alert.alert(
            t("success"),
            result.data.message || t("password_updated"),
            [{ text: t("ok"), onPress: () => router.back() }]
          );
        } else {
          Alert.alert(t("error"), result.error || "Failed to update password");
        }
      } else {
        Alert.alert(t("error"), "User not found");
      }
    } catch (error) {
      console.error("Change password error", error);
      Alert.alert(t("error"), "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    setValue: (text: string) => void,
    show: boolean,
    setShow: (show: boolean) => void,
    placeholder: string
  ) => (
    <View style={styles.inputContainer}>
      <Text
        style={[
          styles.inputLabel,
          isRTL && { textAlign: "right", marginRight: 4, marginLeft: 0 },
        ]}
      >
        {label}
      </Text>
      <View
        style={[styles.inputWrapper, isRTL && { flexDirection: "row-reverse" }]}
      >
        <Ionicons
          name="lock-closed-outline"
          size={20}
          color="#00FFFF"
          style={[
            styles.inputIcon,
            isRTL && { marginLeft: 10, marginRight: 0 },
          ]}
        />
        <TextInput
          style={[styles.input, isRTL && { textAlign: "right" }]}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#666"
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShow(!show)}>
          <Ionicons
            name={show ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#666"
          />
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
        <Text style={styles.headerTitle}>{t("change_password")}</Text>
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
            <Text style={[styles.description, isRTL && { textAlign: "right" }]}>
              {t("ensure_password_secure")}
            </Text>

            {renderPasswordInput(
              t("current_password"),
              currentPassword,
              setCurrentPassword,
              showCurrentPassword,
              setShowCurrentPassword,
              t("enter_current_password")
            )}

            {renderPasswordInput(
              t("new_password"),
              newPassword,
              setNewPassword,
              showNewPassword,
              setShowNewPassword,
              t("enter_new_password")
            )}

            {renderPasswordInput(
              t("confirm_password"),
              confirmPassword,
              setConfirmPassword,
              showConfirmPassword,
              setShowConfirmPassword,
              t("re_enter_new_password")
            )}

            <TouchableOpacity
              style={styles.saveButtonContainer}
              onPress={handleChangePassword}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButton}
              >
                <Text style={styles.saveButtonText}>
                  {isLoading ? t("updating") : t("update_password")}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ChangePassword;

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
    fontSize: 20, // Slightly smaller title for longer text
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
    marginTop: 20,
  },
  description: {
    color: "#CCCCCC",
    marginBottom: 30,
    lineHeight: 22,
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
    fontWeight: "500",
    marginLeft: 4,
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
  saveButtonContainer: {
    marginTop: 30,
    shadowColor: "#FF00FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  saveButton: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
