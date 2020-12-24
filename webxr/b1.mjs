//------ GLOBALS ------

/* globals BABYLON */  // tell JSHint that BABYLON is a global defined elsewhere
/** needed by camera to attach controls */
let G_canvas = null
/** create scene renderLoop stop perf counter*/
let G_engine = null
/** on Draw for GUI camera */
let G_xr = null
/** on Draw for GUI camera */
let G_plane = null
let G_scene = null
/** to set on blocks and model meshes */
let G_shadows = null
/** text updated on Draw*/
let G_txtFPS = null

let G_nuSky = -1
const SIDES={ // use dics instead of arrays just because easier to input/read
  ft:{ft:1, bk:1, rt:1, lf:1, up:1, dn:1},
  posx:{posx:1,negx:1,posy:1,negy:1,posz:1,negz:1},
  px:{px:1,nx:1,py:1,ny:1,pz:1,nz:1}
}

const G_skyFiles = [
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
  'https://playground.babylonjs.com/textures/equirectangular.jpg',
]

//------ MAIN ------

// no main code as this is a module that may never be used

//------ FUNCTIONS ------

export function start() {
  G_canvas = document.getElementById("renderCanvas")
  G_engine = new BABYLON.Engine(G_canvas, true)
  createSceneAsync().then(onSceneCreated)  
  window.addEventListener("resize", function () { G_engine.resize() })
}
export function stop() {
  if(!G_engine) return // nothing to do
  G_engine.stopRenderLoop()
  G_scene.dispose()
  G_scene=null
  G_engine.dispose()
  G_engine=null
}

function onSceneCreated(returnedScene) {
  //if(G_xr && G_xr.camera && G_plane.parent!=G_xr.camera) G_plane.parent = G_xr.camera
  G_scene = returnedScene
  G_engine.runRenderLoop(onDraw)
}

function onDraw() {
  if(G_scene.activeCamera != G_plane.parent) { // does the active cam changes when in XR mode ?
    G_plane.parent = G_scene.activeCamera
  }
  // realign with XR Camera, when parenting does not work
  // plane.position = xr.camera.getFrontPosition(1.1)
  // plane.rotation = xr.camera.rotation
  G_txtFPS.text = Math.round(G_engine.performanceMonitor.averageFPS).toString()
  G_scene.render()
}

//------ skybox helpers ------

function cubeText2(scene) {
    const dic={dn:27, rt:28, ft:29, lf:30, bk:31, up:37}
    for(const side in dic) {
        // cors fails
        //dic[side]='https://s3-eu-west-1.amazonaws.com/apps.playcanvas.com/xp7v1oFB/files/assets/27587'+dic[side]+'/1/stormydays_'+side+'_1.png'
        dic[side]='https://edukey.github.io/webxr/sky/stormydays_'+side+'_1.png'
    }
    const files=[dic.lf, dic.up, dic.ft, dic.rt, dic.dn, dic.bk]
    return BABYLON.CubeTexture.CreateFromImages(files,scene)
}

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
function addSkyDome(scene, er_img_url) {
    var dome = new BABYLON.PhotoDome("skyDome", er_img_url, { resolution: 32, size: 1000 }, scene)
}
function addSkyBox(scene, cubeTexture) {
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene)
    skybox.material = new BABYLON.StandardMaterial("skyBox", scene)
    skybox.material.reflectionTexture = cubeTexture
    skybox.material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    skybox.material.backFaceCulling = false
    skybox.material.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skybox.material.specularColor = new BABYLON.Color3(0, 0, 0)
}
function showCurrentSky() {
	const sky=G_skyFiles[G_nuSky]
	if(sky.constructor==Array) setSkyBox(scene, sky)
	if(sky.constructor==String) setSkyDome(scene, sky)
}
function switchSky() {
	G_nuSky++
  if(G_nuSky>=G_skyFiles.length) G_nuSky=0
  showCurrentSky()
}

//------ init Scene ------

function initSky(scene) {
  // adding a skybox removes the floor env.ground => unable to teleport anymore ?
  //const skytex = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene)
  const skytex = cubeText2()
  addSkyBox(scene, skytex)
  //addSkyDome(scene, "https://immersive-web.github.io/webxr-samples/media/textures/milky-way-4k.png")
  //addSkyDome(scene, "https://playground.babylonjs.com/textures/equirectangular.jpg")
  // const img = "https://playground.babylonjs.com/textures/sidexside.jpg"
  // const dome = new BABYLON.PhotoDome( "skyDome", img, { resolution: 32, size: 1000 }, scene)
  // dome.imageMode = BABYLON.PhotoDome.MODE_SIDEBYSIDE
}

function initGround(scene, shadows) {
  const groundMaterial = new BABYLON.StandardMaterial("ground", scene)
  groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5)
  groundMaterial.alpha = 0.8
  //groundMaterial.specularColor = new BABYLON.Color3(1, 1, 1)
  const ground = BABYLON.Mesh.CreateGround("ground", 100, 100, 1, scene, false)
  ground.material = groundMaterial
  if(shadows) ground.receiveShadows = true
  return ground
}

function initEnv(scene, shadows) {
  // const env = scene.createDefaultEnvironment() // something magic happens here, with floors and background color ?
  // const options = {}
  // options.skyboxTexture = cubeText2()
  // env.updateOptions(options)
  // env.setMainColor(BABYLON.Color3.Teal())
  // var ground = env.ground
  initSky(scene)
  return initGround(scene, shadows)
}

function initParticles(scene, emitter, particles) {
  // BABYLON.GPUParticleSystem.IsSupported in Quest, but particles only on left screen ?
  // CPU Particles is OK

  // var fountain = BABYLON.Mesh.CreateBox("foutain", 0.1, scene);
  // fountain.visibility = 0.1;
  // fountain.position = new BABYLON.Vector3(-5, 5, 0)

  // only left screen has the GPU particles on VR
  //const particleSystem = new BABYLON.GPUParticleSystem("particles", { capacity:particles }, scene)
  const particleSystem = new BABYLON.ParticleSystem("particles", particles, scene)
  particleSystem.activeParticleCount = particles
  particleSystem.emitRate = 1000
  particleSystem.particleEmitterType = new BABYLON.SphereParticleEmitter(1)
  particleSystem.particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene)
  particleSystem.maxLifeTime = 10
  particleSystem.minSize = 0.01
  particleSystem.maxSize = 0.1
  particleSystem.emitter = emitter
  particleSystem.start()
}

function initGUI(scene) {
  const plane = BABYLON.Mesh.CreatePlane("plane", 1, scene)
  plane.parent = scene.activeCamera // assign to camera so it will always follow it, must reassign when entering VR
  plane.position = new BABYLON.Vector3(-0.1, 0.1, 1.1)
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane)
  const panel = new BABYLON.GUI.StackPanel()
  advancedTexture.addControl(panel)
  function addText(txt) {
    const t = new BABYLON.GUI.TextBlock()
    t.text = txt
    t.height = "40px"
    t.fontSize = "40"
    t.color = "green"
    t.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    panel.addControl(t)
    return t
  }
  addText("FPS")
  G_txtFPS = addText("...")
  return plane
}

function initLight(scene, isShadow) {
  // shodows require a directional light
  const pos = new BABYLON.Vector3(-5, 5, 0)
  if(isShadow) {
    const light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, 0.5), scene)
    light.position = pos
    light.shadowOrthoScale = 2.0    
    scene.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5)
    // Shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadows=shadowGenerator.getShadowMap().renderList
  }
  else {
    const light = new BABYLON.HemisphericLight("light1", pos, scene)
    light.intensity = 0.7
    // scene.createDefaultLight()
  }

  const yellow = new BABYLON.StandardMaterial("yellow", scene)
	//yellow.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5)
	yellow.emissiveColor = new BABYLON.Color3(1, 0.5, 0.5)
  const sLight = BABYLON.Mesh.CreateSphere("sLight", 16, 1, scene)
  sLight.position = pos
  sLight.material = yellow
  return sLight
}

function initCamera(scene, canvas) {
  //scene.createDefaultCamera(false, true, true)
  const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene)
  camera.setTarget(BABYLON.Vector3.Zero())
  camera.attachControl(canvas, true)
}

function initBlocks(scene, shadows) {
  const boxMat = new BABYLON.StandardMaterial("greenMat", scene)
	boxMat.diffuseColor = new BABYLON.Color3(0, 0, 1)
	boxMat.alpha = 0.5
  // add objects, should use MeshBuilder
  const sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene)
  sphere.material = boxMat
  sphere.position.x = -2
  sphere.position.y = 1
  if(shadows) shadows.push(sphere)

  const box1 = BABYLON.Mesh.CreateBox("box1", 1, scene)
  box1.material = boxMat
  box1.position.x = 0
  box1.position.y = 3
  if(shadows) shadows.push(box1)
}

function initActions(scene) {
  const s_switch_vky = new BABYLON.ExecuteCodeAction(
    { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 's' },
    switchSky
  )
  const v_enter_vr = new BABYLON.ExecuteCodeAction(
    { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'v' },
    ()=>{ G_xr.enterVR() }
  )
  const e_exit_vr = new BABYLON.ExecuteCodeAction(
    { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: 'e' },
    ()=>{ G_xr.exitVR(); document.exitFullscreen() }
  )
  scene.actionManager = new BABYLON.ActionManager(scene)
  scene.actionManager.registerAction(s_switch_vky)
  scene.actionManager.registerAction(v_enter_vr)
  scene.actionManager.registerAction(e_exit_vr)
}

//-- the createScene/createSceneAsync func var is to be used for the playground
//-- need to be in async to trigger XR
async function createSceneAsync() {
  const scene = new BABYLON.Scene(G_engine)
  initCamera(scene, G_canvas)
  const sLight=initLight(scene, false)
  initParticles(scene, sLight, 1000)
  G_plane = initGUI(scene)
  const ground = initEnv(scene, G_shadows) // ground and sky
  initBlocks(scene, G_shadows) 

  /** must assign here the glob scene as needed by callback */
  G_scene = scene
  BABYLON.SceneLoader.ImportMesh("him", "https://playground.babylonjs.com/scenes/Dude/", "Dude.babylon", scene, onLoadedModel)
  G_xr = await scene.createDefaultXRExperienceAsync({ floorMeshes: [ground] })

  initActions(scene)

  // floorMeshes are used for teleport  ; G_xr.disableTeleportation
  //scene.onPointerObservable.add(onPointer, BABYLON.PointerEventTypes.POINTERDOWN)
  return scene
}

function onLoadedModel(meshes, particleSystems, skeletons) {
  const dude = meshes[0]; // ? 1:head 2:body cloth 3:legs 4:body 5:eyes
  // shadow on main model
  for (let index = 1; index < meshes.length; index++) {
      if(G_shadows) G_shadows.push(meshes[index])
  }
  // do copies with shadows
  for (let count = 1; count <= 1; count++) {
      // var offsetX = 200 * Math.random() - 100;
      // var offsetZ = 200 * Math.random() - 100;
      const offsetX = 30 * count
      const offsetZ = 0
      for (let index = 1; index < meshes.length; index++) {
          const m = meshes[index]
          const instance = m.createInstance("instance" + count);
          if(G_shadows) G_shadows.push(instance)
          instance.parent = m.parent
          instance.position = m.position.clone()
          if (!instance.parent.subMeshes) {
              instance.position.x += offsetX
              instance.position.z -= offsetZ
          }
      }
  }
  //dude.rotation.y = Math.PI;
  //skeletons2[0].scale(0.5,0.5,0.5,true)
  dude.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05)
  dude.position = new BABYLON.Vector3(0, 0, 10)
  G_scene.beginAnimation(skeletons[0], 0, 100, true, 1.0)
}

function onPointer(pointerInfo) {
  console.log('POINTER DOWN', pointerInfo)
  if (! pointerInfo.pickInfo.hit) return
  if (! pointerInfo.pickInfo.pickedMesh) return
  // "Grab" it by attaching the picked mesh to the VR Controller
  if (xr.baseExperience.state !== BABYLON.WebXRState.IN_XR) return
  const xrInput = xr.pointerSelection.getXRControllerByPointerId(pointerInfo.event.pointerId)
  const motionController = xrInput.motionController
  if (!motionController) return
  pointerInfo.pickInfo.pickedMesh.setParent(motionController.rootMesh)
}