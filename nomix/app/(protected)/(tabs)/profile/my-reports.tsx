import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../../context/LanguageContext";
import { getMyReports, Report } from "../../../../api/reports";
import Logo from "../../../../components/Logo";

const MyReports = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = async () => {
    try {
      const data = await getMyReports();
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
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "reviewed":
        return "eye-outline";
      case "resolved":
        return "checkmark-circle-outline";
      case "dismissed":
        return "close-circle-outline";
      default:
        return "help-circle-outline";
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderReportItem = ({ item }: { item: Report }) => {
    const targetName =
      typeof item.targetId === "object"
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
          <View style={styles.reportHeader}>
            {/* Target Type Icon */}
            <View
              style={[
                styles.targetIconContainer,
                { backgroundColor: "rgba(255, 0, 85, 0.2)" },
              ]}
            >
              <Ionicons
                name={getTargetIcon(item.targetType)}
                size={20}
                color="#FF0055"
              />
            </View>

            {/* Report Info */}
            <View style={styles.reportInfo}>
              <Text style={styles.reportTargetType}>
                {item.targetType.charAt(0).toUpperCase() +
                  item.targetType.slice(1)}
              </Text>
              <Text style={styles.reportTargetName} numberOfLines={1}>
                {targetName}
              </Text>
            </View>

            {/* Status Badge */}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(item.status)}20` },
              ]}
            >
              <Ionicons
                name={getStatusIcon(item.status)}
                size={14}
                color={getStatusColor(item.status)}
              />
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>
              {item.reason.charAt(0).toUpperCase() +
                item.reason.slice(1).replace(/_/g, " ")}
            </Text>
          </View>

          {/* Description */}
          {item.description && (
            <Text style={styles.descriptionText} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          {/* Date */}
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FF0055" />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Background Logo */}
      <View style={styles.backgroundLogoContainer} pointerEvents="none">
        <Logo />
      </View>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
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
          <Text style={styles.headerTitle}>My Reports</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

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
            <View style={styles.emptyIconContainer}>
              <Ionicons name="flag-outline" size={64} color="#333" />
            </View>
            <Text style={styles.emptyTitle}>No Reports</Text>
            <Text style={styles.emptySubtitle}>
              You haven't submitted any reports yet. If you see inappropriate
              content, use the flag icon to report it.
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default MyReports;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050510",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FF0055",
    marginTop: 10,
    fontSize: 14,
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
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 0, 85, 0.2)",
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
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  reportCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 0, 85, 0.2)",
  },
  reportCardGradient: {
    padding: 16,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  targetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  reportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  reportTargetType: {
    color: "#888",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  reportTargetName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  reasonLabel: {
    color: "#888",
    fontSize: 13,
  },
  reasonText: {
    color: "#FF0055",
    fontSize: 13,
    fontWeight: "600",
  },
  descriptionText: {
    color: "#AAAAAA",
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  dateText: {
    color: "#666",
    fontSize: 11,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 0, 85, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  emptySubtitle: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
