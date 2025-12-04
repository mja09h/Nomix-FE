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
  ScrollView,
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getAllUsersAdmin,
  toggleUserActive,
  toggleUserAdmin,
  banUser as banUserApi,
  unbanUser as unbanUserApi,
  getReportsForUser as getReportsForUserApi,
} from "../../../api/auth";
import { getAllReports, Report } from "../../../api/reports";
import { getImageUrl } from "../../../api/index";
import { User } from "../../../types/User";
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

// Ban Modal Component
interface BanModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
  onBan: (duration: number, unit: "hours" | "days", reason: string) => void;
  loading: boolean;
}

const BanModal: React.FC<BanModalProps> = ({
  visible,
  user,
  onClose,
  onBan,
  loading,
}) => {
  const [duration, setDuration] = useState("1");
  const [unit, setUnit] = useState<"hours" | "days">("days");
  const [reason, setReason] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setDuration("1");
      setUnit("days");
      setReason("");
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

  const handleBan = () => {
    const durationNum = parseInt(duration) || 1;
    onBan(durationNum, unit, reason);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={banStyles.overlay}>
        <Animated.View
          style={[
            banStyles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255, 0, 85, 0.2)", "rgba(26, 26, 46, 0.95)"]}
            style={banStyles.gradient}
          >
            {/* Header */}
            <View style={banStyles.header}>
              <Ionicons name="ban" size={32} color="#FF0055" />
              <Text style={banStyles.title}>Ban User</Text>
            </View>

            {/* User Info */}
            {user && (
              <View style={banStyles.userInfo}>
                <Text style={banStyles.username}>@{user.username}</Text>
              </View>
            )}

            {/* Duration Input */}
            <Text style={banStyles.label}>Ban Duration</Text>
            <View style={banStyles.durationRow}>
              <TextInput
                style={banStyles.durationInput}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="1"
                placeholderTextColor="#666"
                maxLength={3}
              />
              <View style={banStyles.unitSelector}>
                <TouchableOpacity
                  style={[
                    banStyles.unitButton,
                    unit === "hours" && banStyles.unitButtonActive,
                  ]}
                  onPress={() => setUnit("hours")}
                >
                  <Text
                    style={[
                      banStyles.unitText,
                      unit === "hours" && banStyles.unitTextActive,
                    ]}
                  >
                    Hours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    banStyles.unitButton,
                    unit === "days" && banStyles.unitButtonActive,
                  ]}
                  onPress={() => setUnit("days")}
                >
                  <Text
                    style={[
                      banStyles.unitText,
                      unit === "days" && banStyles.unitTextActive,
                    ]}
                  >
                    Days
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick Select */}
            <View style={banStyles.quickSelect}>
              {["1", "3", "7", "14", "30"].map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[
                    banStyles.quickBtn,
                    duration === d &&
                      unit === "days" &&
                      banStyles.quickBtnActive,
                  ]}
                  onPress={() => {
                    setDuration(d);
                    setUnit("days");
                  }}
                >
                  <Text
                    style={[
                      banStyles.quickBtnText,
                      duration === d &&
                        unit === "days" &&
                        banStyles.quickBtnTextActive,
                    ]}
                  >
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reason Input */}
            <Text style={banStyles.label}>Reason (Optional)</Text>
            <TextInput
              style={banStyles.reasonInput}
              value={reason}
              onChangeText={setReason}
              placeholder="Enter ban reason..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={2}
            />

            {/* Buttons */}
            <View style={banStyles.buttonRow}>
              <TouchableOpacity
                style={banStyles.cancelButton}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={banStyles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={banStyles.banButton}
                onPress={handleBan}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="ban" size={18} color="#FFFFFF" />
                    <Text style={banStyles.banButtonText}>Ban User</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const banStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    overflow: "hidden",
  },
  gradient: {
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.3)",
    borderRadius: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FF0055",
  },
  userInfo: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  username: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  label: {
    color: "#888",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  durationRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  durationInput: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  unitSelector: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 4,
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  unitButtonActive: {
    backgroundColor: "#FF0055",
  },
  unitText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  unitTextActive: {
    color: "#FFFFFF",
  },
  quickSelect: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  quickBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  quickBtnActive: {
    backgroundColor: "rgba(255, 0, 85, 0.3)",
    borderWidth: 1,
    borderColor: "#FF0055",
  },
  quickBtnText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  quickBtnTextActive: {
    color: "#FF0055",
  },
  reasonInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    padding: 14,
    color: "#FFFFFF",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginBottom: 20,
    minHeight: 60,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
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
  banButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#FF0055",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  banButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
});

// User Reports Modal
interface UserReportsData {
  reportsAgainstUser: Report[];
  reportsByUser: Report[];
  totalAgainst: number;
  totalBy: number;
}

interface UserReportsModalProps {
  visible: boolean;
  user: User | null;
  onClose: () => void;
}

const UserReportsModal: React.FC<UserReportsModalProps> = ({
  visible,
  user,
  onClose,
}) => {
  const [reportsData, setReportsData] = useState<UserReportsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"against" | "by">("against");

  useEffect(() => {
    if (visible && user) {
      fetchReports();
    }
  }, [visible, user]);

  const fetchReports = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getReportsForUserApi(user._id);
      if (result.success) {
        setReportsData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const currentReports =
    activeTab === "against"
      ? reportsData?.reportsAgainstUser || []
      : reportsData?.reportsByUser || [];

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
            colors={["rgba(0, 255, 255, 0.1)", "#1A1A2E"]}
            style={reportsModalStyles.gradient}
          >
            {/* Header */}
            <View style={reportsModalStyles.header}>
              <View style={reportsModalStyles.headerLeft}>
                <Ionicons name="flag" size={24} color="#FF0055" />
                <Text style={reportsModalStyles.title}>
                  Reports: @{user?.username}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={reportsModalStyles.tabRow}>
              <TouchableOpacity
                style={[
                  reportsModalStyles.tab,
                  activeTab === "against" && reportsModalStyles.tabActive,
                ]}
                onPress={() => setActiveTab("against")}
              >
                <Text
                  style={[
                    reportsModalStyles.tabText,
                    activeTab === "against" && reportsModalStyles.tabTextActive,
                  ]}
                >
                  Against ({reportsData?.totalAgainst || 0})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  reportsModalStyles.tab,
                  activeTab === "by" && reportsModalStyles.tabActive,
                ]}
                onPress={() => setActiveTab("by")}
              >
                <Text
                  style={[
                    reportsModalStyles.tabText,
                    activeTab === "by" && reportsModalStyles.tabTextActive,
                  ]}
                >
                  Made By ({reportsData?.totalBy || 0})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Reports List */}
            {loading ? (
              <View style={reportsModalStyles.loadingContainer}>
                <ActivityIndicator size="large" color="#00FFFF" />
              </View>
            ) : currentReports.length > 0 ? (
              <FlatList
                data={currentReports}
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
                  {activeTab === "against"
                    ? "No reports against this user"
                    : "No reports made by this user"}
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
    maxHeight: "80%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  gradient: {
    padding: 20,
    minHeight: 350,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tabRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    borderWidth: 1,
    borderColor: "#FF0055",
  },
  tabText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#FF0055",
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
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
    marginBottom: 8,
  },
  reportReason: {
    color: "#FF0055",
    fontSize: 14,
    fontWeight: "600",
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
const AdminUsers = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [users, setUsers] = useState<User[]>([]);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<
    "all" | "active" | "inactive" | "banned" | "admin"
  >("all");

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

  const [banModalVisible, setBanModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banLoading, setBanLoading] = useState(false);

  const [reportsModalVisible, setReportsModalVisible] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);

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
      const [usersRes, reportsRes] = await Promise.all([
        getAllUsersAdmin(), // Uses admin endpoint to get ALL users including inactive/banned
        getAllReports(),
      ]);

      if (usersRes?.success && usersRes.data && Array.isArray(usersRes.data)) {
        setUsers(usersRes.data);
      }
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

  const getReportsCountForUser = (userId: string) => {
    return allReports.filter(
      (report) =>
        report.targetType === "user" &&
        (typeof report.targetId === "string"
          ? report.targetId === userId
          : report.targetId?._id === userId)
    ).length;
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === "all") return matchesSearch;
    if (filter === "active")
      return matchesSearch && user.isActive !== false && !user.isBanned;
    if (filter === "inactive") return matchesSearch && user.isActive === false;
    if (filter === "banned") return matchesSearch && user.isBanned;
    if (filter === "admin") return matchesSearch && user.isAdmin;

    return matchesSearch;
  });

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setBanModalVisible(true);
  };

  const handleBanConfirm = async (
    duration: number,
    unit: "hours" | "days",
    reason: string
  ) => {
    if (!selectedUser) return;

    setBanLoading(true);
    try {
      const result = await banUserApi(selectedUser._id, duration, unit, reason);

      if (result.success) {
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u._id === selectedUser._id
              ? { ...u, isBanned: true, banReason: reason }
              : u
          )
        );

        setBanModalVisible(false);
        showAlert(
          "success",
          "User Banned",
          `${selectedUser.username} has been banned for ${duration} ${unit}`
        );
      } else {
        showAlert("error", "Error", result.error || "Failed to ban user");
      }
    } catch (error) {
      showAlert("error", "Error", "Failed to ban user");
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnbanUser = (user: User) => {
    showAlert(
      "confirm",
      "Unban User",
      `Are you sure you want to unban @${user.username}?`,
      async () => {
        setActionLoading(true);
        try {
          const result = await unbanUserApi(user._id);

          if (result.success) {
            setUsers((prev) =>
              prev.map((u) =>
                u._id === user._id
                  ? { ...u, isBanned: false, banExpiresAt: null, banReason: "" }
                  : u
              )
            );

            setAlertVisible(false);
            setTimeout(() => {
              showAlert(
                "success",
                "Success",
                `${user.username} has been unbanned`
              );
            }, 300);
          } else {
            setAlertVisible(false);
            setTimeout(() => {
              showAlert(
                "error",
                "Error",
                result.error || "Failed to unban user"
              );
            }, 300);
          }
        } catch (error) {
          setAlertVisible(false);
          setTimeout(() => {
            showAlert("error", "Error", "Failed to unban user");
          }, 300);
        } finally {
          setActionLoading(false);
        }
      },
      "Unban"
    );
  };

  const handleToggleActive = (user: User) => {
    const newStatus = user.isActive === false;
    showAlert(
      "confirm",
      newStatus ? "Activate User" : "Deactivate User",
      `Are you sure you want to ${newStatus ? "activate" : "deactivate"} @${
        user.username
      }?`,
      async () => {
        setActionLoading(true);
        try {
          const result = await toggleUserActive(user._id, newStatus);

          if (result.success) {
            setUsers((prev) =>
              prev.map((u) =>
                u._id === user._id ? { ...u, isActive: newStatus } : u
              )
            );

            setAlertVisible(false);
            setTimeout(() => {
              showAlert(
                "success",
                "Success",
                `User has been ${newStatus ? "activated" : "deactivated"}`
              );
            }, 300);
          } else {
            setAlertVisible(false);
            setTimeout(() => {
              showAlert(
                "error",
                "Error",
                result.error || "Failed to update user status"
              );
            }, 300);
          }
        } catch (error) {
          setAlertVisible(false);
          setTimeout(() => {
            showAlert("error", "Error", "Failed to update user status");
          }, 300);
        } finally {
          setActionLoading(false);
        }
      },
      newStatus ? "Activate" : "Deactivate"
    );
  };

  const handleToggleAdmin = (user: User) => {
    const newStatus = !user.isAdmin;
    showAlert(
      "confirm",
      newStatus ? "Make Admin" : "Remove Admin",
      `Are you sure you want to ${newStatus ? "make" : "remove"} @${
        user.username
      } ${newStatus ? "an admin" : "from admin"}?`,
      async () => {
        setActionLoading(true);
        try {
          const result = await toggleUserAdmin(user._id, newStatus);

          if (result.success) {
            setUsers((prev) =>
              prev.map((u) =>
                u._id === user._id ? { ...u, isAdmin: newStatus } : u
              )
            );

            setAlertVisible(false);
            setTimeout(() => {
              showAlert(
                "success",
                "Success",
                newStatus
                  ? `${user.username} is now an admin`
                  : `Admin privileges removed from ${user.username}`
              );
            }, 300);
          } else {
            setAlertVisible(false);
            setTimeout(() => {
              showAlert(
                "error",
                "Error",
                result.error || "Failed to update admin status"
              );
            }, 300);
          }
        } catch (error) {
          setAlertVisible(false);
          setTimeout(() => {
            showAlert("error", "Error", "Failed to update admin status");
          }, 300);
        } finally {
          setActionLoading(false);
        }
      },
      newStatus ? "Make Admin" : "Remove"
    );
  };

  const handleViewReports = (user: User) => {
    setSelectedUser(user);
    setReportsModalVisible(true);
  };

  const getBanTimeRemaining = (
    banExpiresAt: Date | string | null | undefined
  ) => {
    if (!banExpiresAt) return null;
    const expiresAt = new Date(banExpiresAt);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d remaining`;
    return `${hours}h remaining`;
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const userImage = item.profilePicture || item.image;
    const imageUrl = userImage
      ? userImage.startsWith("http")
        ? userImage
        : getImageUrl(userImage)
      : null;
    const reportsCount = getReportsCountForUser(item._id);
    const isActive = item.isActive !== false;
    const isBanned = item.isBanned;

    return (
      <View style={styles.userCard}>
        <LinearGradient
          colors={[
            isBanned
              ? "rgba(255, 0, 85, 0.15)"
              : isActive
              ? "rgba(0, 255, 255, 0.05)"
              : "rgba(255, 215, 0, 0.1)",
            "rgba(26, 26, 46, 0.8)",
          ]}
          style={styles.userCardGradient}
        >
          {/* User Info Row */}
          <View style={styles.userInfoRow}>
            <View style={styles.avatarContainer}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#666" />
                </View>
              )}
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isBanned
                      ? "#FF0055"
                      : isActive
                      ? "#00FF88"
                      : "#FFD700",
                  },
                ]}
              />
            </View>

            <View style={styles.userDetails}>
              <Text style={styles.username}>@{item.username}</Text>
              <Text style={styles.email} numberOfLines={1}>
                {item.email}
              </Text>
              <View style={styles.badgesRow}>
                {item.isAdmin && (
                  <View style={styles.adminBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={12}
                      color="#FFD700"
                    />
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                {isBanned && (
                  <View style={styles.bannedBadge}>
                    <Ionicons name="ban" size={10} color="#FF0055" />
                    <Text style={styles.bannedBadgeText}>
                      Banned{" "}
                      {getBanTimeRemaining(item.banExpiresAt) &&
                        `· ${getBanTimeRemaining(item.banExpiresAt)}`}
                    </Text>
                  </View>
                )}
                {!isActive && !isBanned && (
                  <View style={styles.inactiveBadge}>
                    <Ionicons name="pause-circle" size={10} color="#FFD700" />
                    <Text style={styles.inactiveBadgeText}>Deactivated</Text>
                  </View>
                )}
                {reportsCount > 0 && (
                  <View style={styles.reportsBadge}>
                    <Ionicons name="flag" size={10} color="#FF0055" />
                    <Text style={styles.reportsBadgeText}>{reportsCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Actions Row 1 */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.viewReportsBtn]}
              onPress={() => handleViewReports(item)}
            >
              <Ionicons name="flag-outline" size={16} color="#FF0055" />
              <Text style={[styles.actionBtnText, { color: "#FF0055" }]}>
                Reports
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                isActive ? styles.deactivateBtn : styles.activateBtn,
              ]}
              onPress={() => handleToggleActive(item)}
            >
              <Ionicons
                name={
                  isActive ? "close-circle-outline" : "checkmark-circle-outline"
                }
                size={16}
                color={isActive ? "#FFD700" : "#00FF88"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isActive ? "#FFD700" : "#00FF88" },
                ]}
              >
                {isActive ? "Deactivate" : "Activate"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.isAdmin ? styles.removeAdminBtn : styles.makeAdminBtn,
              ]}
              onPress={() => handleToggleAdmin(item)}
            >
              <Ionicons
                name={item.isAdmin ? "shield-outline" : "shield-checkmark"}
                size={16}
                color={item.isAdmin ? "#888" : "#FFD700"}
              />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: item.isAdmin ? "#888" : "#FFD700" },
                ]}
              >
                {item.isAdmin ? "Remove" : "Admin"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Actions Row 2 - Ban/Unban */}
          <View style={styles.actionsRow2}>
            {isBanned ? (
              <TouchableOpacity
                style={[styles.actionBtn, styles.unbanBtn, { flex: 1 }]}
                onPress={() => handleUnbanUser(item)}
              >
                <Ionicons name="checkmark-circle" size={16} color="#00FF88" />
                <Text style={[styles.actionBtnText, { color: "#00FF88" }]}>
                  Unban User
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtn, styles.banBtn, { flex: 1 }]}
                onPress={() => handleBanUser(item)}
              >
                <Ionicons name="ban" size={16} color="#FF0055" />
                <Text style={[styles.actionBtnText, { color: "#FF0055" }]}>
                  Ban User
                </Text>
              </TouchableOpacity>
            )}
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
            <Ionicons name="people" size={24} color="#00FFFF" />
            <Text style={styles.headerTitle}>Manage Users</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {(["all", "active", "inactive", "banned", "admin"] as const).map(
            (f) => (
              <TouchableOpacity
                key={f}
                style={[
                  styles.filterTab,
                  filter === f && styles.filterTabActive,
                ]}
                onPress={() => setFilter(f)}
              >
                <Text
                  style={[
                    styles.filterText,
                    filter === f && styles.filterTextActive,
                  ]}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          renderItem={renderUserItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#00FFFF"
              colors={["#00FFFF"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#333" />
              <Text style={styles.emptyText}>No users found</Text>
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

      {/* Ban Modal */}
      <BanModal
        visible={banModalVisible}
        user={selectedUser}
        onClose={() => {
          setBanModalVisible(false);
          setSelectedUser(null);
        }}
        onBan={handleBanConfirm}
        loading={banLoading}
      />

      {/* User Reports Modal */}
      <UserReportsModal
        visible={reportsModalVisible}
        user={selectedUser}
        onClose={() => {
          setReportsModalVisible(false);
          setSelectedUser(null);
        }}
      />
    </View>
  );
};

export default AdminUsers;

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
    borderBottomColor: "rgba(0, 255, 255, 0.2)",
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
    backgroundColor: "rgba(0, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "#00FFFF",
  },
  filterText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#00FFFF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  userCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.2)",
  },
  userInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1A1A2E",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#050510",
  },
  userDetails: {
    flex: 1,
    marginLeft: 14,
  },
  username: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  email: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adminBadgeText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600",
  },
  bannedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bannedBadgeText: {
    color: "#FF0055",
    fontSize: 10,
    fontWeight: "600",
  },
  inactiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  inactiveBadgeText: {
    color: "#FFD700",
    fontSize: 10,
    fontWeight: "600",
  },
  reportsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  reportsBadgeText: {
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
  actionsRow2: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
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
  viewReportsBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  activateBtn: {
    backgroundColor: "rgba(0, 255, 136, 0.1)",
  },
  deactivateBtn: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  makeAdminBtn: {
    backgroundColor: "rgba(255, 215, 0, 0.1)",
  },
  removeAdminBtn: {
    backgroundColor: "rgba(136, 136, 136, 0.1)",
  },
  banBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
  },
  unbanBtn: {
    backgroundColor: "rgba(0, 255, 136, 0.1)",
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
