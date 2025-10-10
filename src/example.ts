/**
 * Example usage of Cursor Pro Limits MCP Server
 * This file demonstrates how to use the monitor programmatically
 */

import { CursorLimitsMonitor } from './cursorLimitsMonitor.js';

// Create a monitor instance
const monitor = new CursorLimitsMonitor();

// Example: Simulate some usage
console.log('=== Cursor Pro Limits Monitor Example ===\n');

// Update with some sample data
monitor.updateLimits({
  sonnet45Requests: 150,
  geminiRequests: 300,
  gpt5Requests: 200,
  totalRequests: 650,
});

// Get usage statistics
const stats = monitor.getUsageStats();
console.log('Current Usage Statistics:');
console.log(
  `Sonnet 4.5: ${stats.limits.sonnet45Requests}/${stats.quotas.maxSonnet45Requests} (${stats.usagePercentages.sonnet45.toFixed(1)}%)`
);
console.log(
  `Gemini: ${stats.limits.geminiRequests}/${stats.quotas.maxGeminiRequests} (${stats.usagePercentages.gemini.toFixed(1)}%)`
);
console.log(
  `GPT-5: ${stats.limits.gpt5Requests}/${stats.quotas.maxGpt5Requests} (${stats.usagePercentages.gpt5.toFixed(1)}%)`
);
console.log(
  `Total: ${stats.limits.totalRequests}/${stats.quotas.maxTotalRequests} (${stats.usagePercentages.total.toFixed(1)}%)\n`
);

// Check for alerts
const alerts = monitor.checkAlerts();
if (alerts.length > 0) {
  console.log('⚠️  Alerts:');
  alerts.forEach(alert => {
    const status = alert.isCritical ? 'CRITICAL' : 'WARNING';
    console.log(
      `- ${alert.service.toUpperCase()}: ${status} (${alert.percentage.toFixed(1)}% used)`
    );
  });
} else {
  console.log('✅ No alerts - all services within normal limits');
}

// Get specific service usage
console.log('\n=== Service Details ===');
const services: Array<'sonnet45' | 'gemini' | 'gpt5' | 'total'> = [
  'sonnet45',
  'gemini',
  'gpt5',
  'total',
];

services.forEach(service => {
  const usage = monitor.getServiceUsage(service);
  const status = usage.isCritical
    ? '🔴 CRITICAL'
    : usage.isWarning
      ? '🟡 WARNING'
      : '🟢 OK';
  console.log(
    `${service.toUpperCase()}: ${status} - ${usage.current}/${usage.max} (${usage.percentage.toFixed(1)}%)`
  );
});

// Subscribe to updates
monitor.onUpdate(updatedStats => {
  console.log('\n📊 Usage updated:');
  console.log(`Total requests: ${updatedStats.limits.totalRequests}`);
});

// Simulate another update
console.log('\n=== Simulating Usage Update ===');
monitor.updateLimits({
  sonnet45Requests: 200, // Increased usage
  geminiRequests: 500, // Near limit
  gpt5Requests: 450, // Near limit
  totalRequests: 1150, // High total usage
});

// Check alerts again
const newAlerts = monitor.checkAlerts();
if (newAlerts.length > 0) {
  console.log('\n⚠️  New Alerts:');
  newAlerts.forEach(alert => {
    const status = alert.isCritical ? 'CRITICAL' : 'WARNING';
    console.log(
      `- ${alert.service.toUpperCase()}: ${status} (${alert.percentage.toFixed(1)}% used)`
    );
  });
}
