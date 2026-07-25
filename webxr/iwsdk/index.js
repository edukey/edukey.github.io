import * as iw from "./iwsdk.min.js";
console.log("build at 2026-07-25T19:41:42+02:00")
const LOG = document.getElementById("log");
myLog("iwsdk imported");
main();
function myLog(txt) {
  console.log(txt);
  if (LOG) LOG.innerText = txt + "\n" + LOG.innerText;
}
async function SceneFromProject(w, url) {
  myLog(`Loading ${url} ...`);
  const r = await fetch(url);
  if (r.status != 200) {
    myLog(`Failed to load ${url} : ${r.status}`);
    return false;
  }
  const project = await r.json();
  myLog("Project loaded and parsed");
  myLog("Init THREE.ObjectLoader");
  const ldr = new iw.ObjectLoader();
  try {
    const scene = await ldr.parseAsync(project.scene);
    w.scene.add(scene);
    myLog(`Add project as World entity`);
    const _ent = w.createTransformEntity(scene);
    myLog(`Project Ready`);
    return true;
  } catch (e) {
    myLog(`Parsing scene from ${url} FAILED : ${e}`);
  }
  return false;
}
function _SceneBasic(w) {
  myLog("Scene : building a basic scene with few Meshes");
  const gBox = new iw.BoxGeometry();
  const gSph = new iw.SphereGeometry(1, 16, 16);
  const gPlane = new iw.PlaneGeometry(2, 2);
  const mprm = {
    roughness: 0.5,
    metalness: 0.2
  };
  const mBlue = new iw.MeshStandardMaterial({ ...mprm, color: 26316 });
  const mGreen = new iw.MeshStandardMaterial({ ...mprm, color: 52326 });
  const mRed = new iw.MeshStandardMaterial({ ...mprm, color: 13395456 });
  const boxBlue = new iw.Mesh(gBox, mBlue);
  const sphRed = new iw.Mesh(gSph, mRed);
  const plnGreen = new iw.Mesh(gPlane, mGreen);
  boxBlue.position.set(0, 1, 2);
  sphRed.position.set(0, 2, 3);
  myLog("Meshes prepared");
  w.scene.add(boxBlue);
  w.scene.add(sphRed);
  w.scene.add(plnGreen);
  const eBox = w.createTransformEntity(boxBlue);
  eBox.addComponent(iw.Interactable).addComponent(iw.OneHandGrabbable, {
    translate: true,
    rotate: true
  });
  const eSph = w.createTransformEntity(sphRed);
  eSph.addComponent(iw.Interactable).addComponent(iw.DistanceGrabbable, {
    translate: true,
    rotate: true,
    scale: true
  });
  const _ePln = w.createTransformEntity(plnGreen);
  myLog("Entities created");
  w.scene.background = new iw.Color(8421504);
  myLog("Scene: Basic filled");
}
async function main() {
  const bt = document.getElementById("launch");
  if (!bt) {
    console.warn("Missing button 'launch'");
    return;
  }
  const div = document.getElementById("world");
  if (!div) {
    console.warn("Missing div 'world'");
    return;
  }
  const opts = {
    xr: {
      // sessionMode: iw.SessionMode.ImmersiveAR,
      sessionMode: iw.SessionMode.ImmersiveVR,
      features: {
        handTracking: true,
        hitTest: true,
        planeDetection: { required: true },
        meshDetection: { required: true },
        anchors: { required: true }
      }
    },
    features: {
      // https://github.com/facebook/immersive-web-sdk/blob/main/packages/core/src/locomotion/locomotion.ts
      // true or object to override default values
      locomotion: {
        enableJumping: true,
        slidingSpeed: 0,
        useWorker: true
      }
      // grabbing: true,
      // sceneUnderstanding: { showWireFrame: true },
    }
  };
  myLog("Creating world...");
  const w = await iw.World.create(div, opts);
  if (!w) {
    console.warn("Failed to create world");
    return;
  }
  const gFloor = new iw.PlaneGeometry(100, 100);
  const mFloor = new iw.Mesh(
    gFloor,
    new iw.MeshBasicMaterial({ visible: false })
  );
  mFloor.rotation.x = -Math.PI / 2;
  w.scene.add(mFloor);
  const eFloor = w.createTransformEntity(mFloor);
  eFloor.addComponent(iw.LocomotionEnvironment, {
    type: iw.EnvironmentType.STATIC
  });
  myLog("World created");
  if (!await SceneFromProject(w, "project.json")) {
    return;
  }
  myLog("World prepared, launch button is enabled");
  bt.disabled = false;
  bt.onclick = () => {
    myLog("Launching XR mode ...");
    w.launchXR();
  };
}
