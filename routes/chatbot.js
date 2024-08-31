const express = require('express');
const router = express.Router();


// POST route to handle chat messages
router.post('/chat', (req, res) => {
    const userMessage = req.body.message;
    const botResponse = generateResponse(userMessage);
    res.json({botResponse });
});


// Response generation function
function generateResponse(message) {
    const lowerCaseMessage = message.toLowerCase();

    // Mental wellbeing responses
    if (lowerCaseMessage.includes('sad')) {
        return "I'm sorry you're feeling sad. It's okay to feel this way. Can you share what's on your mind?";
    } else if (lowerCaseMessage.includes('anxious')) {
        return "It sounds like you're feeling anxious. Try taking deep breaths. Would you like some tips on managing anxiety?";
    } else if (lowerCaseMessage.includes('angry')) {
        return "Anger can be tough to deal with. Do you want to talk about what's making you feel this way?";
    } else if (lowerCaseMessage.includes('lonely')) {
        return "Loneliness can be really hard. Remember, you're not alone. I'm here to listen.";
    } else if (lowerCaseMessage.includes('stress')) {
        return "Stress can be overwhelming. Sometimes talking about what's stressing you out can help. Would you like to share more?";
    } else if (lowerCaseMessage.includes('overwhelmed')) {
        return "Feeling overwhelmed can be really challenging. It might help to break things down into smaller steps. Can I assist you with anything specific?";
    } else if (lowerCaseMessage.includes('depressed')) {
        return "Depression can be very difficult to cope with. It's important to talk to a mental health professional who can offer support. Do you want resources or someone to talk to?";
    } else if (lowerCaseMessage.includes('burnout')) {
        return "Burnout can happen when you’ve been under a lot of stress for too long. It’s important to take breaks and seek help if you need it. How can I assist you right now?";
    } else if (lowerCaseMessage.includes('self-care')) {
        return "Self-care is important for maintaining mental health. Here are some ideas: 1. Practice mindfulness. 2. Get enough sleep. 3. Engage in activities you enjoy. 4. Connect with loved ones.";
    } else if (lowerCaseMessage.includes('suicidal thoughts')) {
        return "If you have suicidal thoughts, please call the respective mental health hotline in your country or reach out to a trusted person immediately.";
    }

    // Website-related responses
    else if (lowerCaseMessage.includes('website')) {
        return "Our website aims to provide accessible and engaging mental health resources for teenagers. It features articles, interactive elements, and support tools.";
    } else if (lowerCaseMessage.includes('features')) {
        return "Our website includes features such as articles on mental health topics, interactive activities, and resources for getting help. You can also find a contact page for reaching out directly.";
    } else if (lowerCaseMessage.includes('how to use')) {
        return "To navigate our website, use the menu to explore articles, filters, and categories. You can also use the search function to find specific topics or resources.";
    } else if (lowerCaseMessage.includes('contact')) {
        return "You can contact us through the contact page on our website. There you can find a form to submit your questions or concerns directly.";
    } else if (lowerCaseMessage.includes('about')) {
        return "Our website is dedicated to providing valuable mental health resources and support. It is designed with teenagers in mind to offer practical help and information.";
    }

    // Default response
    else {
        return "I'm here to listen. How are you feeling today or do you have any questions about our website?";
    }
}

module.exports = router;
