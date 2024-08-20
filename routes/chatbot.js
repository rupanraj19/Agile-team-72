const express = require('express');
const router = express.Router();


// POST route to handle chat messages
router.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    console.log("Received message:", userMessage);  // Log the received message
    const botResponse = generateResponse(userMessage);
    console.log("Bot response:", botResponse);  // Log the bot's response
    res.json({botResponse });
});


// Enhanced response generation function
function generateResponse(message) {
    const lowerCaseMessage = message.toLowerCase();

    if (lowerCaseMessage.includes('sad')) {
        return "I'm sorry you're feeling sad. It's okay to feel this way. Can you share what's on your mind?";
    } else if (lowerCaseMessage.includes('anxious')) {
        return "It sounds like you're feeling anxious. Try taking deep breaths. Would you like some tips on managing anxiety?";
    } else if (lowerCaseMessage.includes('angry')) {
        return "Anger can be tough to deal with. Do you want to talk about what's making you feel this way?";
    } else if (lowerCaseMessage.includes('lonely')) {
        return "Loneliness can be really hard. Remember, you're not alone. I'm here to listen.";
    } else if (lowerCaseMessage.includes('tips')) {
        return "Here are some tips: 1. Practice deep breathing. 2. Take a walk in nature. 3. Talk to a friend. 4. Write down your thoughts.";
    } else if (lowerCaseMessage.includes('help')) {
        return "If you need help, consider reaching out to a mental health professional. You don't have to go through this alone.";
    } else {
        return "I'm here to listen. How are you feeling today?";
    }
}

module.exports = router;
