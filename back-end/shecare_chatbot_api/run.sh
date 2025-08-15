#!/bin/bash
# setup.sh - Setup script for SheCare Chatbot API

echo "🩺 Setting up SheCare Chatbot API..."

# Create backend directory structure
mkdir -p backend
cd backend

# Create Ballerina project structure
mkdir -p shecare_chatbot_api
cd shecare_chatbot_api

# Copy the main service file
cat > main.bal << 'EOF'
import ballerina/http;
import ballerina/log;
import ballerina/time;

// Configuration for Gemini API
configurable string geminiApiKey = ?;
configurable string geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// CORS configuration
@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000", "https://localhost:3000"],
        allowCredentials: false,
        allowHeaders: ["COEP", "COOP", "CORP", "Cross-Origin-Resource-Policy", "content-type"],
        allowMethods: ["GET", "DELETE", "POST", "PUT", "OPTIONS"]
    }
}
service /api on new http:Listener(8080) {

    // Health check endpoint
    resource function get health() returns json {
        return {
            "status": "healthy",
            "service": "SheCare Chatbot API",
            "timestamp": time:utcNow()
        };
    }

    // Chat endpoint for the bot
    resource function post chat(@http:Payload ChatRequest request) returns ChatResponse|http:InternalServerError {
        log:printInfo("Received chat request: " + request.message);

        // Create system prompt for health-focused responses
        string systemPrompt = "You are SheCare AI, a compassionate and knowledgeable health assistant specializing in women's health, period tracking, wellness, and mental health support. " +
            "Always respond with empathy and provide helpful, accurate information. " +
            "For serious medical concerns, advise consulting healthcare professionals. " +
            "Keep responses concise but informative. Use emojis when appropriate to make responses friendly.";

        // Prepare the request for Gemini API
        GeminiRequest geminiRequest = {
            contents: [{
                parts: [{
                    text: systemPrompt + "\n\nUser question: " + request.message
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024
            }
        };

        // Call Gemini API
        http:Client geminiClient = new (geminiApiUrl);
        
        do {
            map<string> headers = {
                "Content-Type": "application/json",
                "x-goog-api-key": geminiApiKey
            };

            http:Response response = check geminiClient->post("", geminiRequest, headers);
            
            if (response.statusCode == 200) {
                GeminiResponse geminiResponse = check response.getJsonPayload().cloneWithType(GeminiResponse);
                
                string botMessage = "I'm here to help! Please try asking your question in a different way.";
                
                if (geminiResponse.candidates.length() > 0 && 
                    geminiResponse.candidates[0].content.parts.length() > 0) {
                    botMessage = geminiResponse.candidates[0].content.parts[0].text;
                }

                ChatResponse chatResponse = {
                    message: botMessage,
                    timestamp: time:utcNow(),
                    success: true
                };

                log:printInfo("Generated response: " + botMessage);
                return chatResponse;
            } else {
                log:printError("Gemini API error: " + response.statusCode.toString());
                return <http:InternalServerError>{ body: "Failed to generate response" };
            }
        } on fail var e {
            log:printError("Error calling Gemini API: " + e.message());
            
            // Fallback response for common health topics
            string fallbackResponse = getFallbackResponse(request.message);
            
            ChatResponse chatResponse = {
                message: fallbackResponse,
                timestamp: time:utcNow(),
                success: true
            };
            
            return chatResponse;
        }
    }
}

// Request/Response types
type ChatRequest record {
    string message;
    string? userId?;
};

type ChatResponse record {
    string message;
    time:Utc timestamp;
    boolean success;
};

// Gemini API types
type GeminiRequest record {
    Content[] contents;
    GenerationConfig generationConfig;
};

type Content record {
    Part[] parts;
};

type Part record {
    string text;
};

type GenerationConfig record {
    decimal temperature;
    int topK;
    decimal topP;
    int maxOutputTokens;
};

type GeminiResponse record {
    Candidate[] candidates;
};

type Candidate record {
    ContentResponse content;
};

type ContentResponse record {
    PartResponse[] parts;
};

type PartResponse record {
    string text;
};

// Fallback responses for when Gemini API is unavailable
function getFallbackResponse(string message) returns string {
    string lowerMessage = message.toLowerAscii();
    
    if (lowerMessage.includes("period") || lowerMessage.includes("menstruation")) {
        return "🩸 I understand you have questions about your period. This is completely normal! For period-related concerns, I recommend tracking your cycle, staying hydrated, and using heat therapy for cramps. For specific medical concerns, please consult with a healthcare provider.";
    }
    
    if (lowerMessage.includes("mood") || lowerMessage.includes("emotional")) {
        return "💙 I hear that you're dealing with emotional concerns. Your feelings are valid! Try gentle exercise, adequate sleep (7-9 hours), and consider talking to supportive friends or family. If mood changes persist, consider speaking with a mental health professional.";
    }
    
    if (lowerMessage.includes("pain") || lowerMessage.includes("cramp")) {
        return "🤕 I'm sorry you're experiencing pain. For period cramps, try: heat therapy, gentle exercise, staying hydrated, and over-the-counter pain relief. However, severe or persistent pain should be evaluated by a healthcare provider.";
    }
    
    if (lowerMessage.includes("sleep")) {
        return "😴 For better sleep during your cycle: keep your room cool, try relaxation techniques, avoid caffeine after 2 PM, and maintain a consistent sleep schedule. Your body needs extra rest during menstruation!";
    }
    
    return "💕 Thank you for reaching out! I'm here to support you with questions about women's health, periods, wellness, and mental health. For specific medical concerns, please consult with a healthcare professional. How can I help you today?";
}
EOF

# Create Ballerina.toml
cat > Ballerina.toml << 'EOF'
[package]
org = "shecare"
name = "chatbot_api"
version = "0.1.0"
distribution = "2201.8.0"

[build-options]
observabilityIncluded = true
EOF

# Create Config.toml template
cat > Config.toml << 'EOF'
[shecare_chatbot_api]
geminiApiKey = "YOUR_GEMINI_API_KEY_HERE"
geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
EOF

echo "✅ Backend structure created!"
echo ""
echo "📝 Next steps:"
echo "1. Get your Gemini API key from https://makersuite.google.com/app/apikey"
echo "2. Replace 'YOUR_GEMINI_API_KEY_HERE' in Config.toml with your actual API key"
echo "3. Run 'bal run' to start the service"
echo "4. The API will be available at http://localhost:8080"
echo ""
echo "🔗 Available endpoints:"
echo "- GET  /api/health  - Health check"
echo "- POST /api/chat    - Chat with the bot"
echo ""

# run.sh - Script to run the service
cat > run.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting SheCare Chatbot API..."
echo "Make sure you have set your Gemini API key in Config.toml"
echo ""
bal run
EOF

chmod +x run.sh

echo "🎉 Setup complete! Navigate to the backend/shecare_chatbot_api directory and run './run.sh' to start the service."