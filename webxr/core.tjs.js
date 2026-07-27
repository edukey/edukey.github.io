import * as THREE from 'https://threejs.org/build/three.module.js'

import Hud from './hud.tjs.mjs'
import User from './user.tjs.mjs'
import Log from './log.dom.mjs'

class Main {

	/**
	 * @param {THREE.Scene} scene
	 * @param {string} version */
	constructor(scene, version, cbLoop) {

		if(!scene) { // create a default scene if none
			scene = new THREE.Scene()
			const blueMat = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, color: 0x0066cc });
			const sphereGeo = new THREE.SphereGeometry(1, 16, 16); // Lower detail for better performance
			const sphereMesh = new THREE.Mesh(sphereGeo, blueMat);
			sphereMesh.position.set(0, 1.75, -3);
			scene.add(sphereMesh);
		}

		if(!version) version = 'BETA'

		this.scene = scene

		const button = document.createElement( 'button' )
		button.textContent = 'XR ?';
		document.body.appendChild(button)

		const pre = document.createElement( 'pre' )
		this.log = new Log(pre)
		const log = this.log.do
		document.body.appendChild(pre)

		document.body.appendChild(document.createElement( 'br' ))

		const VERSION = `--- ${version} ---`
		log(`init version ${VERSION}`)

		this.camera = new THREE.PerspectiveCamera( 50, 1, 0.1, 10 )
		this.camera.position.set( 0, 1.75, 4 )
		scene.add( this.camera )
		this.hud = new Hud(this.camera)
		this.hud.set('',VERSION,'')

		// above the scene, with color fading from the sky color to the ground color. no shadows https://threejs.org/docs/#HemisphereLight 
		scene.add( new THREE.HemisphereLight() )

		// globally illuminates all objects https://threejs.org/docs/#AmbientLight
		scene.add( new THREE.AmbientLight() )

		// Infinite far away, mandatory for shadows
		const light = new THREE.DirectionalLight()
		light.position.set( 1, 1, 1 ).normalize()
		scene.add( light )

		const vp_width = 800
		const vp_height = vp_width
		const renderer = new THREE.WebGLRenderer( { antialias: true } ) // will create a canvas as not specified
		renderer.setPixelRatio( window.devicePixelRatio )
		renderer.setSize( vp_width, vp_height )
		renderer.outputEncoding = THREE.sRGBEncoding

		renderer.xr.enabled = true
		renderer.setAnimationLoop(()=>{
			if(cbLoop) cbLoop(this)
			// ctrlLoop(renderer.xr, my_controllers)
			renderer.render( scene, this.camera )
		})

		this.user = new User(renderer.xr)

		log('Renderer done')

		document.body.appendChild( renderer.domElement )

		if(!('xr' in navigator )) {
			log('No XR')
			button.textContent = 'No XR';
			return
		}
		const ok = await navigator.xr.isSessionSupported( 'immersive-vr' )
		if(!ok) {
			log('VR session not supported')
			button.textContent = 'VR session not supported';
			return
		}

		button.textContent = 'Enter XR';
		button.onclick = () => {
			log('Entering VR ...')
			// setting features is mandatory else WebXRManager.setSession NotSupportedError: The requested reference space type is not supported.
			const opts = { optionalFeatures: [ 'local-floor', 'bounded-floor', 'layers' ] }
			navigator.xr.requestSession('immersive-vr', opts).then( (session)=>{
				log('VR session started')
				session.onend = ()=> {
					log('... VR session ended')
				}
				log('Start THREEjs XR on WebXR session ...')
				renderer.xr.setSession( session ) // async
			} )
		}
	}
}

const _m = new Main()
