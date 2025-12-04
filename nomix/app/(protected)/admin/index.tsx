import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useState, useCallback } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { getAllReports, Report } from "../../../api/reports";
import { getAllUsers } from "../../../api/auth";
import { getAllRecipes } from "../../../api/recipes";
import Logo from "../../../components/Logo";

const AdminDashboard = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === "ar";

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    pendingReports: 0,
    totalReports: 0,
  });
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  const fetchData = async () => {
    try {
      const [usersRes, recipes, reports] = await Promise.all([
        getAllUsers(),
        getAllRecipes(),
        getAllReports(),
      ]);

      const users = usersRes?.data || [];
      const pendingReports = reports.filter((r) => r.status === "pending");

      setStats({
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalRecipes: recipes?.length || 0,
        pendingReports: pendingReports.length,
        totalReports: reports.length,
      });

      // Get 5 most recent reports
      setRecentReports(reports.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
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

  const adminMenuItems = [
    {
      icon: "flag",
      label: "Manage Reports",
      route: "/(protected)/admin/reports",
      color: "#FF0055",
      count: stats.pendingReports,
    },
    {
      icon: "people",
      label: "Manage Users",
      route: "/(protected)/admin/users",
      color: "#00FFFF",
      count: stats.totalUsers,
    },
    {
      icon: "restaurant",
      label: "Manage Recipes",
      route: "/(protected)/admin/recipes",
      color: "#FF00FF",
      count: stats.totalRecipes,
    },
    {
      icon: "grid",
      label: "Manage Categories",
      route: "/(protected)/admin/categories",
      color: "#00FF88",
    },
    {
      icon: "leaf",
      label: "Manage Ingredients",
      route: "/(protected)/admin/ingredients",
      color: "#FFD700",
    },
  ];

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading Admin Dashboard...</Text>
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
      <LinearGradient
        colors={["#FFD700", "#FFA500"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? "arrow-forward" : "arrow-back"}
              size={24}
              color="#000"
            />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Ionicons name="shield-checkmark" size={28} color="#000" />
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FFD700"
            colors={["#FFD700"]}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderColor: "#00FFFF" }]}>
            <Ionicons name="people" size={32} color="#00FFFF" />
            <Text style={styles.statNumber}>{stats.totalUsers}</Text>
            <Text style={styles.statLabel}>Users</Text>
          </View>
          <View style={[styles.statCard, { borderColor: "#FF00FF" }]}>
            <Ionicons name="restaurant" size={32} color="#FF00FF" />
            <Text style={styles.statNumber}>{stats.totalRecipes}</Text>
            <Text style={styles.statLabel}>Recipes</Text>
          </View>
          <View style={[styles.statCard, { borderColor: "#FFD700" }]}>
            <Ionicons name="flag" size={32} color="#FFD700" />
            <Text style={styles.statNumber}>{stats.pendingReports}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderColor: "#00FF88" }]}>
            <Ionicons name="checkmark-circle" size={32} color="#00FF88" />
            <Text style={styles.statNumber}>{stats.totalReports}</Text>
            <Text style={styles.statLabel}>Total Reports</Text>
          </View>
        </View>

        {/* Admin Menu */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.menuContainer}>
          {adminMenuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[`${item.color}30`, `${item.color}10`]}
                style={styles.menuItemGradient}
              >
                <View style={styles.menuItemLeft}>
                  <View
                    style={[
                      styles.menuIconContainer,
                      { backgroundColor: `${item.color}20` },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={24}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  {item.count !== undefined && (
                    <View
                      style={[
                        styles.countBadge,
                        { backgroundColor: item.color },
                      ]}
                    >
                      <Text style={styles.countText}>{item.count}</Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Reports */}
        <Text style={styles.sectionTitle}>Recent Reports</Text>
        {recentReports.length > 0 ? (
          <View style={styles.reportsContainer}>
            {recentReports.map((report) => (
              <View key={report._id} style={styles.reportItem}>
                <View style={styles.reportHeader}>
                  <View
                    style={[
                      styles.reportTypeBadge,
                      { backgroundColor: "rgba(255, 0, 85, 0.2)" },
                    ]}
                  >
                    <Text style={styles.reportTypeText}>
                      {report.targetType}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(report.status)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(report.status) },
                      ]}
                    >
                      {report.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.reportReason}>{report.reason}</Text>
                <Text style={styles.reportDate}>
                  {new Date(report.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push("/(protected)/admin/reports" as any)}
            >
              <Text style={styles.viewAllText}>View All Reports</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFD700" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noReportsContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#00FF88" />
            <Text style={styles.noReportsText}>No reports to review</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

export default AdminDashboard;

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
    color: "#FFD700",
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 20,
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  menuContainer: {
    gap: 10,
    marginBottom: 25,
  },
  menuItem: {
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItemGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  menuItemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "bold",
  },
  reportsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  reportItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  reportTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  reportTypeText: {
    color: "#FF0055",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
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
  reportReason: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 4,
  },
  reportDate: {
    color: "#666",
    fontSize: 11,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    paddingVertical: 12,
  },
  viewAllText: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  noReportsContainer: {
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "rgba(0, 255, 136, 0.05)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 136, 0.2)",
  },
  noReportsText: {
    color: "#00FF88",
    fontSize: 14,
    marginTop: 10,
  },
});
