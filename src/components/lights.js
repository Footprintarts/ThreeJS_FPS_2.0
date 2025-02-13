import { HemisphereLight, DirectionalLight } from "three";

function createLights() {
  // Fill Light
  const fillLight1 = new HemisphereLight(0x8dc1de, 0x00668d, 1.5);
  fillLight1.position.set(2, 1, 1);

  // Sun Light
  const directionalLight = new DirectionalLight(0xffffff, 2.5);
  directionalLight.position.set(-5, 25, -1);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.01;
  directionalLight.shadow.camera.far = 500;
  directionalLight.shadow.camera.right = 30;
  directionalLight.shadow.camera.left = -30;
  directionalLight.shadow.camera.top = 30;
  directionalLight.shadow.camera.bottom = -30;
  directionalLight.shadow.mapSize.width = 1024;
  directionalLight.shadow.mapSize.height = 1024;
  directionalLight.shadow.radius = 4;
  directionalLight.shadow.bias = -0.00006;

  return { fillLight1, directionalLight };
}

export { createLights };
