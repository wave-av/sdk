/**
 * WAVE SDK - Pulse Analytics API
 *
 * Analytics, metrics, and business intelligence for streams and viewers.
 */

import { WaveError } from "./client";
import type { WaveClient, PaginationParams, PaginatedResponse, Timestamps } from "./client";

// ============================================================================
// Types
// ============================================================================

export type TimeRange = "1h" | "6h" | "24h" | "7d" | "30d" | "90d" | "custom";
export type Granularity = "minute" | "hour" | "day" | "week" | "month";
export type MetricType = "viewers" | "streams" | "bandwidth" | "revenue" | "engagement" | "quality";

export interface QueryParams {
  time_range: TimeRange;
  start_date?: string;
  end_date?: string;
  granularity?: Granularity;
  stream_id?: string;
  group_by?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface StreamAnalytics {
  stream_id: string;
  title: string;
  total_viewers: number;
  peak_viewers: number;
  average_duration_seconds: number;
  total_watch_time_seconds: number;
  unique_viewers: number;
  average_bitrate_kbps: number;
  buffering_ratio: number;
  quality_score: number;
  started_at: string;
  ended_at?: string;
}

export interface ViewerAnalytics {
  total_viewers: number;
  unique_viewers: number;
  peak_concurrent: number;
  average_session_duration: number;
  bounce_rate: number;
  geography: GeoBreakdown[];
  devices: DeviceBreakdown[];
  protocols: ProtocolBreakdown[];
}

export interface GeoBreakdown {
  country: string;
  region?: string;
  viewers: number;
  percentage: number;
}
export interface DeviceBreakdown {
  type: "desktop" | "mobile" | "tablet" | "tv" | "other";
  viewers: number;
  percentage: number;
}
export interface ProtocolBreakdown {
  protocol: string;
  viewers: number;
  percentage: number;
}

export interface QualityMetrics {
  average_bitrate_kbps: number;
  buffering_ratio: number;
  startup_time_ms: number;
  rebuffering_events: number;
  resolution_switches: number;
  error_rate: number;
  cdn_cache_hit_ratio: number;
}

export interface EngagementMetrics {
  average_watch_time_seconds: number;
  chat_messages: number;
  reactions: number;
  polls_participated: number;
  peak_engagement_score: number;
  drop_off_points: { time_seconds: number; drop_rate: number }[];
}

/**
 * @deprecated No gateway route ever served this shape — `getRevenueMetrics` always 404'd. The
 * method now throws a `WaveError` (code `METHOD_NOT_SUPPORTED`) instead of calling a dead route.
 * Kept only so existing imports of the type don't break; do not build against it.
 */
export interface RevenueMetrics {
  total_revenue_cents: number;
  subscription_revenue_cents: number;
  tip_revenue_cents: number;
  ad_revenue_cents: number;
  mrr_cents: number;
  churn_rate: number;
  arpu_cents: number;
  new_subscribers: number;
  cancelled_subscribers: number;
}

/**
 * Real shape of `GET /v1/analytics/engagement` (wave-gateway `src/analytics-routes.ts`,
 * `handleAnalyticsEngagement`) — aggregated server-side from `usage_ledger_daily`, a daily
 * rollup with no per-event granularity. Fields the gateway cannot honestly derive from that
 * rollup (`totalEvents`, `averageEventsPerDay`, `peakEvents`) come back `null`, not fabricated.
 */
export interface EngagementAnalytics {
  organizationId: string;
  period: { from: string; to: string };
  engagement: {
    totalEvents: number | null;
    totalQuantity: number;
    averageEventsPerDay: number | null;
    peakDay: string | null;
    peakEvents: number | null;
    peakQuantity: number;
    activeDays: number;
  };
}

export interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

export interface AnalyticsReport extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  status: "generating" | "ready" | "failed";
  time_range: TimeRange;
  download_url?: string;
}

export interface Dashboard extends Timestamps {
  id: string;
  organization_id: string;
  name: string;
  widgets: DashboardWidget[];
  is_default: boolean;
}

export interface DashboardWidget {
  id: string;
  type: "chart" | "number" | "table" | "map";
  metric: MetricType;
  config: Record<string, unknown>;
}

export interface CreateReportRequest {
  name: string;
  type: string;
  time_range: TimeRange;
  format?: "pdf" | "csv" | "json";
}
export interface CreateDashboardRequest {
  name: string;
  widgets?: DashboardWidget[];
  is_default?: boolean;
}

// ============================================================================
// Pulse API
// ============================================================================

/**
 * Analytics and business intelligence for streams, viewers, and quality.
 *
 * `getRevenueMetrics` is deprecated and throws — no gateway route has ever served org revenue
 * metrics (see its own doc comment below).
 *
 * @example
 * ```typescript
 * const engagement = await wave.pulse.getViewerAnalytics({ time_range: '7d' });
 * const timeseries = await wave.pulse.getTimeSeries('viewers', { time_range: '24h', granularity: 'hour' });
 * ```
 */
export class PulseAPI {
  private readonly client: WaveClient;
  private readonly basePath = "/v1/analytics";

  constructor(client: WaveClient) {
    this.client = client;
  }

  async getStreamAnalytics(streamId: string, params?: QueryParams): Promise<StreamAnalytics> {
    return this.client.get<StreamAnalytics>(`${this.basePath}/streams/${streamId}`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * Viewer/engagement analytics for the calling org.
   *
   * `/v1/analytics/viewers` was never served (always 404 `ROUTE_NOT_FOUND`) — wave-gateway's own
   * route manifest (`src/agent-plugin.ts`, `analytics/viewers→analytics/engagement`) names
   * `/v1/analytics/engagement` as the real, served successor, so this calls that instead. The
   * response shape changed to match (see `EngagementAnalytics`) — it is not the old per-viewer
   * geo/device/protocol breakdown, which no served route has ever returned.
   */
  async getViewerAnalytics(params?: QueryParams): Promise<EngagementAnalytics> {
    return this.client.get<EngagementAnalytics>(`${this.basePath}/engagement`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getQualityMetrics(params?: QueryParams): Promise<QualityMetrics> {
    return this.client.get<QualityMetrics>(`${this.basePath}/quality`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async getEngagementMetrics(params?: QueryParams): Promise<EngagementMetrics> {
    return this.client.get<EngagementMetrics>(`${this.basePath}/engagement`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  /**
   * @deprecated `/v1/analytics/revenue` has never been served — it 404s `ROUTE_NOT_FOUND` on
   * every call, live, today (re-verified against https://api.wave.online). No gateway route
   * (checked wave-gateway `src/analytics-routes.ts` / `src/gateway-native-owned-routes.ts` at
   * `main`) serves org revenue metrics under any path. Rather than ship a call that always 404s,
   * this throws immediately — no network call is made. Use `GET /v1/billing/usage` (cost/usage,
   * not revenue) via the gateway directly if that is what you need, or watch for a future
   * `pulse` release once a revenue-metrics route actually ships.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for call-site compatibility
  async getRevenueMetrics(params?: QueryParams): Promise<RevenueMetrics> {
    throw new WaveError(
      "getRevenueMetrics() is not supported: no WAVE gateway route serves org revenue metrics " +
        "(/v1/analytics/revenue was never served and 404s ROUTE_NOT_FOUND on every call). This " +
        "method throws instead of shipping a request that cannot succeed. See the free capability " +
        "index at https://gateway.wave.online/.well-known/wave-skills.json for what is actually served.",
      "METHOD_NOT_SUPPORTED",
      501,
    );
  }

  async getTimeSeries(metric: MetricType, params?: QueryParams): Promise<TimeSeriesPoint[]> {
    return this.client.get<TimeSeriesPoint[]>(`${this.basePath}/timeseries/${metric}`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createReport(request: CreateReportRequest): Promise<AnalyticsReport> {
    return this.client.post<AnalyticsReport>(`${this.basePath}/reports`, request);
  }

  async getReport(reportId: string): Promise<AnalyticsReport> {
    return this.client.get<AnalyticsReport>(`${this.basePath}/reports/${reportId}`);
  }

  async listReports(params?: PaginationParams): Promise<PaginatedResponse<AnalyticsReport>> {
    return this.client.get<PaginatedResponse<AnalyticsReport>>(`${this.basePath}/reports`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async listDashboards(params?: PaginationParams): Promise<PaginatedResponse<Dashboard>> {
    return this.client.get<PaginatedResponse<Dashboard>>(`${this.basePath}/dashboards`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  }

  async createDashboard(request: CreateDashboardRequest): Promise<Dashboard> {
    return this.client.post<Dashboard>(`${this.basePath}/dashboards`, request);
  }

  async getDashboard(dashboardId: string): Promise<Dashboard> {
    return this.client.get<Dashboard>(`${this.basePath}/dashboards/${dashboardId}`);
  }

  async updateDashboard(
    dashboardId: string,
    updates: Partial<CreateDashboardRequest>,
  ): Promise<Dashboard> {
    return this.client.patch<Dashboard>(`${this.basePath}/dashboards/${dashboardId}`, updates);
  }

  async removeDashboard(dashboardId: string): Promise<void> {
    await this.client.delete(`${this.basePath}/dashboards/${dashboardId}`);
  }
}

export function createPulseAPI(client: WaveClient): PulseAPI {
  return new PulseAPI(client);
}
