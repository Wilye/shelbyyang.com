let i = 0;
let j = 0;

// Phrases to be displayed
let phrases = [
    "Hey!",
    "I'm Shelby Yang.",
    "I've used Java, C/C++, Python, SQL, and more.",
    "Please use my website to learn more about me!"
];

window.onload = loop;

function loop() {
    let element = document.querySelector('#typing-text');
    let speed = 75; // Typing speed

    // Get the current phrase
    let currentPhrase = phrases[j];

    // Typing Effect
    if (i < currentPhrase.length) {
        // Add a character
        element.innerHTML += currentPhrase.charAt(i);
        i++;
    }

    // Move to the next phrase
    if (i === currentPhrase.length) {
        i = 0;
        j++;
        if(j < phrases.length) {
            element.innerHTML += '<br>'; // Add a line break after each phrase
        } else {
            return; // End the function after all phrases have been typed
        }
    }

    setTimeout(loop, speed);
}
