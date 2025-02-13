function gameLoop(clock, updateFunctions, renderer, scene, camera) {
  function animate() {
    const deltaTime = Math.min(0.05, clock.getDelta()) / 5;
    updateFunctions.forEach((update) => update(deltaTime));
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}

export { gameLoop };
