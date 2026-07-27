import * as THREE from 'https://threejs.org/build/three.module.js'

/** Teleport/Rotate user relative to its given position / view direction */
export default class User {
	/**
	 * @param {THREE.WebXRManager} xr */
	constructor(xr) {
		this.xr = xr
	}
	/** teleport user of given transfo relative to its current position
	 * https://threejs.org/docs/#WebXRManager.getReferenceSpace
	 * */
	offsetTransfo(offsetTransfo) {
	  this.xr.setReferenceSpace(this.xr.getReferenceSpace().getOffsetReferenceSpace(offsetTransfo));
	}

	/** teleport user of given delta X/Z relative to its current position
	 * @param {number} delta_x
	 * @param {number} delta_z */
	teleportOffsetXZ(delta_x, delta_z) {
		this.offsetTransfo(new XRRigidTransform({ x: -delta_x, y: 0, z: -delta_z, w: 1 }))
	}

	/** rotate user on given degree angle (360) - DOES NOT WORK YET
	 * @param {number} angleDeg */
	rotate(angleDeg) {
		const radian = THREE.MathUtils.degToRad(angleDeg)
		const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), radian)
		const transform = new XRRigidTransform({}, // no translation
	    {
	        x: 0,
	        y: rotation.y,
	        z: 0,
	        w: 1 // rotation.w // should be 1 ?
	    }
		)
		console.log("rotate", angleDeg, radian, rotation.y, rotation.w)
		this.offsetTransfo(transform)
	}

	/** compute a distance on camera direction as normalized vector
	 * @param {number} dist */
	delta(dist) {
		const xrCamera = this.xr.getCamera();

		// 2. Extract the forward direction vector
		const forward = new THREE.Vector3();
		xrCamera.getWorldDirection(forward);

		// 3. Keep current height (flatten Y) and re-normalize
		forward.y = 0;
		forward.normalize();
		console.log("XR Direction on X,Z :", forward)

		// 4. Calculate the horizontal movement delta
		const delta = forward.multiplyScalar(dist);
		console.log("XR Direction delta :", delta)
		return delta
	}

	/** slide perpendicular to the direction of the camera 
	 * @param {number} dist */
	slide(dist) {
		console.log("slide", dist)
		const delta = this.delta(dist)
		// we just exchange z and x
		this.teleportOffsetXZ(delta.z, delta.x)
	}

	/** walk using the direction of the camera 
	 * @param {number} dist */
	move(dist) {
		console.log("move", dist)
		const delta = this.delta(dist)
		this.teleportOffsetXZ(delta.x, delta.z)
	}

}
