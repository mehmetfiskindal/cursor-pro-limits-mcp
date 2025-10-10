/**
 * Types and interfaces for Cursor Pro Limits MCP Server
 */

export interface CursorProLimits {
  /** Current usage for Sonnet 4.5 requests */
  sonnet45Requests: number;
  /** Current usage for Gemini requests */
  geminiRequests: number;
  /** Current usage for GPT-5 requests */
  gpt5Requests: number;
  /** Total requests made today */
  totalRequests: number;
  /** Last updated timestamp */
  lastUpdated: Date;
}

export type SubscriptionTier = 'pro' | 'pro-plus' | 'ultra';

export interface CursorProQuotas {
  /** Maximum Sonnet 4.5 requests per month */
  maxSonnet45Requests: number;
  /** Maximum Gemini requests per month */
  maxGeminiRequests: number;
  /** Maximum GPT-5 requests per month */
  maxGpt5Requests: number;
  /** Total maximum requests per month */
  maxTotalRequests: number;
  /** Subscription tier */
  tier: SubscriptionTier;
}

export interface UsageStats {
  limits: CursorProLimits;
  quotas: CursorProQuotas;
  /** Usage percentage for each service */
  usagePercentages: {
    sonnet45: number;
    gemini: number;
    gpt5: number;
    total: number;
  };
  /** Remaining requests for each service */
  remaining: {
    sonnet45: number;
    gemini: number;
    gpt5: number;
    total: number;
  };
}

export interface AlertThresholds {
  /** Warning threshold (0-1) */
  warning: number;
  /** Critical threshold (0-1) */
  critical: number;
}

export interface CursorProConfig {
  /** API endpoints for monitoring */
  endpoints: {
    usage: string;
    limits: string;
  };
  /** Alert thresholds */
  alerts: AlertThresholds;
  /** Update interval in milliseconds */
  updateInterval: number;
}

export type ServiceType = 'sonnet45' | 'gemini' | 'gpt5' | 'total';

export interface ServiceUsage {
  service: ServiceType;
  current: number;
  max: number;
  percentage: number;
  remaining: number;
  isWarning: boolean;
  isCritical: boolean;
}
