import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import React, { useState, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Logo from "../../../../components/Logo";
import { useLanguage } from "../../../../context/LanguageContext";
import {
  getNotificationsEnabled,
  setNotificationsEnabledPref,
} from "../../../../utils/preferences";
import {
  registerForPushNotificationsAsync,
  schedulePushNotification,
  cancelAllNotifications,
} from "../../../../utils/notifications";

const Settings = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();

  // State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      const enabled = await getNotificationsEnabled();
      setNotificationsEnabled(enabled);
    };
    loadPreferences();
  }, []);

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    await setNotificationsEnabledPref(newValue);
    if (newValue) {
      await registerForPushNotificationsAsync();
      await schedulePushNotification(
        "New Recipe Alert!",
        "Check out this new recipe you might like 🍲",
        {},
        { seconds: 180, repeats: true }
      );
    } else {
      await cancelAllNotifications();
    }
  };

  const sendRandomNotification = async () => {
    if (!notificationsEnabled) {
      Alert.alert(
        "Notifications Disabled",
        "Please enable notifications to test them."
      );
      return;
    }
    const messages = [
      "Don't forget to check your recipes!",
      "New features are available!",
      "Have you cooked something today?",
      "Your profile looks great!",
      "Time for a snack?",
    ];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    await schedulePushNotification("Nomix Random", randomMessage);
  };

  const handleLanguageChange = (lang: "en" | "ar") => {
    setLanguage(lang);
    setModalVisible(false);
  };

  const renderSectionHeader = (title: string) => (
    <Text
      style={[
        styles.sectionHeader,
        language === "ar" && { textAlign: "right" },
      ]}
    >
      {title}
    </Text>
  );

  const renderSettingItem = ({
    icon,
    label,
    value,
    type = "arrow", // 'arrow' | 'switch' | 'text'
    onPress,
    subLabel,
  }: {
    icon: string;
    label: string;
    value?: boolean | string;
    type?: "arrow" | "switch" | "text";
    onPress?: () => void;
    subLabel?: string;
  }) => {
    const isRTL = language === "ar";

    return (
      <TouchableOpacity
        style={[styles.settingItem, isRTL && styles.settingItemRTL]}
        activeOpacity={type === "switch" ? 1 : 0.7}
        onPress={type === "switch" ? undefined : onPress}
      >
        <View style={[styles.settingLeft, isRTL && styles.settingLeftRTL]}>
          <View
            style={[
              styles.iconContainer,
              isRTL && { marginRight: 0, marginLeft: 15 },
            ]}
          >
            <Ionicons name={icon as any} size={22} color="#00FFFF" />
          </View>
          <View>
            <Text
              style={[styles.settingLabel, isRTL && { textAlign: "right" }]}
            >
              {label}
            </Text>
            {subLabel && (
              <Text
                style={[
                  styles.settingSubLabel,
                  isRTL && { textAlign: "right" },
                ]}
              >
                {subLabel}
              </Text>
            )}
          </View>
        </View>

        <View style={[styles.settingRight, isRTL && styles.settingRightRTL]}>
          {type === "switch" && (
            <Switch
              value={value as boolean}
              onValueChange={onPress as any}
              trackColor={{ false: "#333", true: "rgba(0, 255, 255, 0.3)" }}
              thumbColor={value ? "#00FFFF" : "#f4f3f4"}
              ios_backgroundColor="#333"
            />
          )}
          {type === "arrow" && (
            <Ionicons
              name={isRTL ? "chevron-back" : "chevron-forward"}
              size={20}
              color="#666"
            />
          )}
          {type === "text" && (
            <Text style={styles.valueText}>{value as string}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
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
          language === "ar" && { flexDirection: "row-reverse" },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name={language === "ar" ? "arrow-forward" : "arrow-back"}
            size={24}
            color="#FFFFFF"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("settings.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Account Section */}
        <View style={styles.section}>
          {renderSectionHeader(t("account"))}
          <View style={styles.sectionContent}>
            {renderSettingItem({
              icon: "person-outline",
              label: t("edit_profile"),
              onPress: () => router.push("/profile/edit"),
            })}
            {renderSettingItem({
              icon: "lock-closed-outline",
              label: t("change_password"),
              onPress: () => router.push("/profile/changePassword"),
            })}
            {renderSettingItem({
              icon: "finger-print-outline",
              label: t("biometric_login"),
              type: "switch",
              value: biometricEnabled,
              onPress: () => setBiometricEnabled(!biometricEnabled),
            })}
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          {renderSectionHeader(t("preferences"))}
          <View style={styles.sectionContent}>
            {renderSettingItem({
              icon: "notifications-outline",
              label: t("push_notifications"),
              type: "switch",
              value: notificationsEnabled,
              onPress: toggleNotifications,
            })}
            {renderSettingItem({
              icon: "notifications-circle-outline",
              label: "Send Random Notification",
              onPress: sendRandomNotification,
            })}
            {renderSettingItem({
              icon: "volume-high-outline",
              label: t("app_sounds"),
              type: "switch",
              value: soundsEnabled,
              onPress: () => setSoundsEnabled(!soundsEnabled),
            })}
            {renderSettingItem({
              icon: "language-outline",
              label: t("language"),
              type: "text",
              value: language === "en" ? "English" : "العربية",
              onPress: () => setModalVisible(true),
            })}
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          {renderSectionHeader(t("support"))}
          <View style={styles.sectionContent}>
            {renderSettingItem({
              icon: "help-circle-outline",
              label: t("help_center"),
              onPress: () => router.push("/profile/help"),
            })}
            {renderSettingItem({
              icon: "document-text-outline",
              label: t("privacy_policy"),
              onPress: () => router.push("/profile/privacy"),
            })}
            {renderSettingItem({
              icon: "shield-checkmark-outline",
              label: t("terms_of_service"),
              onPress: () => router.push("/profile/terms"),
            })}
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.footer}>
          <Text style={styles.versionText}>Nomix v1.0.0</Text>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={() => {
              setDeleteModalVisible(true);
            }}
          >
            <Text style={styles.deleteAccountText}>{t("delete_account")}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={["#00FFFF", "#FF00FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBorder}
              >
                <View style={styles.modalInner}>
                  <Text style={styles.modalTitle}>{t("select_language")}</Text>

                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      language === "en" && styles.selectedOption,
                    ]}
                    onPress={() => handleLanguageChange("en")}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        language === "en" && styles.selectedText,
                      ]}
                    >
                      {t("english")}
                    </Text>
                    {language === "en" && (
                      <Ionicons name="checkmark" size={20} color="#00FFFF" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.separator} />

                  <TouchableOpacity
                    style={[
                      styles.languageOption,
                      language === "ar" && styles.selectedOption,
                    ]}
                    onPress={() => handleLanguageChange("ar")}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        language === "ar" && styles.selectedText,
                      ]}
                    >
                      {t("arabic")}
                    </Text>
                    {language === "ar" && (
                      <Ionicons name="checkmark" size={20} color="#00FFFF" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t("cancel")}</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setDeleteModalVisible(false)}
        >
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={["#FF0055", "#FF00FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalBorder}
              >
                <View style={styles.modalInner}>
                  <Ionicons
                    name="warning-outline"
                    size={40}
                    color="#FF0055"
                    style={{ marginBottom: 10 }}
                  />
                  <Text style={styles.modalTitle}>{t("delete_account")}</Text>
                  <Text style={styles.modalDescription}>
                    {t("delete_account_confirm")}
                  </Text>

                  <View style={styles.modalButtonsRow}>
                    <TouchableOpacity
                      style={[
                        styles.modalActionButton,
                        styles.modalCancelAction,
                      ]}
                      onPress={() => setDeleteModalVisible(false)}
                    >
                      <Text style={styles.modalCancelActionText}>
                        {t("cancel")}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalActionButton,
                        styles.modalDeleteAction,
                      ]}
                      onPress={() => {
                        setDeleteModalVisible(false);
                        router.replace("/(onboarding)/get-started");
                      }}
                    >
                      <Text style={styles.modalDeleteActionText}>
                        {t("delete_account")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default Settings;

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
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#00FFFF",
    marginBottom: 15,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingItemRTL: {
    flexDirection: "row-reverse",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLeftRTL: {
    flexDirection: "row-reverse",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  settingSubLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingRightRTL: {
    flexDirection: "row-reverse",
  },
  valueText: {
    fontSize: 14,
    color: "#888",
    marginRight: 5,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
    gap: 15,
  },
  versionText: {
    color: "#666",
    fontSize: 12,
  },
  deleteAccountButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.7)",
    backgroundColor: "rgba(255, 0, 85, 0.08)",
  },
  deleteAccountText: {
    color: "#FF0055",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
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
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textShadowColor: "rgba(0, 255, 255, 0.5)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  selectedOption: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  languageText: {
    fontSize: 16,
    color: "#CCCCCC",
    fontWeight: "500",
  },
  selectedText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  separator: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 5,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    color: "#FF0055",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalDescription: {
    fontSize: 14,
    color: "#CCCCCC",
    textAlign: "center",
    marginBottom: 20,
    marginTop: 4,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
    gap: 10,
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelAction: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalDeleteAction: {
    backgroundColor: "#FF0055",
    shadowColor: "#FF0055",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  modalCancelActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalDeleteActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
