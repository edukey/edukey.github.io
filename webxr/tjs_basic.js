import * as THREE from 'https://threejs.org/build/three.module.js'
// import { VRButton } from 'https://threejs.org/examples/jsm/webxr/VRButton.js'
// import StatsVR from 'https://edukey.github.io/webxr/statsvr.js'

let LOG = null
let statsVR = null
let HUD = null
let HUD_txu = null

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

/** Controllers button presses */
function initCtrl(xr) {
	const c0=xr.getController( 0 )
	c0.addEventListener( 'selectstart', ()=>{move(xr, 0.1)})
	c0.addEventListener( 'selectend', ()=>{})
	c0.addEventListener( 'squeezestart', ()=>{move(xr, 1)})
	c0.addEventListener( 'squeezeend', ()=>{})

	const c1=xr.getController( 1 )
	c1.addEventListener( 'selectstart', ()=>{move(xr, -0.1)})
	c1.addEventListener( 'selectend', ()=>{})
	c1.addEventListener( 'squeezestart', ()=>{move(xr, -1)})
	c1.addEventListener( 'squeezeend', ()=>{})
}

/** apply a transform to move the player
 * https://threejs.org/docs/#WebXRManager.getReferenceSpace
 * */
function teleportOffsetTransfo(xr, offsetTransfo) {
  xr.setReferenceSpace(xr.getReferenceSpace().getOffsetReferenceSpace(offsetTransfo));
}

function teleportOffsetXZ(xr, delta_x, delta_z) {
	teleportOffsetTransfo(xr, new XRRigidTransform({ x: -delta_x, y: 0, z: -delta_z, w: 1 }))
}

/** walk using the direction of the camera */
function move(xr, dist) {
	console.log("move", dist)

	const xrCamera = xr.getCamera();

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

	// 5. Update WebXR Reference Space
	setHud(dist, delta.x, delta.z)
	teleportOffsetXZ(xr, delta.x, delta.z)
}

function setHud(a, b, c) {
	HUD_txu.needsUpdate = true // tell the texture to update from canvas
	const ctx = HUD.getContext('2d')
	ctx.strokeStyle = '#035363' // beginPath()/moveTo(x,y)/lineTo(x,y)/stroke()
  ctx.fillStyle = "#00cc00" // font color
  ctx.font = "13px Calibri"
  ctx.clearRect(0, 0, HUD.width, HUD.height)
  if(a) ctx.fillText(a, 0, 15)
  if(b) ctx.fillText(b, 0, 30)
  if(c) ctx.fillText(c, 0, 45)
}

/** create a HUD Canvas to draw text to */
function initHudCanvas(camera) {
		const charPix = 15
    HUD = document.createElement('canvas');
    HUD.width = charPix*10;
    HUD.height = HUD.width;
    HUD_txu = new THREE.Texture(HUD);
    const material = new THREE.MeshBasicMaterial({ map: HUD_txu, depthTest: false, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const statsPlane = new THREE.Mesh(geometry, material);
    statsPlane.position.x = 0;
    statsPlane.position.y = 1;
    statsPlane.position.z = -5;
    statsPlane.renderOrder = 9999;
    camera.add(statsPlane);
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
	camera.position.set( 0, 1.75, 4 )
	scene.add( camera )

	initHudCanvas(camera)
	setHud('hello','the','world')

	// above the scene, with color fading from the sky color to the ground color. no shadows https://threejs.org/docs/#HemisphereLight 
	scene.add( new THREE.HemisphereLight() )

	// globally illuminates all objects https://threejs.org/docs/#AmbientLight
	scene.add( new THREE.AmbientLight() )

	// Infinite far away, mandatory for shadows
	const light = new THREE.DirectionalLight()
	light.position.set( 1, 1, 1 ).normalize()
	scene.add( light )

	// https://threejs.org/docs/#SpotLight

	const vp_width = 800
	const vp_height = vp_width

//	statsVR = new StatsVR(scene, camera)
//	statsVR.setY(1)

	// https://threejs.org/docs/#WebGLRenderer
	const renderer = new THREE.WebGLRenderer( { antialias: true } ) // will create a canvas as not specified
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( vp_width, vp_height )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.setAnimationLoop(()=>{
		//statsVR.update()
		renderer.render( scene, camera )
	})
	renderer.xr.enabled = true
	initCtrl(renderer.xr)
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
