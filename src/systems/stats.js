import Stats from "three/examples/jsm/libs/stats.module.js";

function createStats() {
  const stats = new Stats();
  stats.domElement.style.position = "absolute";
  stats.domElement.style.top = "0px";

  return stats;
}

export { createStats };
