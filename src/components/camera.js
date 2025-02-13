import { PerspectiveCamera, Object3D, AnimationMixer } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let gunMixer = null; // Global mixer for animations
let animations = {}; // Store animations

function createCamera(scene) {
  const camera = new PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.rotation.order = "YXZ";
  camera.position.set(0, 1.6, 2);

  const player = new Object3D();
  player.add(camera);

  const gunHolder = new Object3D();
  gunHolder.position.set(0, -0.2, -0.5);
  camera.add(gunHolder);

  const loader = new GLTFLoader();
  loader.load("/models/FpsRig.glb", (gltf) => {
    const gun = gltf.scene;
    gun.scale.set(0.08, 0.08, 0.08);
    gun.position.set(0, 0, 0);
    gun.rotation.set(0, Math.PI / 2, 0);
    gunHolder.add(gun);

    // 🔥 Initialize Animation Mixer
    gunMixer = new AnimationMixer(gun);

    // Store animations in a dictionary
    gltf.animations.forEach((clip) => {
      animations[clip.name] = gunMixer.clipAction(clip);
    });

    console.log("Available Animations:", Object.keys(animations));

    // Play Idle by default
    playGunAnimation("Armature|Idle");

    scene.add(player);
  });

  return { camera, player, gunHolder };
}

function playGunAnimation(animationName) {
  if (gunMixer && animations[animationName]) {
    Object.values(animations).forEach((action) => action.stop()); // Stop all animations
    animations[animationName].reset().play(); // Play the desired animation
  }
}

export { createCamera, playGunAnimation, gunMixer };
