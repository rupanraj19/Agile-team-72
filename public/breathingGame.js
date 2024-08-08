const breatheInCircle = document.getElementById('breathe-in-circle');
const breatheOutCircle = document.getElementById('breathe-out-circle');
const instructions = document.getElementById('instructions');

const totalTime = 7500;
const breatheTime = (totalTime / 5) * 2;
const holdTime = totalTime / 5;

function breatheAnimation() {
    instructions.innerText = 'Breathe In';
    breatheInCircle.style.transform = 'scale(1.3)';
    breatheOutCircle.style.transform = 'scale(1)';
    setTimeout(() => {
        instructions.innerText = 'Hold';
        setTimeout(() => {
            instructions.innerText = 'Breathe Out';
            breatheInCircle.style.transform = 'scale(1)';
            breatheOutCircle.style.transform = 'scale(1.3)';
        }, holdTime);
    }, breatheTime);
}

setInterval(breatheAnimation, totalTime);

// Start the animation
breatheAnimation();
