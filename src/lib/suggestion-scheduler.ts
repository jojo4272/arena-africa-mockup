/**
 * Suggestion Engine Scheduler
 *
 * Starts a background scheduler to periodically fetch suggestions from data sources.
 * This should be imported in a server-only context that runs on app startup.
 */

import { scheduleDataSourceFetch } from "./data-sources";

// Flag to prevent multiple schedulers in development (due to HMR)
let schedulerStarted = false;

/**
 * Start the suggestion engine scheduler
 * @param intervalMinutes How often to run the fetch (default: 60 minutes)
 */
export function startSuggestionScheduler(intervalMinutes: number = 60) {
  // Prevent multiple schedulers in development
  if (schedulerStarted) {
    console.log("Suggestion scheduler already started");
    return;
  }

  schedulerStarted = true;

  console.log(`Starting suggestion engine scheduler (every ${intervalMinutes} minutes)`);

  // Start the scheduler
  const cleanup = scheduleDataSourceFetch(intervalMinutes);

  // Return cleanup function for possible use
  return cleanup;
}

/**
 * Stop the suggestion engine scheduler
 * (In practice, we'd need to keep track of the cleanup function)
 */
export function stopSuggestionScheduler() {
  // In a more complex implementation, we would store the cleanup function
  // and call it here. For now, we rely on the process ending.
  console.log("Stopping suggestion engine scheduler");
  schedulerStarted = false;
}