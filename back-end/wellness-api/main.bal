// SheCare Wellness Service -Ballerina Implementation

// Port: 8082


import ballerina/http;
import ballerina/log;

//TYPE DEFINITIONS

// Wellness tracking entry for daily health metrics
type WellnessEntry record {
    string userId;              // Unique user identifier
    string date;                // Entry date in YYYY-MM-DD format
    int mood;                   // Mood rating (1-5 scale)
    int energy;                 // Energy level (1-5 scale)
    decimal sleep;              // Hours of sleep (e.g., 8.5)
    int water;                  // Water intake (glasses/cups)
    string notes?;              // Optional wellness notes
};

// DATA STORAGE
// In-memory storage for demonstration (production would use a database)
map<WellnessEntry[]> wellnessStore = {};

// HTTP SERVICE CONFIGURATION

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000", "http://localhost:3001"],
        allowCredentials: false,
        allowHeaders: ["Content-Type"],
        allowMethods: ["GET", "POST", "OPTIONS"]
    }
}
service /api/wellness on new http:Listener(8082) {

    // ========== HEALTH CHECK ENDPOINT ==========
    // Health check endpoint to verify service availability
    // @return JSON response with service status
    resource function get health() returns json {
        log:printInfo("Wellness service health check - Pure Ballerina implementation");
        return {
            success: true,
            message: "Wellness API running with pure Ballerina processing",
            timestamp: "2025-07-28T15:00:00Z"
        };
    }

    // ========== WELLNESS ENTRY ENDPOINTS ==========
    
    // Add a new wellness entry for a user
    // @param entry - Wellness entry data (mood, energy, sleep, etc.)
    // @return JSON response with success status
    resource function post entries(@http:Payload WellnessEntry entry) returns json {
        log:printInfo("Adding wellness entry for user: " + entry.userId);
        
        // Retrieve existing entries for user or create new array
        WellnessEntry[] userEntries = wellnessStore[entry.userId] ?: [];
        userEntries.push(entry);
        wellnessStore[entry.userId] = userEntries;
        
        return {
            success: true,
            message: "Wellness entry added successfully with Ballerina processing",
            data: entry.toJson()
        };
    }

    // Get all wellness entries for a specific user
    // @param userId - User identifier in URL path
    // @return JSON response with user's wellness history
    resource function get users/[string userId]/entries() returns json {
        log:printInfo("Fetching wellness entries for user: " + userId);
        
        // Retrieve user's wellness entries from storage
        WellnessEntry[] entries = wellnessStore[userId] ?: [];
        
        return {
            success: true,
            message: "Wellness entries retrieved with Ballerina",
            data: entries.toJson()
        };
    }
}
