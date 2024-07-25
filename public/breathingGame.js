// public/breathingGame.js

const circle = document.getElementById('circle');
const instructions = document.getElementById('instructions');

const totalTime = 7500;
const breatheTime = (totalTime / 5) * 2;
const holdTime = totalTime / 5;

function breatheAnimation() {
    instructions.innerText = 'Breathe In';
    circle.style.transform = 'scale(1.3)';
    setTimeout(() => {
        instructions.innerText = 'Hold';
        setTimeout(() => {
            instructions.innerText = 'Breathe Out';
            circle.style.transform = 'scale(1)';
        }, holdTime);
    }, breatheTime);
}

setInterval(breatheAnimation, totalTime);

// Start the animation
breatheAnimation();
