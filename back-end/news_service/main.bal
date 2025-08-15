import ballerina/http;
import ballerina/log;
import ballerina/url;

final string apiKey = "";

enum AuthMode { HEADER, QUERY }
final AuthMode PRIMARY_AUTH_MODE = HEADER;

final NewsArticle[] MOCK_ARTICLES = [
    {
        id: "mock_1",
        title: "Understanding Menstrual Health: A Comprehensive Guide",
        description: "Educational overview of menstrual cycle phases and common symptoms.",
        url: "https://example.com/menstrual-health-guide",
        imageUrl: "/placeholder.svg",
        publishedAt: "2025-08-11T08:00:00Z",
        newsSource: "SheCare Demo",
        category: "Reproductive Health",
        isBookmarked: false
    },
    {
        id: "mock_2",
        title: "Nutrition Tips to Support Hormonal Balance",
        description: "Key foods and nutrients that help balance hormones naturally.",
        url: "https://example.com/hormone-nutrition",
        imageUrl: "/placeholder.svg",
        publishedAt: "2025-08-11T07:30:00Z",
        newsSource: "SheCare Demo",
        category: "Nutrition",
        isBookmarked: false
    },
    {
        id: "mock_3",
        title: "Managing Stress: Mental Health Strategies for Women",
        description: "Practical techniques to reduce stress and improve resilience.",
        url: "https://example.com/stress-management",
        imageUrl: "/placeholder.svg",
        publishedAt: "2025-08-11T06:45:00Z",
        newsSource: "SheCare Demo",
        category: "Mental Health",
        isBookmarked: false
    }
];

function attemptNewsFetch(http:Client httpClient, string basePath, string key) returns http:Response|error {
    http:Response|error primary = executeNewsRequest(httpClient, basePath, key, PRIMARY_AUTH_MODE);
    if (primary is http:Response) {
        primary.setHeader("X-Auth-Mode", PRIMARY_AUTH_MODE.toString());
        if (primary.statusCode == 401) {
            string body = getBodySnippet(primary);
            log:printError("Primary auth 401", mode = PRIMARY_AUTH_MODE.toString(), body = body);
            AuthMode fallbackMode = PRIMARY_AUTH_MODE == HEADER ? QUERY : HEADER;
            http:Response|error secondary = executeNewsRequest(httpClient, basePath, key, fallbackMode);
            if (secondary is http:Response) {
                secondary.setHeader("X-Auth-Mode", fallbackMode.toString());
                if (secondary.statusCode == 401) {
                    string body2 = getBodySnippet(secondary);
                    log:printError("Fallback auth also 401", mode = fallbackMode.toString(), body = body2);
                }
            }
            // Return secondary (even if error) so caller can decide next fallback (/top-headlines)
            return secondary;
        }
    }
    return primary;
}

function executeNewsRequest(http:Client httpClient, string basePath, string key, AuthMode mode) returns http:Response|error {
    map<string|string[]> headers = { "User-Agent": "SheCareNewsService/1.0" };
    string path = basePath;
    if (mode == HEADER) {
        headers["X-Api-Key"] = key; // Official header method
    } else if (mode == QUERY) {
        path = path + "&apiKey=" + key; // Query param fallback
    }
    log:printInfo("News API request", mode = mode.toString(), path = path);
    return httpClient->get(path, headers = headers);
}

function getBodySnippet(http:Response r) returns string {
    var txt = r.getTextPayload();
    if (txt is string) {
        if (txt.length() > 400) {
            return txt.substring(0, 400) + "...";
        }
        return txt;
    }
    return "";
}

// Fallback to top-headlines (less restrictive) if everything endpoint consistently fails
function fetchTopHeadlines(http:Client httpClient, string key) returns http:Response|error {
    string path = "/v2/top-headlines?category=health&language=en&pageSize=20";
    map<string|string[]> headers = {"X-Api-Key": key, "User-Agent": "SheCareNewsService/1.0"};
    log:printError("Attempting fallback /v2/top-headlines due to repeated 401 on /v2/everything");
    return httpClient->get(path, headers = headers);
}

type NewsArticle record {
    string id;
    string title;
    string description;
    string url;
    string imageUrl;
    string publishedAt;
    string newsSource;
    string category;
    boolean isBookmarked;
};

type NewsResponse record {
    boolean success;
    string? message?;
    NewsArticle[] articles;
    int? totalResults?;
};

map<boolean> bookmarkedArticles = {};

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000"],
        allowCredentials: false,
        allowHeaders: ["*"],
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"]
    }
}
service /api/news on new http:Listener(8060) {

    resource function get health() returns json {
        log:printInfo("News service health check - Pure Ballerina implementation");
        return {
            success: true,
            message: "News API running with pure Ballerina news aggregation",
            timestamp: "2025-07-28T15:00:00Z"
        };
    }

    resource function get articles(string? category, string? search, int page = 1, int pageSize = 20) returns NewsResponse|error {
        string categoryStr = category is string ? category : "All";
        string searchStr = search is string ? search : "None";
        log:printInfo("Fetching women's health news - Category: " + categoryStr + ", Search: " + searchStr);

    http:Client newsApiClient = check new("https://newsapi.org", timeout = 60);

        // Build a minimal, compliant query first (avoid complex boolean until auth confirmed)
        string finalQuery = search is string && search.trim().length() > 0 ? search.trim() : "women's health";
        string encodedQuery = check url:encode(finalQuery, "UTF-8");
        string basePath = "/v2/everything?q=" + encodedQuery +
            "&pageSize=" + pageSize.toString() +
            "&page=" + page.toString() +
            "&language=en&sortBy=publishedAt";

        log:printInfo("Final Query (raw): " + finalQuery);
        
        http:Response|error response = attemptNewsFetch(newsApiClient, basePath, apiKey);        if (response is error) {
            log:printError("Error calling NewsAPI (transport / client error)", 'error = response);
            return {
                success: false,
                message: "Failed to fetch news: " + response.message(),
                articles: []
            };
        }

    if (response.statusCode == 200) {
            json|error jsonResponse = response.getJsonPayload();
            if (jsonResponse is error) {
                log:printError("Error parsing JSON response", 'error = jsonResponse);
                return {
                    success: false,
                    message: "Failed to parse news data",
                    articles: []
                };
            }

            // Transform NewsAPI response to our format
            NewsArticle[] transformedArticles = [];
            json articlesArray = check jsonResponse.articles;
            
            if (articlesArray is json[]) {
                int index = 0;
                foreach json article in articlesArray {
                    string articleId = "news_" + index.toString();
                    
                    // Safely extract fields with proper error handling
                    string title = "";
                    string description = "";
                    string articleUrl = "";
                    string imageUrl = "/placeholder.svg";
                    string publishedAt = "";
                    string sourceName = "Unknown Source";
                    
                    // Extract title
                    json|error titleResult = article.title;
                    if (titleResult is json && titleResult is string) {
                        title = titleResult;
                    }
                    
                    // Extract description
                    json|error descResult = article.description;
                    if (descResult is json && descResult is string) {
                        description = descResult;
                    }
                    
                    // Extract URL
                    json|error urlResult = article.url;
                    if (urlResult is json && urlResult is string) {
                        articleUrl = urlResult;
                    }
                    
                    // Extract image URL
                    json|error imageResult = article.urlToImage;
                    if (imageResult is json && imageResult is string) {
                        imageUrl = imageResult;
                    }
                    
                    // Extract published date
                    json|error dateResult = article.publishedAt;
                    if (dateResult is json && dateResult is string) {
                        publishedAt = dateResult;
                    }
                    
                    // Extract source name
                    json|error sourceResult = article.'source;
                    if (sourceResult is json) {
                        json|error nameResult = sourceResult.name;
                        if (nameResult is json && nameResult is string) {
                            sourceName = nameResult;
                        }
                    }
                    
                    // Categorize articles based on content analysis
                    string assignedCategory = categorizeArticle(title, description);
                    
                    // Apply category filter if specified
                    if (category is string && category != "All" && assignedCategory != category) {
                        index += 1;
                        continue;
                    }

                    NewsArticle newsArticle = {
                        id: articleId,
                        title: title,
                        description: description,
                        url: articleUrl,
                        imageUrl: imageUrl,
                        publishedAt: publishedAt,
                        newsSource: sourceName,
                        category: assignedCategory,
                        isBookmarked: bookmarkedArticles.hasKey(articleId)
                    };
                    
                    transformedArticles.push(newsArticle);
                    index += 1;
                }
            }

            return {
                success: true,
                articles: transformedArticles,
                totalResults: check jsonResponse.totalResults
            };
        } else {
            string body = "";
            var textResult = response.getTextPayload();
            if (textResult is string) {
                body = textResult;
            }
            log:printError("HTTP error from NewsAPI", statusCode = response.statusCode, body = body);

            string refinedMessage = "Failed to fetch news: HTTP " + response.statusCode.toString();
            if (body.length() > 0) {
                refinedMessage = refinedMessage + " - " + body;
            }
            if (response.statusCode == 401) {
                refinedMessage = refinedMessage + 
                    " | Hints: Verify API key not expired, no leading/trailing spaces, plan allows 'everything' endpoint, and key not restricted.";
                log:printError("Returning mock articles due to persistent 401 (auth failure)");
                return {
                    success: true,
                    message: refinedMessage + " (mock data)",
                    articles: MOCK_ARTICLES,
                    totalResults: MOCK_ARTICLES.length()
                };
            }
            return {
                success: false,
                message: refinedMessage,
                articles: []
            };
        }
    }

    resource function post bookmarks(@http:Payload json bookmarkData) returns json|error {
        string articleId = check bookmarkData.articleId;
        bookmarkedArticles[articleId] = true;
        log:printInfo("Article bookmarked: " + articleId);
        
        return {
            success: true,
            message: "Article bookmarked successfully"
        };
    }

    resource function delete bookmarks/[string articleId]() returns json|error {
        if (bookmarkedArticles.hasKey(articleId)) {
            _ = bookmarkedArticles.remove(articleId);
        }
        log:printInfo("Article unbookmarked: " + articleId);
        
        return {
            success: true,
            message: "Article unbookmarked successfully"
        };
    }

    resource function get bookmarks() returns json {
        string[] bookmarkedIds = bookmarkedArticles.keys();
        return {
            success: true,
            bookmarkedArticles: bookmarkedIds
        };
    }

    resource function get categories() returns json {
        string[] categories = [
            "All",
            "Reproductive Health", 
            "Mental Health",
            "Nutrition",
            "Fitness & Exercise",
            "Pregnancy & Maternity",
            "Women's Rights",
            "General Health"
        ];
        
        log:printInfo("Fetching news categories - Total: " + categories.length().toString());
        return {
            success: true,
            categories: categories
        };
    }
}

function categorizeArticle(string title, string description) returns string {
    string content = (title + " " + description).toLowerAscii();
    
    map<int> categoryScores = {};
    
    string[] mentalHealthKeywords = ["mental", "depression", "anxiety", "stress", "psychological", "therapy", "counseling", "wellbeing", "emotional", "mood", "psychiatric", "mindfulness", "meditation"];
    categoryScores["Mental Health"] = calculateCategoryScore(content, mentalHealthKeywords);
    
    string[] nutritionKeywords = ["nutrition", "diet", "food", "vitamin", "mineral", "supplement", "eating", "calories", "protein", "carbohydrate", "fat", "nutrient", "healthy eating", "meal"];
    categoryScores["Nutrition"] = calculateCategoryScore(content, nutritionKeywords);
    
    string[] fitnessKeywords = ["exercise", "fitness", "workout", "yoga", "pilates", "running", "gym", "training", "physical activity", "cardio", "strength", "muscle"];
    categoryScores["Fitness & Exercise"] = calculateCategoryScore(content, fitnessKeywords);
    
    string[] pregnancyKeywords = ["pregnancy", "pregnant", "maternal", "prenatal", "postnatal", "labor", "delivery", "birth", "expecting", "trimester", "fetal", "baby"];
    categoryScores["Pregnancy & Maternity"] = calculateCategoryScore(content, pregnancyKeywords);
    
    string[] reproductiveKeywords = ["reproductive", "fertility", "pcos", "endometriosis", "ovarian", "uterine", "cervical", "contraception", "ivf", "menstrual", "period", "cycle"];
    categoryScores["Reproductive Health"] = calculateCategoryScore(content, reproductiveKeywords);
    
    string[] rightsKeywords = ["rights", "equality", "discrimination", "harassment", "workplace", "policy", "legislation", "advocacy", "empowerment", "justice"];
    categoryScores["Women's Rights"] = calculateCategoryScore(content, rightsKeywords);
    
    string bestCategory = "General Health";
    int highestScore = 0;
    
    foreach string category in categoryScores.keys() {
        int? scoreResult = categoryScores.get(category);
        if (scoreResult is int && scoreResult > highestScore) {
            highestScore = scoreResult;
            bestCategory = category;
        }
    }
    
    if (highestScore == 0) {
        return "General Health";
    }
    
    return bestCategory;
}

function calculateCategoryScore(string content, string[] keywords) returns int {
    int score = 0;
    
    foreach string keyword in keywords {
        if (content.includes(keyword)) {
            if (keyword.length() > 8) {
                score += 3;
            } else if (keyword.length() > 5) {
                score += 2;
            } else {
                score += 1;
            }
            
            if (content.includes(" " + keyword + " ")) {
                score += 1;
            }
        }
    }
    
    return score;
}
