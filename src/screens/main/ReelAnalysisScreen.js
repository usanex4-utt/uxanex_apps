
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../../api/client";

const PERIODS = [
  { key: "hour", label: "Last Hour" },
  { key: "24_hours", label: "Last 24 Hours" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "6_months", label: "6 Months" },
  { key: "total", label: "Total" },
];

const METRICS = [
  { key: "views", label: "Views", icon: "eye-outline" },
  { key: "likes", label: "Likes", icon: "heart-outline" },
  { key: "comments", label: "Comments", icon: "chatbubble-outline" },
  { key: "interested", label: "Interested", icon: "thumbs-up-outline" },
  {
    key: "not_interested",
    label: "Not Interested",
    icon: "thumbs-down-outline",
  },
];

const COLORS = {
  bg: "#05070b",
  card: "#0c121c",
  border: "#172335",
  blue: "#247cff",
  white: "#ffffff",
  muted: "#8492a6",
};

const emptyData = {
  summary: {
    total_watch_time_seconds: 0,
    views: 0,
    likes: 0,
    comments: 0,
    interested: 0,
    not_interested: 0,
  },
  graph: {
    labels: [],
    values: [],
  },
};

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function formatWatchTime(seconds) {
  const total = Math.floor(Number(seconds || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours) return `${hours}h ${minutes}m`;
  if (minutes) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

function formatLabel(value, period) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  if (period === "hour") {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (period === "24_hours") {
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
    });
  }

  if (period === "6_months" || period === "total") {
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "2-digit",
    });
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function ReelAnalysisScreen({ navigation }) {
  const [period, setPeriod] = useState("24_hours");
  const [metric, setMetric] = useState("views");
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chartWidth, setChartWidth] = useState(0);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    setSelectedPoint(null);

    try {
      const result = await api(
        `/api/reels/analytics?period=${period}&metric=${metric}`
      );

      if (!result?.success) {
        throw new Error("Analytics data could not be loaded.");
      }

      setData({
        summary: {
          ...emptyData.summary,
          ...(result.summary || {}),
        },
        graph: {
          labels: result.graph?.labels || [],
          values: result.graph?.values || [],
        },
      });
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [period, metric]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const summary = data.summary || emptyData.summary;
  const labels = data.graph?.labels || [];
  const values = data.graph?.values || [];

  const maxValue = Math.max(1, ...values.map((v) => Number(v || 0)));
  const chartHeight = 170;
  const leftSpace = 34;
  const rightSpace = 12;
  const topSpace = 14;
  const bottomSpace = 12;
  const usableWidth = Math.max(
    0,
    chartWidth - leftSpace - rightSpace
  );
  const usableHeight = chartHeight - topSpace - bottomSpace;

  const points = values.map((value, index) => {
    const x =
      leftSpace +
      (values.length <= 1
        ? usableWidth / 2
        : (index / (values.length - 1)) * usableWidth);

    const y =
      topSpace +
      usableHeight -
      (Number(value || 0) / maxValue) * usableHeight;

    return { x, y, value: Number(value || 0), index };
  });

  const totalMetric = Number(summary[metric] || 0);
  const hasData = values.some((v) => Number(v || 0) > 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={23} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Reel Analysis</Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Watch Time */}
        <View style={styles.watchCard}>
          <View style={styles.watchIcon}>
            <Ionicons name="time-outline" size={25} color={COLORS.blue} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.smallLabel}>Total Watch Time</Text>
            <Text style={styles.watchValue}>
              {formatWatchTime(summary.total_watch_time_seconds)}
            </Text>
            <Text style={styles.watchHint}>
              Selected period
            </Text>
          </View>
        </View>

        {/* Period filters */}
        <Text style={styles.sectionTitle}>Select Period</Text>

        <View style={styles.periodGrid}>
          {PERIODS.map((item) => {
            const active = period === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => setPeriod(item.key)}
                style={[
                  styles.periodButton,
                  active && styles.activePeriod,
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    active && styles.activePeriodText,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Summary metrics */}
        <Text style={styles.sectionTitle}>Performance Overview</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricRow}
        >
          {METRICS.map((item) => {
            const active = metric === item.key;

            return (
              <Pressable
                key={item.key}
                onPress={() => setMetric(item.key)}
                style={[
                  styles.metricCard,
                  active && styles.activeMetric,
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={21}
                  color={active ? COLORS.blue : COLORS.muted}
                />

                <Text style={styles.metricLabel}>
                  {item.label}
                </Text>

                <Text style={styles.metricValue}>
                  {formatNumber(summary[item.key])}
                </Text>

                {active && <View style={styles.metricIndicator} />}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Graph */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeading}>
            <View>
              <Text style={styles.chartTitle}>
                {METRICS.find((m) => m.key === metric)?.label || "Views"}
              </Text>
              <Text style={styles.chartSubtitle}>
                {PERIODS.find((p) => p.key === period)?.label}
              </Text>
            </View>

            <Text style={styles.chartTotal}>
              {formatNumber(totalMetric)}
            </Text>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator size="large" color={COLORS.blue} />
              <Text style={styles.stateText}>Loading analytics...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Ionicons
                name="alert-circle-outline"
                size={30}
                color="#ff6464"
              />
              <Text style={styles.stateText}>{error}</Text>
              <Pressable onPress={loadAnalytics} style={styles.retryButton}>
                <Text style={styles.retryText}>Try Again</Text>
              </Pressable>
            </View>
          ) : !hasData ? (
            <View style={styles.stateBox}>
              <Ionicons
                name="analytics-outline"
                size={34}
                color={COLORS.muted}
              />
              <Text style={styles.stateText}>No data for this period</Text>
              <Text style={styles.emptyHint}>
                Your analytics will appear here when activity is recorded.
              </Text>
            </View>
          ) : (
            <>
              <View
                style={styles.chartArea}
                onLayout={(event) =>
                  setChartWidth(event.nativeEvent.layout.width)
                }
              >
                {/* Y-axis grid */}
                {[0, 1, 2, 3].map((line) => {
                  const y =
                    topSpace + (usableHeight / 3) * line;

                  return (
                    <View
                      key={line}
                      style={[
                        styles.gridLine,
                        {
                          top: y,
                          left: leftSpace,
                          right: rightSpace,
                        },
                      ]}
                    />
                  );
                })}

                {/* Y-axis labels */}
                {[1, 2 / 3, 1 / 3, 0].map((fraction, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.axisText,
                      {
                        top:
                          topSpace +
                          (usableHeight / 3) * index -
                          7,
                        left: 0,
                      },
                    ]}
                  >
                    {formatNumber(Math.round(maxValue * fraction))}
                  </Text>
                ))}

                {/* Line segments */}
                {points.slice(0, -1).map((point, index) => {
                  const next = points[index + 1];
                  const dx = next.x - point.x;
                  const dy = next.y - point.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx);

                  return (
                    <View
                      key={`line-${index}`}
                      style={[
                        styles.lineSegment,
                        {
                          left: point.x,
                          top: point.y,
                          width: length,
                          transform: [{ rotate: `${angle}rad` }],
                        },
                      ]}
                    />
                  );
                })}

                {/* Interactive points */}
                {points.map((point) => (
                  <Pressable
                    key={point.index}
                    onPress={() =>
                      setSelectedPoint(
                        selectedPoint?.index === point.index
                          ? null
                          : point
                      )
                    }
                    style={[
                      styles.chartPoint,
                      {
                        left: point.x - 6,
                        top: point.y - 6,
                      },
                      selectedPoint?.index === point.index &&
                        styles.selectedChartPoint,
                    ]}
                  />
                ))}

                {/* Selected tooltip */}
                {selectedPoint && (
                  <View
                    style={[
                      styles.tooltip,
                      {
                        left: Math.max(
                          35,
                          Math.min(
                            selectedPoint.x - 45,
                            chartWidth - 105
                          )
                        ),
                        top: Math.max(0, selectedPoint.y - 45),
                      },
                    ]}
                  >
                    <Text style={styles.tooltipValue}>
                      {formatNumber(selectedPoint.value)}
                    </Text>
                    <Text style={styles.tooltipLabel}>
                      {formatLabel(
                        labels[selectedPoint.index],
                        period
                      )}
                    </Text>
                  </View>
                )}
              </View>

              {/* X-axis labels */}
              <View style={styles.xLabels}>
                {[0, 0.25, 0.5, 0.75, 1].map((fraction, index) => {
                  const labelIndex =
                    Math.round((labels.length - 1) * fraction);

                  return (
                    <Text
                      key={index}
                      style={styles.xLabel}
                      numberOfLines={1}
                    >
                      {formatLabel(labels[labelIndex], period)}
                    </Text>
                  );
                })}
              </View>

              <Text style={styles.tapHint}>
                Tap any graph point to see its exact count.
              </Text>
            </>
          )}
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 19,
    fontWeight: "700",
  },
  content: {
    padding: 16,
  },
  watchCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 17,
    marginBottom: 25,
  },
  watchIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    backgroundColor: "#142b4b",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  smallLabel: {
    color: COLORS.muted,
    fontSize: 13,
  },
  watchValue: {
    color: COLORS.white,
    fontSize: 25,
    fontWeight: "800",
    marginTop: 3,
  },
  watchHint: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 3,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  periodGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  periodButton: {
    width: "31.5%",
    minHeight: 43,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
    paddingHorizontal: 4,
  },
  activePeriod: {
    backgroundColor: "#142b4b",
    borderColor: COLORS.blue,
  },
  periodText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  activePeriodText: {
    color: COLORS.white,
  },
  metricRow: {
    paddingBottom: 8,
    paddingRight: 8,
  },
  metricCard: {
    width: 125,
    height: 112,
    padding: 12,
    marginRight: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  activeMetric: {
    borderColor: COLORS.blue,
    backgroundColor: "#101e32",
  },
  metricLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },
  metricValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },
  metricIndicator: {
    height: 3,
    backgroundColor: COLORS.blue,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  chartCard: {
    marginTop: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    padding: 15,
  },
  chartHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  chartTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
  chartSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 4,
  },
  chartTotal: {
    color: COLORS.blue,
    fontSize: 21,
    fontWeight: "800",
  },
  chartArea: {
    height: 170,
    width: "100%",
    position: "relative",
  },
  gridLine: {
    position: "absolute",
    height: 1,
    backgroundColor: "#1c2939",
  },
  axisText: {
    position: "absolute",
    color: COLORS.muted,
    fontSize: 9,
    width: 30,
  },
  lineSegment: {
    position: "absolute",
    height: 2,
    backgroundColor: COLORS.blue,
    transformOrigin: "left center",
  },
  chartPoint: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.blue,
    borderWidth: 2,
    borderColor: "#dceaff",
  },
  selectedChartPoint: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -2,
    marginTop: -2,
    backgroundColor: "#ffffff",
  },
  tooltip: {
    position: "absolute",
    minWidth: 82,
    backgroundColor: "#18365c",
    borderWidth: 1,
    borderColor: COLORS.blue,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    zIndex: 5,
  },
  tooltipValue: {
    color: COLORS.white,
    fontWeight: "800",
    fontSize: 13,
    textAlign: "center",
  },
  tooltipLabel: {
    color: "#c5d8f3",
    fontSize: 9,
    textAlign: "center",
    marginTop: 2,
  },
  xLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 34,
    marginRight: 8,
    marginTop: 8,
  },
  xLabel: {
    color: COLORS.muted,
    fontSize: 9,
    maxWidth: 55,
  },
  tapHint: {
    color: COLORS.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 15,
  },
  stateBox: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  stateText: {
    color: COLORS.white,
    fontSize: 13,
    marginTop: 12,
    textAlign: "center",
  },
  emptyHint: {
    color: COLORS.muted,
    fontSize: 11,
    marginTop: 7,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: COLORS.blue,
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 9,
    marginTop: 13,
  },
  retryText: {
    color: COLORS.white,
    fontWeight: "700",
  },
  footerSpace: {
    height: 25,
  },
});
    
