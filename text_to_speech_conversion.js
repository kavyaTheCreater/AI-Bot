document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('voiceBtn').addEventListener('click', startVoiceRecognition);

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const apiKey = "gsk_mEiwHRB5wwYQnxRHnSeKWGdyb3FYpSpxLS1McboPQM6vQfLZxap";
const minTokens = 20; // Minimum tokens to ensure a substantial response

function sendMessage() {
    const userInput = document.getElementById('userInput').value;
    if (userInput.trim() === "") return;

    // Display user message
    displayMessage(userInput, 'user-message');
    document.getElementById('userInput').value = "";

    // Send message to AI assistant
    fetchChatGPTResponse(userInput);
}

function displayMessage(text, className) {
    const chatbox = document.getElementById('chatbox');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${className}`;  
    messageDiv.textContent = text;
    chatbox.appendChild(messageDiv);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function fetchChatGPTResponse(message) {
    const data = {
        model: "llama3-8b-8192",
        messages: [
            { role: "user", content: message }
        ],
        //max_tokens: 100, // Set a reasonable upper limit
        temperature: 1,// Set temperature to control randomness
        max_tokens: 80,
        

    };

    // First request to get response
    fetchResponse(data)
        .then(reply => {
            if (reply) {
                displayMessage(reply, 'bot-message');
                speakOutLoud(reply);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            displayMessage("Failed to connect to the ESP32 server.", 'bot-message');
        });
}

// Fetch response with retry mechanism to ensure minimum tokens are met
async function fetchResponse(data) {
    const response = await fetch(groqEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(data)
    });

    const result = await response.json();
    const reply = result.choices[0]?.message?.content;

    // Check if the response has enough tokens (assumed to be roughly equal to words)
    const tokenCount = reply ? reply.split(' ').length : 0;

    if (tokenCount < minTokens) {
        // Adjust max_tokens for a retry
        const newMaxTokens = Math.max(100, minTokens + 20); // Increase limit for the next try
        data.max_tokens = newMaxTokens;
        return fetchResponse(data); // Retry with increased token limit
    }

    return reply || "Sorry, I couldn't understand that.";
}

// Voice Recognition Function
function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US"; // Set the recognition language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = function(event) {
        const speechResult = event.results[0][0].transcript;
        displayMessage(speechResult, 'user-message');
        fetchChatGPTResponse(speechResult);
    };

    recognition.onerror = function(event) {
        console.error("Speech recognition error:", event);
    };

    recognition.start();
}

// Text-to-Speech Function
function speakOutLoud(message) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = message;
    speech.lang = "en-US"; // Set language for speech synthesis
    window.speechSynthesis.speak(speech);
}
