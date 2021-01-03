import * as THREE from 'https://threejs.org/build/three.module.js'
import StatsVR from 'https://edukey.github.io/webxr/statsvr.js'
//import StatsVR from 'https://raw.githubusercontent.com/Sean-Bradley/StatsVR/master/dist/client/statsvr.js'
//import { BufferGeometry } from 'https://threejs.org/examples/jsm/geometries/BufferGeometry.js'
import { BoxLineGeometry } from 'https://threejs.org/examples/jsm/geometries/BoxLineGeometry.js'
import { VRButton } from 'https://threejs.org/examples/jsm/webxr/VRButton.js'
import { XRControllerModelFactory } from 'https://threejs.org/examples/jsm/webxr/XRControllerModelFactory.js'

var clock = new THREE.Clock()

var container
var camera, scene, raycaster, renderer
var statsVR
var room

//var controller, controller2, controllerGrip, controllerGrip2
var tempMatrix = new THREE.Matrix4()

var check1 = { ctrl:null, grip:null, box:null, color: 0xff0000 }
var check2 = { ctrl:null, grip:null, box:null, color: 0x0000ff }

var SIDES={ // use dics instead of arrays just because easier to input/read
  ft:{ft:1, bk:1, rt:1, lf:1, up:1, dn:1},
  posx:{posx:1,negx:1,posy:1,negy:1,posz:1,negz:1},
  px:{px:1,nx:1,py:1,ny:1,pz:1,nz:1}
}

/** Teleport 
  https://github.com/AdaRoseCannon/xrgarden/blob/master/src/lib/controllers/controllers.js
*/
var TP={
  nb:10, // points in line
  ctrl:null, // Controller used
  line:null, // Line, contains geo
  geo:new THREE.BufferGeometry(), // contains verts
  verts:null, // positions of line points
  t:null,
  p:null,
  v:null,
  g:new THREE.Vector3(0,-9.8,0),
  tempVec:new THREE.Vector3(),
  tempVec1:new THREE.Vector3(),
  tempVecP:new THREE.Vector3(),
  tempVecV:new THREE.Vector3()
}
function TP_init(ctrl) {
  TP.ctrl=ctrl
  TP.verts = new Float32Array((TP.nb+1) * 3)
  TP.verts.fill(0);
  TP.geo.setAttribute('position', new THREE.BufferAttribute(TP.verts, 3))
  const mat = new THREE.LineBasicMaterial({ color: 0x888888, blending: THREE.AdditiveBlending })
  TP.line = new THREE.Line( TP.geo, mat )
  TP.ctrl.add(TP.line) // add in controlle model group
}
function TP_positionAtT(inVec, t) {
  inVec.copy(TP.p)
  inVec.addScaledVector(TP.v,t)
  inVec.addScaledVector(TP.g,0.5*t**2)
  return inVec
}
function TP_initPos() { // compute p v t values
  // Controller start position
  TP.p = TP.ctrl.getWorldPosition(TP.tempVecP)
  // Set Vector V to the direction of the controller, at 1m/s
  TP.v = TP.ctrl.getWorldDirection(TP.tempVecV)
  // Scale the initial velocity to 6m/s
  TP.v.multiplyScalar(6);
  // Calculate t, this is the above equation written as JS
  TP.t = (-TP.v.y  + Math.sqrt(TP.v.y**2 - 2*TP.p.y*TP.g.y))/TP.g.y 
}
function TP_update() {
  TP_initPos()
  const vertex = TP.tempVec.set(0,0,0)
  for (let i=1; i<=TP.nb; i++) {
    // set vertex to current position of the virtual ball at time t
    TP_positionAtT(vertex,i*TP.t/TP.nb)
    // Copy it to the Array Buffer
    vertex.toArray(TP.verts,i*3)
  }
  TP.line.geometry.attributes.position.needsUpdate = true
}
function TP_move() {
  console.log("Teleporting")
  TP_initPos()
  const cursorPos = TP_positionAtT(TP.tempVec1,TP.t)
  // feet position, which is the head position but on the ground
  const feetPos = renderer.xr.getCamera(camera).getWorldPosition(TP.tempVec)
  feetPos.y = 0;
  const offset = cursorPos.addScaledVector(feetPos ,-1)
  camera.position.add(offset)
}

// https://github.com/mrdoob/three.js/tree/dev/examples/
// https://github.com/immersive-web/webxr-samples
// https://github.com/BabylonJS
// https://github.com/playcanvas/playcanvas.github.io
var skyFiles=[
  //'https://hdrihaven.com/files/hdri_images/tonemapped/8192/kloppenheim_05.jpg', // CORS
  //'https://hdrihaven.com/files/hdris/kloppenheim_05_4k.hdr', // CORS
  'https://immersive-web.github.io/webxr-samples/media/textures/eilenriede-park-2k.png',
	//'https://immersive-web.github.io/webxr-samples/media/textures/chess-pano-4k.jpg', // not EQR
	'https://immersive-web.github.io/webxr-samples/media/textures/milky-way-2k.png',
	'https://immersive-web.github.io/webxr-samples/media/textures/milky-way-4k.png',
  skyFilesThree(SIDES.px,'MilkyWay/dark-s_'),
  skyFilesThree(SIDES.px,'SwedishRoyalCastle/'),
  skyFilesThree(SIDES.posx,'Bridge2/'),
  skyFilesThree(SIDES.px,'pisa/','png'),
  skyFilesThree(SIDES.px,'pisaHDR/','hdr'),
  skyFilesThree(SIDES.px,'pisaRGBM16/','png'),
  skyFilesThree(SIDES.posx,'Park2/'),
  skyFilesThree(SIDES.px,'Park3Med/'),
  skyFilesThree(SIDES.px,'skyboxsun25deg/'),
	skyFilesBabylon('TropicalSunnyDay'),
	skyFilesBabylon('skybox'),
	skyFilesFrom(SIDES.ft,'https://edukey.github.io/webxr/sky/stormydays_$0_1.png'),
  //-- 360 images
	'https://threejsfundamentals.org/threejs/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg',
	'https://live.staticflickr.com/65535/50642987086_c8b30555bb_k.jpg',
	'https://playground.babylonjs.com/textures/equirectangular.jpg']

var nuSky = -1
var doAnim = false
var isSelecting = false
var ROOM_SIZE = 20
var ROOM_MID = ROOM_SIZE/2
var NB_BOXES = 500

init()
animate()

//--------------------
//-- skybox helpers
//--------------------
function skyFilesFrom(dic, tmpl) {
  const lst=[]
  for(const side in dic) lst.push(tmpl.replace('$0',side))
  return lst
}
function skyFilesFromBase(dic, tmpl, item) {
  return skyFilesFrom(dic, tmpl.replace('$1',item)) 
}
function skyFilesThree(dic, item, ext) {
  return skyFilesFromBase(dic, 'https://threejs.org/examples/textures/cube/$1$0.'+(ext?ext:'jpg'), item)
}
function skyFilesBabylon(item) {
  return skyFilesFromBase(SIDES.px, "https://playground.babylonjs.com/textures/$1_$0.jpg", item)
}
function skyDome(scene, url) {
	const loader = new THREE.TextureLoader()
	//-- async

	loader.load(url, (texture) => {
	    const rt = new THREE.WebGLCubeRenderTarget(texture.image.height)
	    rt.fromEquirectangularTexture(renderer, texture)
	    scene.background = rt
	})
	//-- sync
 	// const texture = loader.load(url)
	// const rt = new THREE.WebGLCubeRenderTarget(texture.image.height)
	// rt.fromEquirectangularTexture(renderer, texture)
	// scene.background = rt
}
function skyBox(scene, files) {
	const ctLoader = new THREE.CubeTextureLoader()
	const skyCubeTexture = ctLoader.load(files)
	scene.background = skyCubeTexture
}

function switchBackground() {
	nuSky++
	if(nuSky>=skyFiles.length) nuSky=0
	const skyes=skyFiles[nuSky]
	if(skyes.constructor==Array) skyBox(scene, skyes)
	if(skyes.constructor==String) skyDome(scene, skyes)
}

function randomBox(geometry) {
	// var color = Math.random() * 0xffffff
	const color = 0xffffff
	const mat = new THREE.MeshLambertMaterial( { color: color } )
	const object = new THREE.Mesh( geometry,  mat)
	const max_pos = ROOM_SIZE-1
	object.position.x = Math.random() * max_pos - ROOM_MID
	object.position.y = Math.random() * max_pos
	object.position.z = Math.random() * max_pos - ROOM_MID

	object.rotation.x = Math.random() * 2 * Math.PI
	object.rotation.y = Math.random() * 2 * Math.PI
	object.rotation.z = Math.random() * 2 * Math.PI

	object.scale.x = Math.random() / 4 + 0.05
	object.scale.y = Math.random() / 4 + 0.05
	object.scale.z = Math.random() / 4 + 0.05

	object.userData.velocity = new THREE.Vector3()
	object.userData.velocity.x = Math.random() * 0.005 - 0.005
	object.userData.velocity.y = Math.random() * 0.005 - 0.005
	object.userData.velocity.z = Math.random() * 0.005 - 0.005
	return object	
}

function initCtrl(cmf, octrl, nu, selon, selof, gripon, gripof) {
	octrl.ctrl = renderer.xr.getController( nu )
	if(selon)  octrl.ctrl.addEventListener( 'selectstart', selon)
	if(selof)  octrl.ctrl.addEventListener( 'selectend', selof)
	if(gripon) octrl.ctrl.addEventListener( 'squeezestart', gripon)
	if(gripof) octrl.ctrl.addEventListener( 'squeezeend', gripof)
	octrl.ctrl.addEventListener( 'connected',    (event)=>{ octrl.ctrl.add(buildController(event.data)) } )
	octrl.ctrl.addEventListener( 'disconnected', ()     =>{ octrl.ctrl.remove(octrl.ctrl.children[0]) } )
	scene.add( octrl.ctrl )

 	octrl.grip = renderer.xr.getControllerGrip( nu )
	octrl.grip.add( cmf.createControllerModel( octrl.grip ) )
	scene.add( octrl.grip )
}

function init() {

	container = document.createElement( 'div' )
	document.body.appendChild( container )

	scene = new THREE.Scene()

	switchBackground()
	//scene.background = new THREE.Color( 0x505050 )

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, ROOM_SIZE+1 ) // fov aspect near far
	camera.position.set( 0, 1.6, 3 )
	scene.add( camera )

	statsVR = new StatsVR(scene, camera)
  statsVR.setY(1)

	//-- lights
	scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) )
	var light = new THREE.DirectionalLight( 0xffffff )
	light.position.set( 1, 1, 1 ).normalize()
	scene.add( light )

	//-- room with grid
	room = new THREE.LineSegments(
		new BoxLineGeometry(ROOM_SIZE, ROOM_SIZE, ROOM_SIZE, ROOM_SIZE, ROOM_SIZE, ROOM_SIZE ).translate( 0, ROOM_MID, 0 ),
		new THREE.LineBasicMaterial( { color: 0x808080 } )
	)
	scene.add( room )

	//-- box in room
	var geometry = new THREE.BoxBufferGeometry( 0.5, 0.5, 0.5 )

	// var object = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: 0xff00ff } ) )
	// object.position.x = 0
	// object.position.y = 2
	// object.position.z = -2
	// object.userData.velocity = new THREE.Vector3()
	// object.userData.velocity.x = 0.01
	// object.userData.velocity.y = 0
	// object.userData.velocity.z = 0
	// room.add( object )
	for ( var i = 0; i < NB_BOXES; i ++ ) room.add(randomBox(geometry))

	raycaster = new THREE.Raycaster()

	renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( window.innerWidth, window.innerHeight )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.xr.enabled = true
	container.appendChild( renderer.domElement )

  //-- controllers
  var cmf = new XRControllerModelFactory()  
  initCtrl(cmf, check1, 0, 
           ()=>{ isSelecting = true }, 
           ()=>{ isSelecting = false }, 
           ()=>{ doAnim = !doAnim }) 
  initCtrl(cmf, check2, 1, switchBackground, null, TP_move, null) 
  
  TP_init(check2.ctrl)
  
	window.addEventListener( 'resize', onWindowResize, false )

	document.body.appendChild( VRButton.createButton( renderer ) )
}


function buildController( data ) {
	switch ( data.targetRayMode ) {
		case 'tracked-pointer':
			var geometry = new THREE.BufferGeometry()
			geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 4 ], 3 ) )
			geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) )
			var material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } )
			return new THREE.Line( geometry, material )

		case 'gaze':
			var geometry = new THREE.RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 )
			var material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } )
			return new THREE.Mesh( geometry, material )
	}
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize( window.innerWidth, window.innerHeight )
}

function animate() {
	renderer.setAnimationLoop( render )
}

function renderRoom(delta) {
	// Keep cubes inside room
	for (var cube of room.children) {
		//cube.userData.velocity.multiplyScalar( 1 - ( 0.001 * delta ) )
		cube.position.add( cube.userData.velocity )
		if ( cube.position.x < - ROOM_MID || cube.position.x > ROOM_MID ) {
			cube.position.x = THREE.MathUtils.clamp( cube.position.x, - ROOM_MID, ROOM_MID )
			cube.userData.velocity.x = - cube.userData.velocity.x
		}
		if ( cube.position.y < 0 || cube.position.y > ROOM_SIZE ) {
			cube.position.y = THREE.MathUtils.clamp( cube.position.y, 0, ROOM_SIZE )
			cube.userData.velocity.y = - cube.userData.velocity.y
		}
		if ( cube.position.z < - ROOM_MID || cube.position.z > ROOM_MID ) {
			cube.position.z = THREE.MathUtils.clamp( cube.position.z, - ROOM_MID, ROOM_MID )
			cube.userData.velocity.z = - cube.userData.velocity.z
		}
		cube.rotation.x += cube.userData.velocity.x * 2 * delta
		cube.rotation.y += cube.userData.velocity.y * 2 * delta
		cube.rotation.z += cube.userData.velocity.z * 2 * delta
	}  
}

function checkRay(octrl) {
	tempMatrix.identity().extractRotation( octrl.ctrl.matrixWorld )
	raycaster.ray.origin.setFromMatrixPosition( octrl.ctrl.matrixWorld )
	raycaster.ray.direction.set( 0, 0, - 1 ).applyMatrix4( tempMatrix )
  var old_box = octrl.box
	var intersects = raycaster.intersectObjects( room.children )
	if ( intersects.length > 0 ) {
		if ( octrl.box != intersects[ 0 ].object ) { // new box
			octrl.box = intersects[ 0 ].object
      octrl.box.material.color.setHex(octrl.color)
			//octrl.box.currentHex = octrl.box.material.emissive.getHex() // store prev value
			//octrl.box.material.emissive.setHex( octrl.color )
		}
	} else { // no interset
		octrl.box = undefined
	}
  // unselect previous box if needed
  if(old_box && old_box != octrl.box) {
    old_box.material.color.setHex(0xffffff)
		//old_box.material.emissive.setHex( octrl.box.currentHex )
  }
}

function reInjectBox(ctrl, delta) {
		var cube = room.children[ 0 ]
		room.remove( cube ) // remove from first position in list
		cube.position.copy( ctrl.position )
		cube.userData.velocity.x = ( Math.random() - 0.5 ) * 0.02 * delta
		cube.userData.velocity.y = ( Math.random() - 0.5 ) * 0.02 * delta
		cube.userData.velocity.z = ( Math.random() * 0.01 - 0.05 ) * delta
		cube.userData.velocity.applyQuaternion( ctrl.quaternion )
		room.add( cube ) // put in last position in list
}

function render() {
	var delta = clock.getDelta() * 60
  
	//-- replace first by new box
	if ( isSelecting ) reInjectBox(check1.ctrl, delta)

	//-- find intersections
  checkRay(check1)
  checkRay(check2)
  
  if(doAnim) renderRoom(delta)
  
  TP_update()
  
  statsVR.setCustom1(nuSky)
	statsVR.update()
	renderer.render( scene, camera )
}