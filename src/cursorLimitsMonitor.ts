/**
 * Cursor Pro Limits Monitor
 * Monitors usage and quotas for Cursor Pro services
 */

import {
  CursorProLimits,
  CursorProQuotas,
  UsageStats,
  ServiceUsage,
  SubscriptionTier,
} from './types';

export class CursorLimitsMonitor {
  private limits: CursorProLimits;
  private quotas: CursorProQuotas;
  private updateCallbacks: Array<(_stats: UsageStats) => void> = [];

  constructor(tier: SubscriptionTier = 'pro') {
    this.limits = {
      sonnet45Requests: 0,
      geminiRequests: 0,
      gpt5Requests: 0,
      totalRequests: 0,
      lastUpdated: new Date(),
    };

    this.quotas = this.getQuotasForTier(tier);
  }

  /**
   * Get quotas for a specific subscription tier
   */
  private getQuotasForTier(tier: SubscriptionTier): CursorProQuotas {
    switch (tier) {
      case 'pro':
        return {
          maxSonnet45Requests: 225,
          maxGeminiRequests: 550,
          maxGpt5Requests: 500,
          maxTotalRequests: 1275,
          tier: 'pro',
        };
      case 'pro-plus':
        return {
          maxSonnet45Requests: 675,
          maxGeminiRequests: 1650,
          maxGpt5Requests: 1500,
          maxTotalRequests: 3825,
          tier: 'pro-plus',
        };
      case 'ultra':
        return {
          maxSonnet45Requests: 4500,
          maxGeminiRequests: 11000,
          maxGpt5Requests: 10000,
          maxTotalRequests: 25500,
          tier: 'ultra',
        };
      default:
        return {
          maxSonnet45Requests: 225,
          maxGeminiRequests: 550,
          maxGpt5Requests: 500,
          maxTotalRequests: 1275,
          tier: 'pro',
        };
    }
  }

  /**
   * Update subscription tier
   */
  public updateTier(tier: SubscriptionTier): void {
    this.quotas = this.getQuotasForTier(tier);
    this.notifyCallbacks();
  }

  /**
   * Get current subscription tier
   */
  public getCurrentTier(): SubscriptionTier {
    return this.quotas.tier;
  }

  /**
   * Update usage limits from external source
   */
  public updateLimits(newLimits: Partial<CursorProLimits>): void {
    this.limits = {
      ...this.limits,
      ...newLimits,
      lastUpdated: new Date(),
    };

    this.notifyCallbacks();
  }

  /**
   * Get current usage statistics
   */
  public getUsageStats(): UsageStats {
    const usagePercentages = {
      sonnet45: this.calculatePercentage(
        this.limits.sonnet45Requests,
        this.quotas.maxSonnet45Requests
      ),
      gemini: this.calculatePercentage(
        this.limits.geminiRequests,
        this.quotas.maxGeminiRequests
      ),
      gpt5: this.calculatePercentage(
        this.limits.gpt5Requests,
        this.quotas.maxGpt5Requests
      ),
      total: this.calculatePercentage(
        this.limits.totalRequests,
        this.quotas.maxTotalRequests
      ),
    };

    const remaining = {
      sonnet45: Math.max(
        0,
        this.quotas.maxSonnet45Requests - this.limits.sonnet45Requests
      ),
      gemini: Math.max(
        0,
        this.quotas.maxGeminiRequests - this.limits.geminiRequests
      ),
      gpt5: Math.max(0, this.quotas.maxGpt5Requests - this.limits.gpt5Requests),
      total: Math.max(
        0,
        this.quotas.maxTotalRequests - this.limits.totalRequests
      ),
    };

    return {
      limits: { ...this.limits },
      quotas: { ...this.quotas },
      usagePercentages,
      remaining,
    };
  }

  /**
   * Get usage for a specific service
   */
  public getServiceUsage(
    service: 'sonnet45' | 'gemini' | 'gpt5' | 'total'
  ): ServiceUsage {
    const stats = this.getUsageStats();
    const current = this.getCurrentUsage(service);
    const max = this.getMaxUsage(service);
    const percentage = stats.usagePercentages[service];
    const remaining = stats.remaining[service];

    return {
      service,
      current,
      max,
      percentage,
      remaining,
      isWarning: percentage >= 0.8,
      isCritical: percentage >= 0.95,
    };
  }

  /**
   * Check if any service is approaching limits
   */
  public checkAlerts(): ServiceUsage[] {
    const services: Array<'sonnet45' | 'gemini' | 'gpt5' | 'total'> = [
      'sonnet45',
      'gemini',
      'gpt5',
      'total',
    ];

    return services
      .map(service => this.getServiceUsage(service))
      .filter(usage => usage.isWarning || usage.isCritical);
  }

  /**
   * Add callback for usage updates
   */
  public onUpdate(callback: (_stats: UsageStats) => void): void {
    this.updateCallbacks.push(callback);
  }

  /**
   * Remove update callback
   */
  public removeUpdateCallback(callback: (_stats: UsageStats) => void): void {
    const index = this.updateCallbacks.indexOf(callback);
    if (index > -1) {
      this.updateCallbacks.splice(index, 1);
    }
  }

  private getCurrentUsage(
    service: 'sonnet45' | 'gemini' | 'gpt5' | 'total'
  ): number {
    switch (service) {
      case 'sonnet45':
        return this.limits.sonnet45Requests;
      case 'gemini':
        return this.limits.geminiRequests;
      case 'gpt5':
        return this.limits.gpt5Requests;
      case 'total':
        return this.limits.totalRequests;
      default:
        return 0;
    }
  }

  private getMaxUsage(
    service: 'sonnet45' | 'gemini' | 'gpt5' | 'total'
  ): number {
    switch (service) {
      case 'sonnet45':
        return this.quotas.maxSonnet45Requests;
      case 'gemini':
        return this.quotas.maxGeminiRequests;
      case 'gpt5':
        return this.quotas.maxGpt5Requests;
      case 'total':
        return this.quotas.maxTotalRequests;
      default:
        return 0;
    }
  }

  private calculatePercentage(current: number, max: number): number {
    if (max === 0) return 0;
    return Math.min(100, (current / max) * 100);
  }

  private notifyCallbacks(): void {
    const stats = this.getUsageStats();
    this.updateCallbacks.forEach(callback => callback(stats));
  }
}
