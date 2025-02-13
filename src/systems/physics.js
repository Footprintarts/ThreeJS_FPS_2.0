import * as THREE from "three";
import { Capsule } from "three/examples/jsm/Addons.js";
import { Octree } from "three/examples/jsm/Addons.js";
import { createRenderer } from "./renderer";

// Animations
import { createCamera, playGunAnimation } from "../components/camera";

const GRAVITY = 30;
const NUM_SPHERES = 100;
const SPHERE_RADIUS = 0.2;
const STEPS_PER_FRAME = 5;

const spheres = [];
let sphereIdx = 0;

// Animation Variables
let lastShotTime = 0; // ✅ Keeps track of last shot time
let isGunLoaded = false; // ✅ Track gun reload status
const renderer = createRenderer();
const clock = new THREE.Clock();
let mixer = null; // ✅ Global mixer for animations
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

function createPhysics(scene) {
  const worldOctree = new Octree();

  const playerCollider = new Capsule(
    new THREE.Vector3(0, 0.35, 0),
    new THREE.Vector3(0, 1, 0),
    0.35
  );

  const playerVelocity = new THREE.Vector3();
  const playerDirection = new THREE.Vector3();
  let playerOnFloor = false;

  // Create shooting spheres
  const sphereGeometry = new THREE.IcosahedronGeometry(SPHERE_RADIUS, 5);
  const sphereMaterial = new THREE.MeshLambertMaterial({ color: 0xadfe03 });

  for (let i = 0; i < NUM_SPHERES; i++) {
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    spheres.push({
      mesh: sphere,
      collider: new THREE.Sphere(new THREE.Vector3(0, -100, 0), SPHERE_RADIUS),
      velocity: new THREE.Vector3(),
    });
  }

  // ⚙️💡SHOOTER CONTROLS & SOUNDS

  // 🎵 **Preload Sounds**
  const sounds = {
    shoot: new Audio("/sounds/laser.mp3"),
    reload: new Audio("/sounds/reload.mp3"),
  };

  // Reload flag to prevent shooting during reload
  let isReloading = false; // Prevent shooting during reload
  let isAnimationPlaying = false; // Flag to track if animation is playing

  // ✅ **Play Animation + Sound**
  function playAction(
    animationName,
    soundKey,
    autoIdle = true,
    idleDelay = 300
  ) {
    if (isAnimationPlaying) return; // Prevent animation overlap

    isAnimationPlaying = true; // Mark animation as playing
    playGunAnimation(animationName); // ✅ Play animation

    // **Play the sound**
    if (soundKey && sounds[soundKey]) {
      sounds[soundKey].pause(); // Stop any existing sound
      sounds[soundKey].currentTime = 0; // Restart sound
      sounds[soundKey].play();
    }

    // **Return to idle after action (if applicable)**
    if (autoIdle) {
      setTimeout(() => {
        playGunAnimation("Armature|Idle");
        isAnimationPlaying = false; // Reset animation state after idle
      }, idleDelay);
    }

    // Handle reload animation completion
    if (animationName === "Armature|Reload") {
      setTimeout(() => {
        isReloading = false; // Allow shooting again after reload
        isAnimationPlaying = false; // Mark reload animation as complete
      }, 3000); // Adjust timing based on reload animation duration (3 seconds here)
    }
  }

  // 🏀 **Throw Ball Function**
  let shotCount = 0; // Track the number of shots fired

  function throwBall(camera) {
    if (isReloading || isAnimationPlaying) return; // Prevent shooting during reload or animation

    const sphere = spheres[sphereIdx];

    // **Get fresh shooting direction vector**
    const shootDirection = new THREE.Vector3();
    camera.getWorldDirection(shootDirection);
    shootDirection.normalize();

    // **Set sphere position slightly ahead of the player**
    sphere.collider.center
      .copy(playerCollider.end)
      .addScaledVector(shootDirection, playerCollider.radius * 1.5);

    // **Apply impulse force to the ball**
    const impulse = 15 + 30 * (1 - Math.exp(-0.001 * performance.now()));
    sphere.velocity.copy(shootDirection).multiplyScalar(impulse);

    // 🎯 **Trigger Shooting Animation + Sound**
    playAction("Armature|Shoot", "shoot");

    // ✅ **Update shot count and last shot time**
    shotCount++;
    lastShotTime = performance.now();

    // **Update sphere index**
    sphereIdx = (sphereIdx + 1) % spheres.length;

    // **Trigger reload after 10 shots**
    if (shotCount >= 10) {
      reloadGun();
      shotCount = 0; // Reset shot count after reload
    }
  }

  // ✅ **Reload Gun (play animation at double speed)**
  function reloadGun() {
    if (isReloading || isAnimationPlaying) return; // Prevent multiple reloads if animation is already playing

    isReloading = true; // Mark as reloading

    // 🎯 Play Reload Animation + Sound
    playAction("Armature|Reload", "reload", true, 3000); // Adjust 3000ms to match reload animation length

    // ✅ Prevent shooting until reload is finished
    isAnimationPlaying = true; // Block shooting during reload animation
  }

  // ✅ **Ensure Animation Updates Every Frame**
  function update(deltaTime) {
    if (mixer) mixer.update(deltaTime);
  }

  // **Run Animation in Game Loop**
  renderer.setAnimationLoop(() => {
    const delta = clock.getDelta();
    update(delta); // Keep animations running
    renderer.render(scene, camera);
  });

  //   -----END----SHOOTER WITH AUDIO AND GUN LOAD-----

  function updatePlayer(deltaTime, worldOctree, camera) {
    if (!playerCollider || !playerCollider.end) return;

    let damping = Math.exp(-4 * deltaTime) - 1;

    if (!playerOnFloor) {
      playerVelocity.y -= GRAVITY * deltaTime;
      damping *= 0.1;
    }

    playerVelocity.addScaledVector(playerVelocity, damping);
    playerCollider.translate(playerVelocity.clone().multiplyScalar(deltaTime));

    const result = worldOctree.capsuleIntersect(playerCollider);
    playerOnFloor = result ? result.normal.y > 0 : false;

    if (result) {
      playerVelocity.addScaledVector(
        result.normal,
        -result.normal.dot(playerVelocity)
      );
      playerCollider.translate(result.normal.multiplyScalar(result.depth));
    }

    // ✅ Check for Player-to-Ball Collision
    spheres.forEach((sphere) => {
      playerSphereCollision(sphere); // 💥 This ensures interaction
    });

    if (playerCollider && playerCollider.end) {
      camera.position.copy(playerCollider.end);
    }
  }

  function spheresCollisions() {
    for (let i = 0; i < spheres.length; i++) {
      const s1 = spheres[i];

      for (let j = i + 1; j < spheres.length; j++) {
        const s2 = spheres[j];

        const distanceSquared = s1.collider.center.distanceToSquared(
          s2.collider.center
        );
        const radiusSum = s1.collider.radius + s2.collider.radius;
        const radiusSumSquared = radiusSum * radiusSum;

        if (distanceSquared < radiusSumSquared) {
          // **Reflect velocity for a proper bounce effect**
          const normal = new THREE.Vector3()
            .subVectors(s1.collider.center, s2.collider.center)
            .normalize();

          const v1 = normal.clone().multiplyScalar(normal.dot(s1.velocity));
          const v2 = normal.clone().multiplyScalar(normal.dot(s2.velocity));

          s1.velocity.add(v2).sub(v1);
          s2.velocity.add(v1).sub(v2);

          // Move spheres apart slightly to prevent overlap
          const distance = (radiusSum - Math.sqrt(distanceSquared)) / 2;
          s1.collider.center.addScaledVector(normal, distance);
          s2.collider.center.addScaledVector(normal, -distance);
        }
      }
    }
  }

  function playerSphereCollision(sphere) {
    if (!playerCollider) return;

    const center = new THREE.Vector3()
      .addVectors(playerCollider.start, playerCollider.end)
      .multiplyScalar(0.5);

    const sphereCenter = sphere.collider.center;
    const r = playerCollider.radius + sphere.collider.radius;
    const r2 = r * r;

    // ✅ Check three key points: Start, End, and Middle of the player
    for (const point of [playerCollider.start, playerCollider.end, center]) {
      const d2 = point.distanceToSquared(sphereCenter);

      if (d2 < r2) {
        // **Calculate Collision Normal**
        const normal = new THREE.Vector3()
          .subVectors(point, sphereCenter)
          .normalize();

        // **Only apply force to the sphere's velocity (No effect on player)**
        const v1 = normal.clone().multiplyScalar(normal.dot(sphere.velocity)); // Get velocity of the ball along the normal
        const v2 = normal.clone().multiplyScalar(normal.dot(playerVelocity)); // Get velocity of the player along the normal

        // Apply damping to ball's velocity, with a smoother effect
        const dampingFactor = 0.5; // Adjust this value to control the speed decrease after collision
        sphere.velocity.add(v1).sub(v2).multiplyScalar(dampingFactor);

        // **Simulate rolling resistance (slowing down the ball after collision)**
        const rollingFriction = 0.98; // Slight friction to simulate rolling effect (less than 1 to slow down)
        sphere.velocity.multiplyScalar(rollingFriction); // Gradually slows down ball's velocity

        // **Push sphere away slightly to prevent overlap**
        const d = (r - Math.sqrt(d2)) / 2;
        sphereCenter.addScaledVector(normal, -d);
      }
    }
  }

  function updateSpheres(deltaTime, worldOctree) {
    spheres.forEach((sphere) => {
      sphere.collider.center.addScaledVector(sphere.velocity, deltaTime);

      const result = worldOctree.sphereIntersect(sphere.collider);

      if (result) {
        // ✅ Stop bouncing if velocity is too low
        if (sphere.velocity.length() < 0.2) {
          sphere.velocity.set(0, 0, 0);
        } else {
          // Reflect velocity so the ball bounces instead of going through walls
          sphere.velocity.addScaledVector(
            result.normal,
            -result.normal.dot(sphere.velocity) * 1.8 // 🛠 Reduce bounce force slightly
          );

          // Move the ball out of collision
          sphere.collider.center.add(
            result.normal.multiplyScalar(result.depth)
          );
        }
      } else {
        // Apply gravity
        sphere.velocity.y -= GRAVITY * deltaTime;
      }

      // Apply damping to slow the ball over time
      const damping = Math.exp(-1.5 * deltaTime) - 1;
      sphere.velocity.addScaledVector(sphere.velocity, damping);

      // Update the ball's position in Three.js
      sphere.mesh.position.copy(sphere.collider.center);
    });

    // Check sphere-to-sphere collisions
    spheresCollisions();
  }

  return {
    playerCollider,
    playerVelocity,
    playerDirection,
    updatePlayer,
    updateSpheres,
    throwBall,
    worldOctree,
  };
}

export { createPhysics, STEPS_PER_FRAME };
