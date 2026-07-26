import * as THREE from 'https://threejs.org/build/three.module.js'
// import { VRButton } from 'https://threejs.org/examples/jsm/webxr/VRButton.js'
// import StatsVR from 'https://edukey.github.io/webxr/statsvr.js'

let LOG = null
// let statsVR = null
/** initHud , setHud */
let HUD = null

// Rotation around the Y axis


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

/** Controllers button presses events high level */
function initCtrl(xr) {
	// events from xrController : (dis)connect (select/squeeze)(/start/end)
	// but no events on other items : use the Gamepad API during render to test the status of 
	//   buttons[] 0:trig 1:grip 2:. 3:thumbPress 4:A/X 5:B/Y
	//   axis[] 0:X 1:Y for thumbstick
	const c0=xr.getController( 0 ) // Left
	c0.addEventListener( 'selectstart', ()=>{move(xr, -1)})
	// c0.addEventListener( 'selectend', ()=>{})
	c0.addEventListener( 'squeezestart', ()=>{move(xr, -0.1)})
	// c0.addEventListener( 'squeezeend', ()=>{})

	const c1=xr.getController( 1 ) // Right
	c1.addEventListener( 'selectstart', ()=>{move(xr, 1)})
	// c1.addEventListener( 'selectend', ()=>{})
	c1.addEventListener( 'squeezestart', ()=>{move(xr, 0.1)})
	// c1.addEventListener( 'squeezeend', ()=>{})
}

/** apply a transform to move the player
 * https://threejs.org/docs/#WebXRManager.getReferenceSpace
 * */
function chgRefByOffsetTransfo(xr, offsetTransfo) {
  xr.setReferenceSpace(xr.getReferenceSpace().getOffsetReferenceSpace(offsetTransfo));
}

function teleportOffsetXZ(xr, delta_x, delta_z) {
	chgRefByOffsetTransfo(xr, new XRRigidTransform({ x: -delta_x, y: 0, z: -delta_z, w: 1 }))
}

function rotateUser(xr, angleDeg) {
	const radian = THREE.MathUtils.degToRad(angleDeg)
	const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), radian)
	const transform = new XRRigidTransform({}, // no translation
    {
        x: 0,
        y: rotation.y,
        z: 0,
        w: rotation.w // should be 1 ?
    }
	)
	console.log("rotate", angleDeg, radian, rotation.y, rotation.w)
	chgRefByOffsetTransfo(xr, transform)
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
	// setHud(HUD, dist, delta.x, delta.z)
	teleportOffsetXZ(xr, delta.x, delta.z)
}

function setHud(hud, a, b, c) {
	if(!hud) return
	hud.texture.needsUpdate = true // tell the texture to update from canvas
  hud.ctx.clearRect(0, 0, hud.canvas.width, hud.canvas.height)
  if(a) hud.ctx.fillText(a, 0, 15)
  if(b) hud.ctx.fillText(b, 0, 30)
  if(c) hud.ctx.fillText(c, 0, 45)
}

/** create a HUD Canvas to draw text to */
function initHud(camera) {
		const hud = { }
		const charPix = 15
    hud.canvas = document.createElement('canvas');
    hud.canvas.width = charPix*10;
    hud.canvas.height = hud.canvas.width;
		hud.ctx = hud.canvas.getContext('2d')
		hud.ctx.strokeStyle = '#035363' // beginPath()/moveTo(x,y)/lineTo(x,y)/stroke()
		hud.ctx.fillStyle = "#00cc00" // font color
		hud.ctx.font = "13px Calibri"
    hud.texture = new THREE.Texture(hud.canvas);
    const material = new THREE.MeshBasicMaterial({ map: hud.texture, depthTest: false, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
    const statsPlane = new THREE.Mesh(geometry, material);
    statsPlane.position.x = 0;
    statsPlane.position.y = 0.2;
    statsPlane.position.z = -5;
    statsPlane.renderOrder = 9999;
    camera.add(statsPlane);
    return hud
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

	HUD = initHud(camera)
	setHud(HUD, '---','A','---')

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

	renderer.xr.enabled = true

	const my_controllers = {
		firstError: null,
		right: initCtrlLow('right',{
			left:()=>{rotateUser(renderer.xr,45)},
			right:()=>{rotateUser(renderer.xr,-45)},
			trig:()=>{move(renderer.xr, 1)},
			grip:()=>{move(renderer.xr, -1)},
			by:()=>{move(renderer.xr, 0.1)},
			ax:()=>{move(renderer.xr, -0.1)}
		}),
		left: initCtrlLow('left',{
			trig:()=>{move(renderer.xr, 0.1)},
			grip:()=>{move(renderer.xr, -0.1)},
			left:()=>{rotateUser(renderer.xr,22.5)},
			right:()=>{rotateUser(renderer.xr,-22.5)}
		})
	}
	// initCtrl(renderer.xr)

	renderer.setAnimationLoop(()=>{
		//statsVR.update()
		loopCtrlLow(renderer.xr, my_controllers)
		renderer.render( scene, camera )
	})

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
				myLog('... VR session ended')
			}
			myLog('Start THREEjs XR on WebXR session ...')
			renderer.xr.setSession( session ) // async
		} )
	}
}

function initCtrlLow(name, cbs) {
	if(!cbs) cbs={}
	return {
		name: name,
		firstError: null,
		firstMsg: null,
		trig:{cb:cbs.trig,pressed:false}, 
		grip:{cb:cbs.grip,pressed:false}, 
		ax:{cb:cbs.ax,pressed:false}, 
		by:{cb:cbs.by,pressed:false},
		thb:{cb:cbs.thb,pressed:false},
		left:{cb:cbs.left,pressed:false},
		right:{cb:cbs.right,pressed:false},
		up:{cb:cbs.up,pressed:false},
		down:{cb:cbs.down,pressed:false}
	}
}

function evtCtrlLowPressed(c, obj, pressed, info) {
	// if(!obj.cb) return
	if(!obj.pressed && pressed) {
		// myLog('Pressed '+info+' '+c.name)
		setHud(HUD, 'Pressed', info+' '+c.name)
		obj.pressed=true
		if(obj.cb) obj.cb()
	}
	if(obj.pressed && !pressed) {
		obj.pressed=false
	}
}

function errCtrlLow(errObj, where, e) {
	if(!errObj) return
	if(errObj.firstError) return
	try {
		errObj.firstError = `Error in ${where} : ${e}`
		myLog(errObj.firstError)
		setHud(HUD, "ERROR", "loopCtrlLow", e)
	}
	catch(_e2){
		1
	}
}

function evtCtrlLow(c, g) {
	// https://developer.mozilla.org/en-US/docs/Web/API/Gamepad
	if(!c) return
	if(!g) {
		errCtrlLow(c, 'evtCtrlLow '+c.name, 'No gamepad')
		return
	}

	if(!g.buttons)  {
		errCtrlLow(c, 'evtCtrlLow '+c.name, 'No gamepad buttons')
		return
	}
	if(!g.buttons.length)  {
		errCtrlLow(c, 'evtCtrlLow '+c.name, 'Zero array gamepad buttons')
		return
	}

	// if(!c.firstMsg) {
	// 	myLog(`${c.name} first evtCtrlLow ...`)
	// }

  // const _trig = g.buttons[0]
  // const _grip = g.buttons[1]  		
	evtCtrlLowPressed(c, c.trig, g.buttons[0]?.pressed, "TRIG")
	evtCtrlLowPressed(c, c.grip, g.buttons[1]?.pressed, "GRIP")
	evtCtrlLowPressed(c, c.thb, g.buttons[3]?.pressed, "THUMB")
	evtCtrlLowPressed(c, c.ax, g.buttons[4]?.pressed, "A/X")
	evtCtrlLowPressed(c, c.by, g.buttons[5]?.pressed, "B/Y")

	if(!g.axes) {
		errCtrlLow(c, 'evtCtrlLow '+c.name, 'No axes')
		return
	}
	if(!g.axes.length) {
		errCtrlLow(c, 'evtCtrlLow '+c.name, 'Zero array axes')
		return
	}
	if(g.axes.length<2) {
		errCtrlLow(c, 'evtCtrlLow '+c.name, 'Not at leat two axes, but: '+g.axes.length)
		return
	}
	evtCtrlLowPressed(c, c.left, g.axes.length>2 && g.axes[2]==-1, "THB X Left")
	evtCtrlLowPressed(c, c.right, g.axes.length>2 && g.axes[2]==1, "THB X Right")
	evtCtrlLowPressed(c, c.up, g.axes.length>3 && g.axes[3]==-1, "THB Y Up")
	evtCtrlLowPressed(c, c.down, g.axes.length>3 && g.axes[3]==1, "THB Y Down")
	// if(!c.firstMsg) {
	//  	myLog(`${c.name} first evtCtrlLow axes: ${g.hand} ${g.axes.length} ${g.axes[0]} ${g.axes[1]} ${g.axes[2]} ${g.axes[3]}`)
	//  	c.firstMsg = true
	// }
}

function loopCtrlLow(xr, my_controllers) {
	try {
		const session = xr.getSession();
		if (!session) return
		// https://developer.mozilla.org/en-US/docs/Web/API/XRInputSource
	  const inputSources = session.inputSources;
		// if(!my_controllers.firstMsg) {
		// 	myLog(`first loopCtrlLow , INPUTS : ${inputSources?inputSources.length:'NONE !'}`)
		// 	my_controllers.firstMsg = true
		// }

	  evtCtrlLow(my_controllers.left, inputSources[0]?.gamepad)
	  evtCtrlLow(my_controllers.right, inputSources[1]?.gamepad)
	  return
	}
	catch(e) {
		errCtrlLow(my_controllers, 'loopCtrlLow', e)
	}
}
