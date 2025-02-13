import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import GUI from "lil-gui";

function loadWorld(scene, worldOctree) {
  const loader = new GLTFLoader().setPath("./models/");
  loader.load("collision-world.glb", (gltf) => {
    scene.add(gltf.scene);
    worldOctree.fromGraphNode(gltf.scene);

    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material.map) child.material.map.anisotropy = 4;
      }
    });

    const gui = new GUI({ width: 200 });
    gui.add({ debug: false }, "debug").onChange((value) => {
      console.log("Debug Mode:", value);
    });
  });
}

export { loadWorld };
