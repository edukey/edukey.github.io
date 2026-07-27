import * as THREE from 'https://threejs.org/build/three.module.js'
import StatsVR from 'https://edukey.github.io/webxr/statsvr.js'
import { VRButton } from 'https://threejs.org/examples/jsm/webxr/VRButton.js'

import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'https://threejs.org/examples/jsm/loaders/DRACOLoader.js'

var clock = new THREE.Clock()
var container
var camera, scene, renderer
var statsVR
var mixer
var envMap

init()
//animate() animate is triggered by the model load

function onInitModel(gltf) {
  const model = gltf.scene;
  model.position.set( 1, 2, -3 )
  model.scale.set( 0.01, 0.01, 0.01 )
  model.traverse( function ( child ) {
    if ( envMap && child.isMesh ) child.material.envMap = envMap
  } )

  scene.add( model )

  mixer = new THREE.AnimationMixer( model )
  mixer.clipAction( gltf.animations[ 0 ] ).play()

  animate()  
}

function init() {

	container = document.createElement( 'div' )
	document.body.appendChild( container )

  const path = 'https://threejs.org/examples/textures/cube/Park2/';
	const format = '.jpg';
	envMap = new THREE.CubeTextureLoader().load( [
				path + 'posx' + format, path + 'negx' + format,
				path + 'posy' + format, path + 'negy' + format,
				path + 'posz' + format, path + 'negz' + format
	] )
  
	scene = new THREE.Scene()

  scene.background = envMap
	//scene.background = new THREE.Color( 0x505050 )

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 10 )
	camera.position.set( 0, 1.6, 3 )
	scene.add( camera )

	statsVR = new StatsVR(scene, camera)
  statsVR.setY(1)

	//-- lights
	scene.add( new THREE.HemisphereLight( 0x606060, 0x404040 ) )
	var light = new THREE.DirectionalLight( 0xffffff )
	light.position.set( 1, 1, 1 ).normalize()
	scene.add( light )

	renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( window.devicePixelRatio )
	renderer.setSize( window.innerWidth, window.innerHeight )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.xr.enabled = true
	container.appendChild( renderer.domElement )

	window.addEventListener( 'resize', onWindowResize, false )

	document.body.appendChild( VRButton.createButton( renderer ) )

  const dracoLoader = new DRACOLoader()
	dracoLoader.setDecoderPath( 'https://threejs.org/examples/js/libs/draco/gltf/' )

  const loader = new GLTFLoader()
  loader.setDRACOLoader( dracoLoader )
  loader.load( 'https://threejs.org/examples/models/gltf/LittlestTokyo.glb', onInitModel)
  
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize( window.innerWidth, window.innerHeight )
}

function animate() {
	renderer.setAnimationLoop(render)
}

function render() {
	var delta = clock.getDelta()
  mixer.update(delta) 
 	statsVR.update()
	renderer.render( scene, camera )
}