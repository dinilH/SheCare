// SheCare Period Service -Ballerina Implementation

import ballerina/http;
import ballerina/time;
import ballerina/log;

// ========== DATA STORAGE ==========
// In-memory storage for demonstration (production would use a database)
map<PeriodRequest> userPeriodData = {};
map<PeriodRequest[]> userPeriodHistory = {};

// ========== TYPE DEFINITIONS ==========

// Period tracking request payload
type PeriodRequest record {
    string lastPeriodStartDate;    // ISO date format (YYYY-MM-DD)
    int periodLength;              // Duration of menstruation (typically 3-7 days)
    int averageCycleLength;        // Average cycle length (typically 21-35 days)
};

// Month information with leap year calculations
type MonthInfo record {
    string month;                  // Month name (January, February, etc.)
    int year;                      // Year (YYYY)
    int daysInMonth;              // Days in this month (28-31)
    boolean isLeapYear;           // Whether this year is a leap year
};

// Period prediction for a specific cycle
type PeriodPrediction record {
    int periodNumber;             // Cycle number (1, 2, 3...)
    string periodStartDate;       // Predicted period start date
    string periodEndDate;         // Predicted period end date
    string ovulationDate;         // Predicted ovulation date (typically cycle day 14)
    string fertileWindowStart;   // Start of fertile window (5 days before ovulation)
    string fertileWindowEnd;     // End of fertile window (1 day after ovulation)
    int cycleDay;                // Current cycle day
    MonthInfo monthInfo;         // Month details
};

// Individual calendar day information
type CalendarDay record {
    string date;                  // Date in YYYY-MM-DD format
    string dayType;              // "period", "ovulation", "fertile", "regular"
    int cycleDay;                // Day within the menstrual cycle (1-28+)
    string phase;                // "menstrual", "follicular", "ovulation", "luteal"
    boolean isPredicted;         // Whether this is a prediction or actual data
};

// API response format for period predictions
type PeriodResponse record {
    boolean success;             // Whether the operation was successful
    string message;              // Response message or error description
    PeriodPrediction[] predictions?;  // Array of future cycle predictions
    CalendarDay[] calendarData?;     // Calendar data with cycle information
    string nextPeriodDate?;      // Next predicted period start date
    string nextOvulationDate?;   // Next predicted ovulation date
};

// ========== HTTP SERVICE CONFIGURATION ==========

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000", "http://localhost:3001"],
        allowCredentials: false,
        allowHeaders: ["Content-Type"],
        allowMethods: ["GET", "POST", "OPTIONS"]
    }
}
service /api/period on new http:Listener(8081) {
    
    // ========== HEALTH CHECK ENDPOINT ==========
    // Health check endpoint to verify service availability
    // @return JSON response with service status and timestamp
    resource function get health() returns json {
        log:printInfo("Period service health check - Pure Ballerina implementation");
        return {
            success: true,
            message: "Period prediction API running with pure Ballerina calculations",
            timestamp: time:utcToString(time:utcNow())
        };
    }

    // ========== PERIOD PREDICTION ENDPOINT ==========
    // Generate period predictions using pure Ballerina time mathematics
    // @param request - Period tracking information (last period date, lengths)
    // @return Comprehensive period predictions with calendar data
    resource function post predict(PeriodRequest request) returns PeriodResponse|error {
        log:printInfo("Generating period predictions with Ballerina for cycle length: " + request.averageCycleLength.toString());
        
        // Store user period data for historical tracking
        userPeriodData["default_user"] = request;
        
        // Add to period history for better calendar tracking
        PeriodRequest[]? existingHistory = userPeriodHistory["default_user"];
        if (existingHistory is PeriodRequest[]) {
            // Check if this period date already exists
            boolean exists = false;
            foreach var entry in existingHistory {
                if (entry.lastPeriodStartDate == request.lastPeriodStartDate) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                existingHistory.push(request);
            }
        } else {
            userPeriodHistory["default_user"] = [request];
        }
        
        // Parse the input date
        string inputDate = request.lastPeriodStartDate + "T00:00:00Z";
        time:Utc|error lastPeriodStartResult = time:utcFromString(inputDate);
        if (lastPeriodStartResult is error) {
            return {
                success: false,
                message: "Invalid date format: " + lastPeriodStartResult.message()
            };
        }
        time:Utc lastPeriodStart = lastPeriodStartResult;
            
        // Generate predictions for next 6 cycles
        PeriodPrediction[] predictions = [];
        CalendarDay[] calendarData = [];
        
        int cycleLength = request.averageCycleLength;
        int periodLength = request.periodLength;
        
        // Generate predictions for next 6 months
        foreach int i in 0...5 {
            time:Utc cycleStartTime = time:utcAddSeconds(lastPeriodStart, i * cycleLength * 24 * 3600);
            time:Utc cycleEndTime = time:utcAddSeconds(cycleStartTime, (periodLength - 1) * 24 * 3600);
            time:Utc ovulationTime = time:utcAddSeconds(cycleStartTime, (cycleLength - 14) * 24 * 3600);
            time:Utc fertileStart = time:utcAddSeconds(ovulationTime, -5 * 24 * 3600);
            time:Utc fertileEnd = time:utcAddSeconds(ovulationTime, 1 * 24 * 3600);
            
            // Convert to civil time for month info
            time:Civil cycleCivil = time:utcToCivil(cycleStartTime);
            
            PeriodPrediction prediction = {
                periodNumber: i + 1,
                periodStartDate: time:utcToString(cycleStartTime).substring(0, 10),
                periodEndDate: time:utcToString(cycleEndTime).substring(0, 10),
                ovulationDate: time:utcToString(ovulationTime).substring(0, 10),
                fertileWindowStart: time:utcToString(fertileStart).substring(0, 10),
                fertileWindowEnd: time:utcToString(fertileEnd).substring(0, 10),
                cycleDay: 1,
                monthInfo: {
                    month: getMonthName(cycleCivil.month),
                    year: cycleCivil.year,
                    daysInMonth: getDaysInMonth(cycleCivil.month, cycleCivil.year),
                    isLeapYear: isLeapYear(cycleCivil.year)
                }
            };
            
            predictions.push(prediction);
        }
        
        // Generate calendar data for the next 3 months
        calendarData = generateCalendarData(lastPeriodStart, cycleLength, periodLength);
        
        return {
            success: true,
            message: "Period predictions generated successfully",
            predictions: predictions,
            calendarData: calendarData,
            nextPeriodDate: predictions[1].periodStartDate,
            nextOvulationDate: predictions[1].ovulationDate
        };
    }

    // Get calendar data for a specific month
    resource function get calendar/[string year]/[string month]() returns PeriodResponse|error {
        log:printInfo("Getting calendar data for year: " + year + ", month: " + month);
        
        // Parse year and month
        int yearInt = check int:fromString(year);
        int monthInt = check int:fromString(month);
        
        // Get user's period history (in real app, this would be based on user ID)
        PeriodRequest[]? userHistory = userPeriodHistory["default_user"];
        
        CalendarDay[] monthCalendarData = [];
        
        if (userHistory is PeriodRequest[] && userHistory.length() > 0) {
            // Find the most relevant period data for this month
            PeriodRequest? relevantPeriod = findRelevantPeriodForMonth(userHistory, yearInt, monthInt);
            
            if (relevantPeriod is PeriodRequest) {
                time:Utc lastPeriodStart = check time:utcFromString(relevantPeriod.lastPeriodStartDate + "T00:00:00Z");
                monthCalendarData = generateMonthCalendarData(lastPeriodStart, yearInt, monthInt, relevantPeriod.averageCycleLength, relevantPeriod.periodLength);
            } else {
                // Use sample data if no relevant period found
                string samplePeriodDate = year + "-" + (monthInt < 10 ? "0" + monthInt.toString() : monthInt.toString()) + "-15";
                time:Utc sampleStartDate = check time:utcFromString(samplePeriodDate + "T00:00:00Z");
                monthCalendarData = generateMonthCalendarData(sampleStartDate, yearInt, monthInt, 28, 5);
            }
        } else {
            // Use sample data if no user data exists
            string samplePeriodDate = year + "-" + (monthInt < 10 ? "0" + monthInt.toString() : monthInt.toString()) + "-15";
            time:Utc sampleStartDate = check time:utcFromString(samplePeriodDate + "T00:00:00Z");
            monthCalendarData = generateMonthCalendarData(sampleStartDate, yearInt, monthInt, 28, 5);
        }
        
        return {
            success: true,
            message: "Calendar data retrieved for " + getMonthName(monthInt) + " " + year,
            calendarData: monthCalendarData
        };
    }
}

// Find the most relevant period data for a specific month
function findRelevantPeriodForMonth(PeriodRequest[] periodHistory, int year, int month) returns PeriodRequest? {
    // Target date for the month (middle of the month)
    time:Civil targetDate = {
        year: year,
        month: month,
        day: 15,
        hour: 0,
        minute: 0,
        second: 0
    };
    time:Utc|error targetUtcResult = time:utcFromCivil(targetDate);
    if (targetUtcResult is error) {
        return (); // Return null on error
    }
    time:Utc targetUtc = targetUtcResult;
    
    PeriodRequest? closestPeriod = ();
    decimal minDiffSeconds = 999999999999d; // Large number
    
    // Find the period entry closest to the target month
    foreach var period in periodHistory {
        time:Utc|error periodUtcResult = time:utcFromString(period.lastPeriodStartDate + "T00:00:00Z");
        if (periodUtcResult is error) {
            continue; // Skip invalid dates
        }
        time:Utc periodUtc = periodUtcResult;
        
        // Calculate absolute difference in seconds
        decimal diffSeconds = time:utcDiffSeconds(targetUtc, periodUtc);
        if (diffSeconds < 0d) {
            diffSeconds = -diffSeconds;
        }
        
        // Check if this period could affect the target month
        // Consider periods within 2 cycles of the target month
        decimal maxRelevantDiff = <decimal>(2 * period.averageCycleLength * 24 * 3600); // 2 cycles in seconds
        
        if (diffSeconds <= maxRelevantDiff && diffSeconds < minDiffSeconds) {
            minDiffSeconds = diffSeconds;
            closestPeriod = period;
        }
    }
    
    return closestPeriod;
}

// Helper function to get month name
function getMonthName(int month) returns string {
    match month {
        1 => { return "January"; }
        2 => { return "February"; }
        3 => { return "March"; }
        4 => { return "April"; }
        5 => { return "May"; }
        6 => { return "June"; }
        7 => { return "July"; }
        8 => { return "August"; }
        9 => { return "September"; }
        10 => { return "October"; }
        11 => { return "November"; }
        12 => { return "December"; }
        _ => { return "Unknown"; }
    }
}

// Helper function to check if year is leap year
function isLeapYear(int year) returns boolean {
    return (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);
}

// Helper function to get days in month
function getDaysInMonth(int month, int year) returns int {
    match month {
        1|3|5|7|8|10|12 => { return 31; }
        4|6|9|11 => { return 30; }
        2 => { 
            if (isLeapYear(year)) {
                return 29;
            } else {
                return 28;
            }
        }
        _ => { return 30; }
    }
}

// Generate calendar data with period tracking
function generateCalendarData(time:Utc startDate, int cycleLength, int periodLength) returns CalendarDay[] {
    CalendarDay[] calendarData = [];
    
    // Generate data for next 90 days (3 months)
    foreach int i in 0...89 {
        time:Utc currentDate = time:utcAddSeconds(startDate, i * 24 * 3600);
        string dateStr = time:utcToString(currentDate).substring(0, 10);
        
        // Calculate cycle day
        int daysSinceStart = i;
        int cycleDay = (daysSinceStart % cycleLength) + 1;
        
        // Determine day type and phase
        string dayType = "regular";
        string phase = "follicular";
        boolean isPredicted = i > 0; // First day is actual data
        
        if (cycleDay <= periodLength) {
            dayType = "period";
            phase = "menstrual";
        } else if (cycleDay == (cycleLength - 14)) {
            dayType = "ovulation";
            phase = "ovulation";
        } else if (cycleDay >= (cycleLength - 14 - 5) && cycleDay <= (cycleLength - 14 + 1)) {
            dayType = "fertile";
            phase = "ovulation";
        } else if (cycleDay > (cycleLength - 14)) {
            phase = "luteal";
        }
        
        CalendarDay calendarDay = {
            date: dateStr,
            dayType: dayType,
            cycleDay: cycleDay,
            phase: phase,
            isPredicted: isPredicted
        };
        
        calendarData.push(calendarDay);
    }
    
    return calendarData;
}

// Generate calendar data for a specific month only
function generateMonthCalendarData(time:Utc lastPeriodStart, int year, int month, int cycleLength, int periodLength) returns CalendarDay[] {
    CalendarDay[] calendarData = [];
    
    // Get the first day of the requested month
    time:Civil monthStart = {
        year: year,
        month: month,
        day: 1,
        hour: 0,
        minute: 0,
        second: 0
    };
    time:Utc|error monthStartResult = time:utcFromCivil(monthStart);
    if (monthStartResult is error) {
        return calendarData; // Return empty array on error
    }
    time:Utc monthStartUtc = monthStartResult;
    
    // Get number of days in the month
    int daysInMonth = getDaysInMonth(month, year);
    
    // Calculate days difference between last period start and month start
    decimal diffSeconds = time:utcDiffSeconds(monthStartUtc, lastPeriodStart);
    int daysDiff = <int>(diffSeconds / (24 * 3600));
    
    // Generate data for each day of the month
    foreach int day in 1...daysInMonth {
        time:Civil currentDay = {
            year: year,
            month: month,
            day: day,
            hour: 0,
            minute: 0,
            second: 0
        };
        time:Utc|error currentDayResult = time:utcFromCivil(currentDay);
        if (currentDayResult is error) {
            continue; // Skip this day on error
        }
        time:Utc currentDayUtc = currentDayResult;
        string dateStr = time:utcToString(currentDayUtc).substring(0, 10);
        
        // Calculate cycle day for this specific date
        int daysSinceLastPeriod = daysDiff + (day - 1);
        int cycleDay = (daysSinceLastPeriod % cycleLength) + 1;
        if (cycleDay <= 0) {
            cycleDay = cycleLength + cycleDay;
        }
        
        // Determine day type and phase
        string dayType = "regular";
        string phase = "follicular";
        boolean isPredicted = daysSinceLastPeriod > 0;
        
        if (cycleDay <= periodLength) {
            dayType = "period";
            phase = "menstrual";
        } else if (cycleDay == (cycleLength - 14)) {
            dayType = "ovulation";
            phase = "ovulation";
        } else if (cycleDay >= (cycleLength - 14 - 5) && cycleDay <= (cycleLength - 14 + 1)) {
            dayType = "fertile";
            phase = "ovulation";
        } else if (cycleDay > (cycleLength - 14)) {
            phase = "luteal";
        }
        
        CalendarDay calendarDay = {
            date: dateStr,
            dayType: dayType,
            cycleDay: cycleDay,
            phase: phase,
            isPredicted: isPredicted
        };
        
        calendarData.push(calendarDay);
    }
    
    return calendarData;
}
