/**
 * welcome.js — Nano Welcome Intro
 * Pure HTML/CSS/JS — no Three.js, no canvas rendering.
 * Handles: animation sequencing, panel reveal, auto-transition to chat.
 */

(function () {
    var RISE_DELAY   = 400;    // ms before robot rises
    var PANEL_DELAY  = 1600;   // ms before holo panel appears
    var TRANSIT_DELAY = 4200;  // ms before transitioning to chat

    var welcomeScreen = document.getElementById('welcome-screen');
    var chatContainer  = document.getElementById('chat-container');
    var robot          = document.getElementById('nano-robot');
    var holoPanel      = document.getElementById('holo-panel');

    // Rise robot
    setTimeout(function () {
        robot.classList.add('risen');
    }, RISE_DELAY);

    // Show holo panel
    setTimeout(function () {
        holoPanel.classList.add('visible');
    }, PANEL_DELAY);

    // Transition to chat
    setTimeout(function () {
        transitionToChat();
    }, TRANSIT_DELAY);

    function transitionToChat() {
        // Fade out welcome screen
        welcomeScreen.classList.add('fade-out');

        // Show chat container
        chatContainer.classList.add('visible');

        // Remove welcome screen from DOM after fade completes
        setTimeout(function () {
            if (welcomeScreen.parentNode) {
                welcomeScreen.parentNode.removeChild(welcomeScreen);
            }
        }, 1000);
    }
})();
