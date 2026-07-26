import * as THREE from 'https://threejs.org/build/three.module.js'
// import { VRButton } from 'https://threejs.org/examples/jsm/webxr/VRButton.js'

let LOG = null

init()

function myLog(txt) {
  console.log(txt);
  if (LOG) LOG.innerText = txt + "\n" + LOG.innerText;
}


async function sceneFromProject(url) {
  myLog(`Loading ${url} ...`);
  const r = await fetch(url);
  if (r.status != 200) {
    myLog(`Failed to load ${url} : ${r.status}`);
    return null
  }
  const project = await r.json();
  myLog("Project loaded and parsed");
  myLog("Init THREE.ObjectLoader");
  const ldr = new THREE.ObjectLoader();
  try {
    const scene = await ldr.parseAsync(project.scene);
    return scene
  } catch (e) {
    myLog(`Parsing scene from ${url} FAILED : ${e}`);
  }
  return null;
}

function sceneBasic() {
	const scene = new THREE.Scene()
	console.log('Scene:', scene)
	
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

	return scene	
}

async function init() {
	// HTML
	// document.body.appendChild( VRButton.createButton( renderer ) )
	const button = document.createElement( 'button' )
	button.textContent = 'XR ?';
	document.body.appendChild(button)
	LOG = document.createElement( 'pre' )
	document.body.appendChild(LOG)
	document.body.appendChild(document.createElement( 'br' ))

	myLog('init')

	const scene = await sceneFromProject("iwsdk/project.json")
	// const scene = sceneBasic()

	const camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 10 )
	camera.position.set( 0, 1.75, 0 )
	scene.add( camera )

	scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) )
	
	const light = new THREE.DirectionalLight( 0xffffff )
	light.position.set( 1, 1, 1 ).normalize()
	scene.add( light )

	const vp_width = 500
	const vp_height = 500

	const renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( vp_width, vp_height )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.setAnimationLoop(()=>{renderer.render( scene, camera )})
	renderer.xr.enabled = true
	myLog('Renderer done')

	document.body.appendChild( renderer.domElement )

	if(!('xr' in navigator )) {
		myLog('No XR')
		button.textContent = 'No XR';
		return
	}
	const ok = await navigator.xr.isSessionSupported( 'immersive-vr' )
	if(!ok) {
		myLog('VR session not supported')
		button.textContent = 'VR session not supported';
		return
	}

	button.textContent = 'Enter XR';
	button.onclick = () => {
		myLog('Entering VR ...')
		// setting features is mandatory else WebXRManager.setSession NotSupportedError: The requested reference space type is not supported.
		const opts = { optionalFeatures: [ 'local-floor', 'bounded-floor', 'layers' ] }
		navigator.xr.requestSession('immersive-vr', opts).then( (session)=>{
			myLog('VR session started')
			session.onend = ()=> {
				myLog('VR session ended')
			}
			myLog('Associating WebXR session to THREEjs renderer')
			renderer.xr.setSession( session ) // async
		} )
	}

}
