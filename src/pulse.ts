/**
 * WAVE SDK - Pulse Analytics API
 *
 * Analytics, metrics, and business intelligence for streams and viewers.
 */

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
 * Analytics and business intelligence for streams, viewers, quality, and revenue.
 *
 * @example
 * ```typescript
 * const viewers = await wave.pulse.getViewerAnalytics({ time_range: '7d' });
 * const revenue = await wave.pulse.getRevenueMetrics({ time_range: '30d' });
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

  async getViewerAnalytics(params?: QueryParams): Promise<ViewerAnalytics> {
    return this.client.get<ViewerAnalytics>(`${this.basePath}/viewers`, {
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

  async getRevenueMetrics(params?: QueryParams): Promise<RevenueMetrics> {
    return this.client.get<RevenueMetrics>(`${this.basePath}/revenue`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
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
