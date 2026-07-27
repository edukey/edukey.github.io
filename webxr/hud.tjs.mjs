import * as THREE from 'https://threejs.org/build/three.module.js'

export default class Hud {
	/**
	 * @param {THREE.Camera} camera */
  constructor(camera) {
		const charPix = 15
    this.canvas = document.createElement('canvas');
    this.canvas.width = charPix*10;
    this.canvas.height = this.canvas.width;
		this.ctx = this.canvas.getContext('2d')
		this.ctx.strokeStyle = '#035363' // beginPath()/moveTo(x,y)/lineTo(x,y)/stroke()
		this.ctx.fillStyle = "#00cc00" // font color
		this.ctx.font = "13px Calibri"
    this.texture = new THREE.Texture(this.canvas);
    const material = new THREE.MeshBasicMaterial({ map: this.texture, depthTest: false, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const statsPlane = new THREE.Mesh(geometry, material);
    statsPlane.position.x = 0;
    statsPlane.position.y = 0.2;
    statsPlane.position.z = -5;
    statsPlane.renderOrder = 9999;
    camera.add(statsPlane);
	}
	set(a, b, c) {
		this.texture.needsUpdate = true // tell the texture to update from canvas
	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
	  if(a) this.ctx.fillText(a, 0, 15)
	  if(b) this.ctx.fillText(b, 0, 30)
	  if(c) this.ctx.fillText(c, 0, 45)
	}
}
