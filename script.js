import { GoogleGenAI } from "@google/genai";

// The MAX_HISTORY includes both user and AI messages. so in the end, they both have 5 messages max.
let conversationHistory = [];
const MAX_HISTORY = 10;

const ai = new GoogleGenAI({
  // Couldn't use dotenv because the browser cant read dotenv for security reasons
  // And I wanted to keep this project as simple as possible.
  apiKey: "apiKeyHere" || "",
});

async function getResponse(message) {
  try {
    // AI memory integration: User Message
    conversationHistory.push({ role: "user", content: message });
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }
    const context = conversationHistory
      .map(
        (msg) =>
          `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`,
      )
      .join("\n");

    const fullPrompt = `Previous Conversation: ${context}
			You are a medical assistant.  For urgent symptoms/injuries/pain: give immediate practical steps and actions. For general medical questions about drugs/conditions/info: give educational information. 2 sentences max. No emergency service suggestions. Do not add double quotes from start of your response to end. Do not add a medical assistant prefix to your messages. I know.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 0, // Disables thinking if a "thinking" model is used
        },
      },
    });
    // AI memory integration: AI Message
    const reply = response.text || response;
    conversationHistory.push({ role: "assistant", content: reply });
    if (conversationHistory.length > MAX_HISTORY) {
      conversationHistory = conversationHistory.slice(-MAX_HISTORY);
    }

    return reply;
  } catch (e) {
    console.error("Error getting response: ", e);
    return "Sorry, there was an error processing request.";
  }
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;
  displayMessage(message, "user-message");
  input.value = "";
  try {
    const reply = await getResponse(message);
    displayMessage(reply, "ai-message");
  } catch (e) {
    displayMessage("Error: Could not get response", "ai-message error");
  }
}

function displayMessage(text, className) {
  const box = document.getElementById("chatbox");
  const div = document.createElement("div");
  div.className = className;
  div.innerText = text;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");

  sendButton.addEventListener("click", sendMessage);

  userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });
});
