// Target Ray vs. Grip Space
// Three.js separates WebXR controller spaces into two distinct groups:
// Space            Method                                 Primary Use Case
// Grip Space       renderer.xr.getControllerGrip(index)   Visualizing 3D models of the physical held controller.
// Target Ray Space renderer.xr.getController(index)       Laser pointers, raycasting, shooting, or UI pointing vectors.

import * as THREE from 'https://threejs.org/build/three.module.js'; // 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// Setup Renderer & XR
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));

// Initialize Factory
const controllerModelFactory = new XRControllerModelFactory();

// Controller 0 (e.g., Left Hand)
const controllerGrip0 = renderer.xr.getControllerGrip(0);
const model0 = controllerModelFactory.createControllerModel(controllerGrip0);
controllerGrip0.add(model0);
scene.add(controllerGrip0);

// Controller 1 (e.g., Right Hand)
const controllerGrip1 = renderer.xr.getControllerGrip(1);
const model1 = controllerModelFactory.createControllerModel(controllerGrip1);
controllerGrip1.add(model1);
scene.add(controllerGrip1);