import { styles, applyStyles } from "./styles";

// 🎵 Background Ambient Music Module 🎵
const ambientSounds = [
  new Audio("/sounds/ambience1.mp3"),
  new Audio("/sounds/ambience2.mp3"),
  new Audio("/sounds/ambience3.mp3"),
];

// Set up each audio
ambientSounds.forEach((sound) => {
  sound.loop = true; // Infinite loop
  sound.volume = 0.7; // Default volume
});

let isPlaying = false; // Track if music is playing

function playAmbientMusic() {
  if (!isPlaying) {
    ambientSounds.forEach((sound) => {
      sound.load(); // Ensure it's loaded properly
      sound.play().catch((err) => console.warn("Audio play failed:", err));
    });
    isPlaying = true;
  }
}

function stopAmbientMusic() {
  ambientSounds.forEach((sound) => sound.pause());
  isPlaying = false;
}

// 🎛️ Music Controller 🎛️
function addBgMusic() {
  const musicButton = document.createElement("button");
  musicButton.textContent = "🔊 Mute Music";
  applyStyles(musicButton, styles.musicButton);
  document.body.appendChild(musicButton);

  let isMusicPlaying = false; // Default: not playing

  musicButton.addEventListener("click", () => {
    if (isMusicPlaying) {
      stopAmbientMusic();
      musicButton.textContent = "🔇 Play Music";
    } else {
      playAmbientMusic();
      musicButton.textContent = "🔊 Mute Music";
    }

    isMusicPlaying = !isMusicPlaying;
  });
}

// Export function to start music
export { addBgMusic };
