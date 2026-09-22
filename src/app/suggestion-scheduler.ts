"use server";

import { startSuggestionScheduler } from "@/lib/suggestion-scheduler";

// Start the suggestion engine scheduler on server startup
// This runs only once due to the flag in startSuggestionScheduler
startSuggestionScheduler();

// Export nothing to avoid accidental imports
export {};