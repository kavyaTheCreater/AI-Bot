document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('voiceBtn').addEventListener('click', startVoiceRecognition);

const groqEndpoint = "https://api.groq.com/openai/v1/chat/completions";
const apiKey = "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";

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
        max_tokens: 100, // Set max tokens to limit the response length
        temperature: 1 // Set temperature to 1
    };

    fetch(groqEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        const reply = data.choices[0].message.content || "Sorry, I couldn't understand that.";
        displayMessage(reply, 'bot-message');
        speakOutLoud(reply);
    })
    .catch(error => {
        console.error("Error:", error);
        displayMessage("Failed to connect to the AI server.", 'bot-message');
    });
}

// Voice Recognition Function
function startVoiceRecognition() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-IN";
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

// Text-to-Speech Function with Female Voice
function speakOutLoud(message) {
    const speech = new SpeechSynthesisUtterance();
    speech.text = message;
    speech.lang = "en-IN";

    // Get the available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Select a female voice (if available)
    const femaleVoice = voices.find(voice => voice.gender === "female" || voice.name.toLowerCase().includes("female"));
    
    // Set the selected female voice or fallback to the first available voice
    speech.voice = femaleVoice || voices[0];
    
    window.speechSynthesis.speak(speech);
}

// Ensure voices are loaded before setting
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices(); // Refresh the list of available voices
};
