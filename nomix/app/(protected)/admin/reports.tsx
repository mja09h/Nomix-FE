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
  Easing,
} from "react-native";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";
import {
  getAllReports,
  updateReportStatus,
  deleteReport,
  Report,
} from "../../../api/reports";
import Logo from "../../../components/Logo";

// Custom Alert Component
interface CustomAlertProps {
  visible: boolean;
  type: "success" | "error" | "confirm";
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
            {/* Icon */}
            <View
              style={[alertStyles.iconContainer, { backgroundColor: bgColor }]}
            >
              <Ionicons name={icon as any} size={40} color={color} />
            </View>

            {/* Title */}
            <Text style={[alertStyles.title, { color }]}>{title}</Text>

            {/* Message */}
            <Text style={alertStyles.message}>{message}</Text>

            {/* Buttons */}
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

// Main Component
const AdminReports = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  // Custom Alert States
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error" | "confirm">(
    "success"
  );
  const [alertTitle, setAlertTitle] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showAlert = (
    type: "success" | "error" | "confirm",
    title: string,
    message: string
  ) => {
    setAlertType(type);
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "reviewed", label: "Reviewed" },
    { id: "resolved", label: "Resolved" },
    { id: "dismissed", label: "Dismissed" },
  ];

  const fetchReports = async () => {
    try {
      const data = await getAllReports(filter === "all" ? undefined : filter);
      setReports(data);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [filter])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleUpdateStatus = async (
    reportId: string,
    newStatus: "pending" | "reviewed" | "resolved" | "dismissed"
  ) => {
    try {
      await updateReportStatus(reportId, newStatus);
      setReports((prev) =>
        prev.map((r) => (r._id === reportId ? { ...r, status: newStatus } : r))
      );
      showAlert("success", "Success", `Report marked as ${newStatus}`);
    } catch (error) {
      showAlert("error", "Error", "Failed to update report status");
    }
  };

  const handleDeletePress = (reportId: string) => {
    setDeleteReportId(reportId);
    showAlert(
      "confirm",
      "Delete Report",
      "Are you sure you want to delete this report? This action cannot be undone."
    );
  };

  const handleDeleteConfirm = async () => {
    if (!deleteReportId) return;

    setDeleteLoading(true);
    try {
      await deleteReport(deleteReportId);
      setReports((prev) => prev.filter((r) => r._id !== deleteReportId));
      setAlertVisible(false);
      setDeleteReportId(null);
      setTimeout(() => {
        showAlert("success", "Deleted", "Report has been deleted successfully");
      }, 300);
    } catch (error) {
      setAlertVisible(false);
      setTimeout(() => {
        showAlert("error", "Error", "Failed to delete report");
      }, 300);
    } finally {
      setDeleteLoading(false);
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

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case "recipe":
        return "restaurant";
      case "user":
        return "person";
      case "ingredient":
        return "leaf";
      case "category":
        return "grid";
      default:
        return "help-circle";
    }
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const reporterName =
      item.reporter && typeof item.reporter === "object"
        ? item.reporter.username || "Unknown"
        : "Unknown";
    const targetName =
      item.targetId && typeof item.targetId === "object"
        ? item.targetId.name || item.targetId.username || "Unknown"
        : "Unknown";

    return (
      <View style={styles.reportCard}>
        <LinearGradient
          colors={["rgba(255, 0, 85, 0.1)", "rgba(0, 255, 255, 0.05)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.reportCardGradient}
        >
          {/* Header */}
          <View style={styles.reportHeader}>
            <View style={styles.targetInfo}>
              <View
                style={[
                  styles.targetIconContainer,
                  { backgroundColor: "rgba(255, 0, 85, 0.2)" },
                ]}
              >
                <Ionicons
                  name={getTargetIcon(item.targetType) as any}
                  size={20}
                  color="#FF0055"
                />
              </View>
              <View>
                <Text style={styles.targetType}>
                  {item.targetType.toUpperCase()}
                </Text>
                <Text style={styles.targetName} numberOfLines={1}>
                  {targetName}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(item.status)}20` },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status}
              </Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.reportContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reported by:</Text>
              <Text style={styles.infoValue}>@{reporterName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reason:</Text>
              <Text style={styles.reasonValue}>{item.reason}</Text>
            </View>
            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.dateText}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            {item.status === "pending" && (
              <>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.reviewBtn]}
                  onPress={() => handleUpdateStatus(item._id, "reviewed")}
                >
                  <Ionicons name="eye" size={16} color="#00FFFF" />
                  <Text style={[styles.actionBtnText, { color: "#00FFFF" }]}>
                    Review
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.resolveBtn]}
                  onPress={() => handleUpdateStatus(item._id, "resolved")}
                >
                  <Ionicons name="checkmark" size={16} color="#00FF88" />
                  <Text style={[styles.actionBtnText, { color: "#00FF88" }]}>
                    Resolve
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.dismissBtn]}
                  onPress={() => handleUpdateStatus(item._id, "dismissed")}
                >
                  <Ionicons name="close" size={16} color="#888" />
                  <Text style={[styles.actionBtnText, { color: "#888" }]}>
                    Dismiss
                  </Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDeletePress(item._id)}
            >
              <Ionicons name="trash" size={16} color="#FF0055" />
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
            <Ionicons name="flag" size={24} color="#FF0055" />
            <Text style={styles.headerTitle}>Manage Reports</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                styles.filterTab,
                filter === f.id && styles.filterTabActive,
              ]}
              onPress={() => setFilter(f.id)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === f.id && styles.filterTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF0055" />
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={renderReportItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF0055"
              colors={["#FF0055"]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#00FF88" />
              <Text style={styles.emptyText}>No reports found</Text>
              <Text style={styles.emptySubText}>
                {filter === "all"
                  ? "All reports are handled"
                  : `No ${filter} reports`}
              </Text>
            </View>
          }
        />
      )}

      {/* Custom Alert Modal */}
      <CustomAlert
        visible={alertVisible}
        type={alertType}
        title={alertTitle}
        message={alertMessage}
        onClose={() => {
          setAlertVisible(false);
          setDeleteReportId(null);
        }}
        onConfirm={alertType === "confirm" ? handleDeleteConfirm : undefined}
        confirmText="Delete"
        cancelText="Cancel"
        loading={deleteLoading}
      />
    </View>
  );
};

export default AdminReports;

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
    borderBottomColor: "rgba(255, 0, 85, 0.2)",
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
  filterContainer: {
    flexDirection: "row",
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  filterTabActive: {
    backgroundColor: "rgba(255, 0, 85, 0.2)",
    borderWidth: 1,
    borderColor: "#FF0055",
  },
  filterText: {
    color: "#888",
    fontSize: 12,
    fontWeight: "600",
  },
  filterTextActive: {
    color: "#FF0055",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  reportCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
  },
  reportCardGradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.2)",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  targetInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  targetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  targetType: {
    color: "#888",
    fontSize: 10,
    letterSpacing: 1,
  },
  targetName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 150,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  reportContent: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  infoLabel: {
    color: "#888",
    fontSize: 12,
  },
  infoValue: {
    color: "#00FFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  reasonValue: {
    color: "#FF0055",
    fontSize: 12,
    fontWeight: "600",
  },
  description: {
    color: "#AAAAAA",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 18,
  },
  dateText: {
    color: "#666",
    fontSize: 11,
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    paddingTop: 12,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reviewBtn: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
  },
  resolveBtn: {
    backgroundColor: "rgba(0, 255, 136, 0.1)",
  },
  dismissBtn: {
    backgroundColor: "rgba(136, 136, 136, 0.1)",
  },
  deleteBtn: {
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    marginLeft: "auto",
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15,
  },
  emptySubText: {
    color: "#888",
    fontSize: 14,
    marginTop: 8,
  },
});
