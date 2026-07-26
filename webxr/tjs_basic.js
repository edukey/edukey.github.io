import * as THREE from 'https://threejs.org/build/three.module.js'
import { VRButton } from 'https://threejs.org/examples/jsm/webxr/VRButton.js'

init()

async function init() {
	console.log('init')
	const scene = new THREE.Scene()
	console.log('Scene:', scene)

	const vp_width = 500
	const vp_height = 500
	
	const camera = new THREE.PerspectiveCamera( 50, vp_width/vp_height, 0.1, 10 )
	camera.position.set( 0, 1.75, 0 )
	scene.add( camera )

	// scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) )
	
	const light = new THREE.DirectionalLight( 0xffffff )
	light.position.set( 1, 1, 1 ).normalize()
	scene.add( light )

	// --- 1. Define 3D Objects via ThreeJs : geom, material, mesh
	const mprm = { // THREE.MeshStandardMaterialParameters
		roughness: 0.5,
		metalness: 0.2,
	};
	const blueMat = new THREE.MeshStandardMaterial({ ...mprm, color: 0x0066cc });

	const sphereGeo = new THREE.SphereGeometry(1, 16, 16); // Lower detail for better performance
	const sphereMesh = new THREE.Mesh(sphereGeo, blueMat);
	sphereMesh.position.set(0, 1.75, -3);
	scene.add(sphereMesh);

	const renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( vp_width, vp_height )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.setAnimationLoop(()=>{renderer.render( scene, camera )})
	renderer.xr.enabled = true
	console.log('Render', scene)

	const info = document.createElement( 'span' )
	info.innerText = 'Bla bla'
	const button = document.createElement( 'button' )
	button.textContent = 'XR ?';
	document.body.appendChild( VRButton.createButton( renderer ) )
	document.body.appendChild(button)
	document.body.appendChild(info)
	document.body.appendChild(document.createElement( 'br' ))
	document.body.appendChild( renderer.domElement )

	if(!('xr' in navigator )) {
		button.textContent = 'No XR';
		return
	}
	const ok = await navigator.xr.isSessionSupported( 'immersive-vr' )
	if(!ok) {
		button.textContent = 'VR session not supported';
		return
	}

	button.textContent = 'Enter XR';
	button.onclick = ()=>{
		navigator.xr.requestSession( 'immersive-vr').then( (session)=>{
			console.log('VR session started', session)
			session.onend= ()=> {
				console.log('VR session ended')
				button.textContent = 'ENTER VR';
			}
			button.textContent = 'EXIT VR';
			console.log('Associating WebXR session to THREEjs renderer', session)
			renderer.xr.setSession( session ) // async
		} )
	}

}
