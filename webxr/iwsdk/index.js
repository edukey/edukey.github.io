import * as iw from "./iwsdk.min.js";
console.log("build at 2026-01-11T19:08:44+01:00")
console.log("iwsdk imported");
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
console.log("Meshes prepared");
const opts = {
  xr: {
    sessionMode: iw.SessionMode.ImmersiveAR,
    features: {
      handTracking: true,
      hitTest: true,
      planeDetection: { required: true },
      meshDetection: { required: true },
      anchors: { required: true }
    }
  },
  features: {
    grabbing: true,
    sceneUnderstanding: { showWireFrame: true }
  }
};
const div = document.getElementsByTagName("div")[0];
console.log("Creating world...");
const w = await iw.World.create(div, opts);
console.log("World created");
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
console.log("Entities created");
w.scene.background = new iw.Color(8421504);
console.log("World filled");
w.launchXR();
