import * as THREE from 'https://threejs.org/build/three.module.js'

init()

function init() {
	const scene = new THREE.Scene()
	
	const camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 )
	camera.position.set( 0, 1.75, 3 )
	scene.add( camera )

	// scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) )
	const light = new THREE.DirectionalLight( 0xffffff )
	light.position.set( 1, 1, 1 ).normalize()
	scene.add( light )

	// --- 1. Define 3D Objects via ThreeJs : geom, material, mesh
	const sphereGeo = new THREE.SphereGeometry(1, 16, 16); // Lower detail for better performance
	const mprm = { // THREE.MeshStandardMaterialParameters
		roughness: 0.5,
		metalness: 0.2,
	};
	const blueMat = new THREE.MeshStandardMaterial({ ...mprm, color: 0x0066cc });
	const sphereMesh = new iw.Mesh(sphereGeo, blueMat);
	sphereMesh.position.set(0, 2, 3);
	w.scene.add(sphereMesh);


	const renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( window.innerWidth, window.innerHeight )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.setAnimationLoop(()=>{renderer.render( scene, camera )})
	renderer.xr.enabled = true

	const container = document.getElementById( 'xr' )
	container.appendChild( renderer.domElement )
}