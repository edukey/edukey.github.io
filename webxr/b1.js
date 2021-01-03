//------ GLOBALS ------

/* globals BABYLON */  // tell JSHint that BABYLON is a global defined elsewhere
/** needed by camera to attach controls
 * @type {HTMLCanvasElement?}
*/
let G_canvas = null
/** create scene renderLoop stop perf counter
 * @type {BABYLON.Engine?}
*/
let G_engine = null
/** on Draw for GUI camera
 * @type {BABYLON.WebXRDefaultExperience?}
 */
let G_xr = null
/** on Draw for GUI camera
 * @type {BABYLON.Mesh?}
*/
let G_plane = null
/** @type {BABYLON.Scene?} */
let G_scene = null
/** @type {BABYLON.ActionManager?} */
let G_action_manager=null
/** to set on blocks and model meshes
 * @type {BABYLON.AbstractMesh[]?}
*/
let G_shadows = null
/** text updated on Draw
 * @type {BABYLON.GUI.TextBlock?}
*/
let G_txtFPS = null
/** 
 * @type {BABYLON.GUI.TextBlock[]?}
*/
let G_txts = null

/** @type {BABYLON.GlowLayer?} */
let G_glowLayer = null

/** boxes by sharing geometry
 * @type {BABYLON.Mesh[]}
 */
let G_boxes=[]

/** @type {string?} */
let G_exception = null

/** @type {BABYLON.Mesh?} */
let G_skybox = null

let G_nuSky = 0
const SIDES={ // use dics instead of arrays just because easier to input/read
  ft:{ft:1, dn:1, rt:1, bk:1, up:1, lf:1},
  posx:{posx:1,posy:1,posz:1,negx:1,negy:1,negz:1},
  px:{px:1,py:1,pz:1,nx:1,ny:1,nz:1}
}
// _px, _nx, _py, _ny, _pz, _nz
const G_skyFiles = [
  //'https://hdrihaven.com/files/hdri_images/tonemapped/8192/kloppenheim_05.jpg', // CORS
  //'https://hdrihaven.com/files/hdris/kloppenheim_05_4k.hdr', // CORS
	skyFilesBabylon('TropicalSunnyDay'),
	skyFilesBabylon('skybox'),
  // skyFilesThree(SIDES.px,'MilkyWay/dark-s_'),
  // skyFilesThree(SIDES.px,'SwedishRoyalCastle/'),
  // skyFilesThree(SIDES.posx,'Bridge2/'),
  // skyFilesThree(SIDES.px,'pisa/','png'),
  // skyFilesThree(SIDES.px,'pisaHDR/','hdr'),
  // skyFilesThree(SIDES.px,'pisaRGBM16/','png'),
  // skyFilesThree(SIDES.posx,'Park2/'),
  // skyFilesThree(SIDES.px,'Park3Med/'),
  // skyFilesThree(SIDES.px,'skyboxsun25deg/'),
	// skyFilesFrom(SIDES.ft,'https://edukey.github.io/webxr/sky/stormydays_$0_1.png'), // haut bas inverses
  //-- 360 images
  // 'https://immersive-web.github.io/webxr-samples/media/textures/eilenriede-park-2k.png',
	// 'https://immersive-web.github.io/webxr-samples/media/textures/milky-way-2k.png',
	// 'https://immersive-web.github.io/webxr-samples/media/textures/milky-way-4k.png',
	// 'https://threejsfundamentals.org/threejs/resources/images/equirectangularmaps/tears_of_steel_bridge_2k.jpg',
	// 'https://live.staticflickr.com/65535/50642987086_c8b30555bb_k.jpg',
  // 'https://playground.babylonjs.com/textures/equirectangular.jpg',
]

//------ MAIN ------

// no main code as this is a module that may never be used

//------ FUNCTIONS ------

export function start() {
  // @ts-ignore
  G_canvas = document.getElementById("renderCanvas")
  if(!G_canvas) return
  G_engine = new BABYLON.Engine(G_canvas, true)
  //createSceneAsync().then(onSceneCreated)
  G_scene = createScene()
  if(!G_scene) return
  G_engine.runRenderLoop(onDraw)
  window.addEventListener("resize", function () { if(G_engine) G_engine.resize() })
}
export function stop() {
  if(!G_engine) return // nothing to do
  if(!G_scene) return // nothing to do
  G_engine.stopRenderLoop()
  G_scene.dispose()
  G_scene=null
  G_engine.dispose()
  G_engine=null
}

/** trigger the runRenderLoop, used when in Asynch mode
 * @param {BABYLON.Scene} returnedScene 
 */
function onSceneCreated(returnedScene) {
  //if(G_xr && G_xr.camera && G_plane.parent!=G_xr.camera) G_plane.parent = G_xr.camera
  G_scene = returnedScene
  if(G_engine) G_engine.runRenderLoop(onDraw)
}

/** Some generic Draw, before the ones from registerBeforeRender() */
function onDraw() {
  if(!G_engine || !G_scene || !G_plane) return
  if(G_scene.activeCamera != G_plane.parent) { // does the active cam changes when in XR mode ?
    G_plane.parent = G_scene.activeCamera
  }
  // realign with XR Camera, when parenting does not work
  // plane.position = xr.camera.getFrontPosition(1.1)
  // plane.rotation = xr.camera.rotation
  if(G_txtFPS) G_txtFPS.text = Math.round(G_engine.performanceMonitor.averageFPS).toString()
  G_scene.render()
}

//------ Log/Error mgmt ------

/** add a line in debug panel
 * @param  {...any} args 
 */
function log(...args) {
  const dbg=document.getElementById('debug')
  if(!dbg) return
  let t='\n'
  for(const arg of args) {
    t+=' '+arg
  }
  dbg.innerText+=t
}

/** log error in debug panel
 * @param {Error} err 
 */
function logError(err) {
  if(err==null) return
  if(G_exception) return // error already trapped
  // err.toString()==err.message
  //G_exception=err.toString()+' - '+err.name+'\n'+err.stack
  G_exception=err.stack?err.stack:'?'
  const dbg=document.getElementById('debug')
  if(dbg && G_exception) dbg.innerText+='\n'+G_exception
  if(G_txts && G_txts.length && G_txts.length>=3) G_txts[2].text='!!'
}


//------ skybox helpers ------

/**
 * 
 * @param {Object.<string, number>} dic 
 * @param {string} tmpl 
 */
function skyFilesFrom(dic, tmpl) {
  const lst=[]
  for(const side in dic) lst.push(tmpl.replace('$0',side))
  return lst
}
/**
 * 
 * @param {Object.<string, number>} dic 
 * @param {string} tmpl 
 * @param {string} item 
 */
function skyFilesFromBase(dic, tmpl, item) {
  return skyFilesFrom(dic, tmpl.replace('$1',item)) 
}
/**
 * 
 * @param {Object.<string, number>} dic 
 * @param {string} item 
 * @param {string} ext 
 */
function skyFilesThree(dic, item, ext) {
  return skyFilesFromBase(dic, 'https://threejs.org/examples/textures/cube/$1$0.'+(ext?ext:'jpg'), item)
}
/**
 * 
 * @param {string} item 
 */
function skyFilesBabylon(item) {
  return skyFilesFromBase(SIDES.px, "https://playground.babylonjs.com/textures/$1_$0.jpg", item)
}
/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {string} er_img_url 
 */
function addSkyDome(scene, er_img_url) {
    var dome = new BABYLON.PhotoDome("skyDome", er_img_url, { resolution: 32, size: 1000 }, scene)
}
/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {string[]} files 
 */
function addSkyBoxFrom(scene, files) {
  const texture=BABYLON.CubeTexture.CreateFromImages(files, scene)
  addSkyBox(scene, texture)
}

/**
 * 
 * @param {string} url 
 */
function setSkyDome(url) {
  if(!G_scene || !G_skybox) return
  if(!G_skybox.material) return
  const texture=new BABYLON.EquiRectangularCubeTexture(url, G_scene, 1000)
  ; /**@type {BABYLON.StandardMaterial}*/ (G_skybox.material).reflectionTexture = texture
}
/**
 * 
 * @param {string[]} files 
 */
function setSkyBox(files) {
  if(!G_scene || !G_skybox) return
  if(!G_skybox.material) return
  const texture=BABYLON.CubeTexture.CreateFromImages(files, G_scene)
  ; /**@type {BABYLON.StandardMaterial}*/ (G_skybox.material).reflectionTexture = texture
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.BaseTexture} cubeTexture 
 */
function addSkyBox(scene, cubeTexture) {
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene)
    G_skybox=skybox
    const mat = new BABYLON.StandardMaterial("skyBox", scene)
    mat.reflectionTexture = cubeTexture
    mat.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    mat.backFaceCulling = false
    mat.diffuseColor = new BABYLON.Color3(0, 0, 0)
    mat.specularColor = new BABYLON.Color3(0, 0, 0)
    skybox.material = mat
}
function showCurrentSky() {
	const sky_ref=G_skyFiles[G_nuSky]
	if(sky_ref.constructor==Array) setSkyBox(sky_ref)
	if(sky_ref.constructor==String) setSkyDome(sky_ref)
}
function switchSky() {
	G_nuSky++
  if(G_nuSky>=G_skyFiles.length) G_nuSky=0
  showCurrentSky()
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function initSky(scene) {
  //const skytex = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene)
  addSkyBoxFrom(scene, G_skyFiles[G_nuSky])
  //addSkyDome(scene, "https://immersive-web.github.io/webxr-samples/media/textures/milky-way-4k.png")
  //addSkyDome(scene, "https://playground.babylonjs.com/textures/equirectangular.jpg")
  // const img = "https://playground.babylonjs.com/textures/sidexside.jpg"
  // const dome = new BABYLON.PhotoDome( "skyDome", img, { resolution: 32, size: 1000 }, scene)
  // dome.imageMode = BABYLON.PhotoDome.MODE_SIDEBYSIDE
}

//------ init Scene ------

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.AbstractMesh[]?} shadows 
 * @param {BABYLON.Material?} groundMaterial 
 */
function initGround(scene, shadows, groundMaterial) {
  if(!groundMaterial) {
    // from materials lib (shaders)
    const mat= new BABYLON.GridMaterial("groundMaterial", scene)
    mat.majorUnitFrequency = 1
    mat.minorUnitVisibility = 0.5
    mat.gridRatio = 2
    mat.backFaceCulling = false
    mat.mainColor = new BABYLON.Color3(0, 0.3, 0)
    mat.lineColor = new BABYLON.Color3(0, 0.5, 0)
    mat.opacity = 1 // of lines
    mat.alpha = 0.5
    groundMaterial = mat

    //groundMaterial = new BABYLON.StandardMaterial("", scene)
    // groundMaterial.diffuseTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/grass.jpg")
    //groundMaterial.diffuseColor = new BABYLON.Color3(0, 0.5, 0)
    //groundMaterial.emissiveColor = new BABYLON.Color3(0, 0.1, 0)
    //groundMaterial.specularColor = new BABYLON.Color3(1, 1, 1)
    //groundMaterial.alpha = 0.5
    //groundMaterial.specularColor = new BABYLON.Color3(1, 1, 1)
  }
  //const ground = BABYLON.Mesh.CreateGroundFromHeightMap("ground", "https://playground.babylonjs.com/textures/heightMap.png", 100, 100, 100, 0, 10, scene, false);
  const ground = BABYLON.Mesh.CreateGround("", 100, 100, 1, scene, false)
  ground.material = groundMaterial
  if(shadows) ground.receiveShadows = true
  return ground
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.AbstractMesh[]} shadows 
 */
function initEnv(scene, shadows) {
  // const env = scene.createDefaultEnvironment() // something magic happens here, with floors and background color ?
  // const options = {}
  // options.skyboxTexture = cubeText2()
  // env.updateOptions(options)
  // env.setMainColor(BABYLON.Color3.Teal())
  // var ground = env.ground
  initSky(scene)
  //return initGround(scene, shadows)
  return null
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {*} emitter 
 * @param {*} particles 
 */
function initParticles(scene, emitter, particles) {
  // BABYLON.GPUParticleSystem.IsSupported in Quest, but particles only on left screen ?
  // CPU Particles is OK

  // var fountain = BABYLON.Mesh.CreateBox("foutain", 0.1, scene);
  // fountain.visibility = 0.1;
  // fountain.position = new BABYLON.Vector3(-5, 5, 0)

  // only left screen has the GPU particles on VR
  //const particleSystem = new BABYLON.GPUParticleSystem("particles", { capacity:particles }, scene)
  //particleSystem.activeParticleCount = particles
  const particleSystem = new BABYLON.ParticleSystem("particles", particles, scene)
  particleSystem.emitRate = 1000
  particleSystem.particleEmitterType = new BABYLON.SphereParticleEmitter(1)
  particleSystem.particleTexture = new BABYLON.Texture("https://playground.babylonjs.com/textures/flare.png", scene)
  particleSystem.maxLifeTime = 10
  particleSystem.minSize = 0.01
  particleSystem.maxSize = 0.1
  particleSystem.emitter = emitter
  particleSystem.start()
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function initGUIGrid(scene) {
  const plane = BABYLON.MeshBuilder.CreatePlane("plane", {size:0.15})
  plane.parent = scene.activeCamera // assign to camera so it will always follow it, must reassign when entering VR
  plane.position = new BABYLON.Vector3(-0.1, 0.1, 1.1)
  plane.isPickable=false
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane,1024,1024,false)
  advancedTexture.background = "#AAFFAA44"
  const grid = new BABYLON.GUI.Grid()
  for(let i=0; i<2; i++) grid.addColumnDefinition(0.5)
  for(let i=0; i<4; i++) grid.addRowDefinition(0.25)
  advancedTexture.addControl(grid)
  function addText(/**@type {string}*/txt,/**@type {number}*/r,/**@type {number}*/c) {
    const t = new BABYLON.GUI.TextBlock()
    t.text = txt
    t.height = "150px"
    t.fontSize = "150"
    t.color = "white"
    t.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    //panel.addControl(t)
    grid.addControl(t,r,c)
    return t
  }
  addText("FPS",0,0)
  G_txtFPS = addText("...",0,1)
  G_txts=[]
  for(let i=1; i<4; i++) {
    G_txts.push(addText("T"+i,i,0))
    G_txts.push(addText("T"+i,i,1))
  }
  return plane
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function initGUISmall(scene) {
  const plane = BABYLON.MeshBuilder.CreatePlane("plane", {size:0.05})
  plane.parent = scene.activeCamera // assign to camera so it will always follow it, must reassign when entering VR
  plane.position = new BABYLON.Vector3(-0.1, 0.1, 1.1)
  plane.isPickable=false
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane,1024,1024,false)
  advancedTexture.background = "#AAFFAA44"
  const panel = new BABYLON.GUI.StackPanel()
  advancedTexture.addControl(panel)
  function addText(/**@type {string}*/txt, /**@type {number}*/r, /**@type {number}*/c) {
    const t = new BABYLON.GUI.TextBlock()
    t.text = txt
    t.height = "500px"
    t.fontSize = "500"
    t.color = "white"
    t.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER
    panel.addControl(t)
    return t
  }
  //addText("FPS",0,0)
  G_txtFPS = addText("...",0,1)
  return plane
}

/**
 * @param {BABYLON.Scene} scene
 * @param {boolean} isShadow
 * @param {boolean} showSphere
 */
function initLight(scene, isShadow, showSphere) {
  // shodows require a directional light
  const pos = new BABYLON.Vector3(-10, 10, -10)
  if(isShadow) {
    const light = new BABYLON.DirectionalLight("", new BABYLON.Vector3(0, -0.5, 0.5), scene)
    light.position = pos
    light.shadowOrthoScale = 2.0    
    scene.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5)
    // Shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light)
    shadowGenerator.useBlurExponentialShadowMap = true
    const map=shadowGenerator.getShadowMap()
    if(map) G_shadows=map.renderList
  }
  else {
    //const light = new BABYLON.DirectionalLight("", new BABYLON.Vector3(0, -0.5, 0.5))
    // const light = new BABYLON.HemisphericLight("", pos)
    // light.intensity = 0.7
    scene.createDefaultLight()
  }

  if(!showSphere) return null
  const yellow = new BABYLON.StandardMaterial("", scene)
	//yellow.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5)
	yellow.emissiveColor = new BABYLON.Color3(1, 0.5, 0.5)
  const sLight = BABYLON.Mesh.CreateSphere("", 16, 1)
  sLight.position = pos
  sLight.material = yellow
  return sLight
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {HTMLCanvasElement} canvas 
 */
function initCamera(scene, canvas) {
  //scene.createDefaultCamera(false, true, true)
  const camera = new BABYLON.FreeCamera("", new BABYLON.Vector3(0, 1.75, -5), scene)
  camera.setTarget(new BABYLON.Vector3(0,1,0))
  camera.attachControl(canvas, true)
}

//---------- Interactive part ----------

/**
 * 
 * @param {*} room 
 */
function getRandomPosition(room) {
  return new BABYLON.Vector3(
    BABYLON.Scalar.RandomRange(room.min.x, room.max.x),
    BABYLON.Scalar.RandomRange(room.min.y, room.max.y),
    BABYLON.Scalar.RandomRange(room.min.z, room.max.z))
}
function getRandomRotation() {
  return new BABYLON.Vector3(
    BABYLON.Scalar.RandomRange(0, Math.PI),
    BABYLON.Scalar.RandomRange(0, Math.PI),
    BABYLON.Scalar.RandomRange(0, Math.PI))
}

/**
 * 
 * @param {number} min 
 * @param {number} max 
 */
function getRandomScale(min, max) {
  const scale = BABYLON.Scalar.RandomRange(min, max)
  return new BABYLON.Vector3(scale, scale, scale)
}

/** single mesh with multiple instances inside, color per instance, no collision/detection per instance
 * @param {BABYLON.Scene} scene
*/
function initBlocks_Thin(scene) {
  const pos=getCubePosFrom(1.5,6,9,6)
  const boxMat = new BABYLON.StandardMaterial("boxMat", scene)
	boxMat.diffuseColor = new BABYLON.Color3(0, 0, 1)
  const box = BABYLON.MeshBuilder.CreateBox("box", {}, scene)
  box.material = boxMat // material is fixed
  for(let i=0; i<pos.length; i++) {
    //const r = getRandom()
    //const m = BABYLON.Matrix.Compose(r.scaling, r.rotation.toQuaternion(), r.position)
    const m = BABYLON.Matrix.Translation(pos[i].x,pos[i].y,pos[i].z)
    box.thinInstanceAdd(m, false)
  }
}

/** instances : same geo+mat
 * @param {BABYLON.Scene} scene
*/
function initBlocks_Inst(scene) {
  const pos=getCubePosFrom(1.5,6,3,6)
  const boxMat = new BABYLON.StandardMaterial("boxMat", scene)
	boxMat.diffuseColor = new BABYLON.Color3(0, 1, 0)
  const box = BABYLON.MeshBuilder.CreateBox("box", {}, scene)
  box.material = boxMat // material is fixed
  box.isVisible = false // do not show this mesh, but need to keep it ?
  for(let i=0; i<pos.length; i++) {
    const ins=box.createInstance("box"+i) // this is a mesh known to Js
    //setRandomAtrs(ins)
    ins.position = pos[i]
  }
}

//-- can set color but not material ?
//-- sometimes, whole meshes disappear, why ?
/**
 * 
 * @param {BABYLON.Scene} scene
 * @param {boolean} isPickable 
 */
function initBlocks_SPS(scene, isPickable) {
  const pos=getCubePosFrom(1.5,0,9,6)
  //const boxMat = new BABYLON.StandardMaterial("boxMat", scene)
	const c = new BABYLON.Color4(1, 0, 0, 1)
  const sps = new BABYLON.SolidParticleSystem("sps", scene, {isPickable: isPickable})
  // sps.pickedParticles[faceId]
  const box = BABYLON.MeshBuilder.CreateBox("box", {})
  //box.position = new BABYLON.Vector3(0,9,6) // does not solve disappearance
  //box.material = boxMat // useless ?
  sps.addShape(box, pos.length) // add as many copies as you want to the SPS
  box.dispose() // dispose of the original mesh
  sps.buildMesh() // builds the SPS mesh, do not later use the mesh itself
  //spsMesh.material = boxMat
  // initialise the particle properties
  sps.initParticles = () => {
      //console.log('SPS particles', sps.particles.length)
      for(let i=0; i<sps.particles.length; i++) {
        const p=sps.particles[i]
        //p.material = boxMat
        p.color = c
        //setRandomAtrs(p)
        p.position=pos[i]
      }
  }
  sps.initParticles() // call the initialising function
  sps.setParticles() // apply the properties and display the mesh
  return sps
}

/**
 * 
 * @param {number} d 
 * @param {number} dx 
 * @param {number} dy 
 * @param {number} dz 
 */
function getCubePosFrom(d, dx,dy,dz) {
  const pos=[]
  for(let z=-d; z<=d; z+=d) {
    for(let y=-d; y<=d; y+=d) {
      for(let x=-d; x<=d; x+=d) {
        pos.push(new BABYLON.Vector3(dx+x, dy+y, dz+z))
      }
    }
  }
  return pos
}

const ROOM={
  nb: 100,
  min: new BABYLON.Vector3(-5,0.2,-5),
  max: new BABYLON.Vector3( 5,5  , 5),
}

/** SIDE object
 * @typedef {object} SIDE
 * @prop {BABYLON.AbstractMesh?} selectedMesh
 * @prop {MY_NODE?} selectedNode
 * @prop {number?} selectedIdx
 * @prop {BABYLON.Node?} parent
 * @prop {BABYLON.StandardMaterial} material
 * @prop {BABYLON.Color4} color4
 * @prop {BABYLON.WebXRInputSource} srce
 * @prop {BABYLON.WebXRAbstractMotionController} ctrl
 * @prop {BABYLON.Ray} ray
 * @prop {BABYLON.WebXRControllerComponent} trigger xr-standard-trigger
 * @prop {BABYLON.WebXRControllerComponent} squeeze xr-standard-squeeze
 * @prop {BABYLON.WebXRControllerComponent} butA    a-button
 * @prop {BABYLON.WebXRControllerComponent} butB    b-button
 * @prop {BABYLON.WebXRControllerComponent} stick   xr-standard-thumbstick
 */

/** @type {BABYLON.StandardMaterial?} */
let G_boxMat=null

/** Freeze moves */
let G_freeze=false

/** @type {Object.<string, SIDE?>} */
const G_side={left:null, right:null}

/** unchanged vector for some axis rotation needs */
const G_REF_LOCAL_VECT = new BABYLON.Vector3(0,0,1)

/** Temp Vector to move mesh along pointer direction */
const G_moveVect=BABYLON.Vector3.Zero()

/** 
 * @typedef {object} MY_NODE
 * @prop {BABYLON.Vector3} position
 * @prop {BABYLON.Vector3} rotation
 * @prop {BABYLON.Vector3} velocity
 * @prop {BABYLON.Color4} color
 * @prop {number} idx
 * @prop {boolean} grabbing
 * @prop {boolean} pushing
 * @prop {string?} selected left or right
 * @prop {BABYLON.Mesh?} mesh
 * @prop {BABYLON.SolidParticle?} particle
*/

/** List of virtual nodes sharing their position/rotation/velocity with a Mesh or Particle
 * @type {MY_NODE[]} */
const G_nodes=[]

/** @type {BABYLON.SolidParticleSystem?} */
let G_SPS=null

function onUpdateBouncing_Safe() {
  try{
    onUpdateBouncing()
  }
  catch(err) {
    logError(err)
  }
}

/** update bouncing when as meshes */
function onUpdateBouncing() {
  for(const n of G_nodes) {
    updateOneBouncingBox(n.idx)
  }
  // const ct=ctrl[b.metadata.selected]
  // ct.srce.getWorldPointerRayToRef(ct.ray)
  // ct.ray.direction.scaleInPlace(0.1)
  // b.setParent(null) // detach from controller mesh
  // b.position.subtractInPlace(ct.ray.direction) // move closer
  // b.setParent(ct.ctrl.rootMesh)
}

/** Unitary node update, required for SPS
 * @param {number} idx 
 */
function updateOneBouncingBox(idx) {
  const n = G_nodes[idx]
  const p = n.position
  const v = n.velocity
  if(n.selected) {
    if(!n.grabbing && !n.pushing) return // nothing to do
    // distance with pointer
    G_moveVect.copyFrom(n.position) // in mesh mode, origin is pointer, so position is already OK
    if(G_SPS) { // in SPS mode need to do the diff with pointer position
      const oSide=G_side[n.selected]
      if(!oSide) return
      G_moveVect.subtractInPlace(oSide.srce.pointer.position)
    }
    if(n.grabbing) {
      if(G_moveVect.length()<=0.5) return // close enough to origin
      G_moveVect.normalize() // same direction with length=1
      G_moveVect.scaleInPlace(0.05)
      n.position.subtractInPlace(G_moveVect)
    }
    else if(n.pushing) {
      if(G_moveVect.length()>10) return // already too far
      G_moveVect.normalize() // same direction with length=1
      G_moveVect.scaleInPlace(0.05)
      n.position.addInPlace(G_moveVect)
    }
    return
  }
  if(G_freeze) return // do nothing on freeze
  p.addInPlace(v)
  let chg = false
  if(p.x < ROOM.min.x) { v.x =  Math.abs(v.x); chg=true }
  else if(p.x > ROOM.max.x) { v.x = -Math.abs(v.x); chg=true }
       if(p.z < ROOM.min.z) { v.z =  Math.abs(v.z); chg=true }
  else if(p.z > ROOM.max.z) { v.z = -Math.abs(v.z); chg=true }
       if(p.y < ROOM.min.y) { v.y =  Math.abs(v.y); chg=true }
  else if(p.y > ROOM.max.y) { v.y = -Math.abs(v.y); chg=true }
  if(chg) { // orient the mesh to new direction
    const b = n.mesh
    if(b) b.setDirection(n.velocity)
    // b.lookAt(target)==b.setDirection(target.substract(b.position))
    // b.lookAt(b.position.add(v))
    //b.setDirection(v.normalizeToNew())
  }
}

/** DEPRECATED 
 * @param {BABYLON.PointerInfo} pointerInfo
 */
function onPointerBouncing_Safe(pointerInfo) {
  try{
    onPointerBouncing(pointerInfo)
  }
  catch(err) {
    logError(err)
  }
}
/** DEPRECATED babylon pointer click, replaced by just trigger press then pointed mesh detection
 * moving the pointer within boxes with auto-detect reduces fps
 * @param {BABYLON.PointerInfo} pointerInfo
 */
function onPointerBouncing(pointerInfo) {
  if(!G_xr) return
  if(G_xr.baseExperience.state !== BABYLON.WebXRState.IN_XR) return
  const evt = /**@type {PointerEvent}*/ (pointerInfo.event)
  if(!evt.pointerId) return
  const xrInput = G_xr.pointerSelection.getXRControllerByPointerId(evt.pointerId)
  if(!xrInput) return
  
  const controller = xrInput.motionController
  if(!controller) return
  const oSide=ensureCtrlInit(xrInput)
  if(!oSide) return
  if(!pointerInfo.pickInfo || !pointerInfo.pickInfo.hit || !pointerInfo.pickInfo.pickedMesh) return
  const m=pointerInfo.pickInfo.pickedMesh
  if(!m.metadata || !m.metadata.velocity) return // not a box

  // motionController.profileId oculus-touch
  selectNode(oSide, m.metadata.idx)
}

/**
 * 
 * @param {SIDE} oSide 
 * @param {number} idx
 */
function selectNode(oSide, idx) {
  // some box is already selected ?!
  if(oSide.selectedIdx!=null) {
    if(oSide.selectedIdx==idx) return // already ok
    releaseSelectedNode(oSide)
  }
  const n = G_nodes[idx]
  if(n.selected) return // node already selected by other side, do nothing
  oSide.selectedIdx=idx
  oSide.selectedNode=n
  n.selected=oSide.ctrl.handedness
  n.color.copyFrom(oSide.color4)
  if(n.mesh) {
    const m = n.mesh
    oSide.selectedMesh=m
    oSide.parent=m.parent // should be null
    m.material= oSide.material
    m.setParent(oSide.ctrl.rootMesh) //-- grap to controller
  }

  if(G_txts) {
    G_txts[4].text = "Msh"
    G_txts[5].text = idx.toString()
  }

  // G_txts[side=='left'?2:3].text='PR'
  // G_txts[side=='left'?4:5].text=m.metadata.nu.toString()
  //const ray = pointerInfo.pickInfo.ray
  //ray.direction
  // ray.direction.scaleInPlace(0.2)
  // b.position.copyFrom(ray.origin)
  // b.position.addInPlace(ray.direction)
}

/**
 * 
 * @param {SIDE} oSide 
 * @param {BABYLON.PickingInfo?} pickInfo
 */
function selectNodeFromPickedParticle(oSide, pickInfo) {
  if(!pickInfo || !G_SPS) return
  const faceId = pickInfo.faceId
  if(faceId == -1) return
  const idx = G_SPS.pickedParticles[faceId].idx // find the particle having this face
  selectNode(oSide, idx)
}

/** Detected picked Mesh/Particle using SPS pickedParticles or pickedMesh, 
 * use PointerSelection if active else do the Ray picking
 * @param {SIDE} oSide 
 */
function detectNodeInRay(oSide) {
  if(!G_xr) return
  if(G_xr.pointerSelection && G_xr.pointerSelection.attached) {
    const controller_id=oSide.srce.uniqueId
    if(G_SPS) {
      //-- access private pickInfo as not made accessible ...
      const ctrls = G_xr.pointerSelection['_controllers']
      /**@type {BABYLON.PickingInfo?}*/
      const pickInfo = ctrls[controller_id].pick
      selectNodeFromPickedParticle(oSide, pickInfo)
      //G_SPS.pickedParticle(pickingInfo)
      //G_SPS.pickedParticles[0] // do not know if picked from
    }
    else {
      // nb: in case of SPS, it is the global SPS Mesh
      const pointedMesh = G_xr.pointerSelection.getMeshUnderPointer(controller_id)
      if(pointedMesh) selectNode(oSide, pointedMesh.metadata.idx)
    }
    return
  }
  // if pointerSelection is disabled, use our own detection
  oSide.srce.getWorldPointerRayToRef(oSide.ray)
  //similar to G_scene?.pickWithRay(oSide.ray) : PickingInfo but looking only at our boxes
  const pickInfos = oSide.ray.intersectsMeshes(G_SPS?[G_SPS.mesh]:G_boxes, false)
  if(G_txts) {
    G_txts[2].text = "Pick"
    G_txts[3].text = pickInfos.length.toString()
  }
  if(pickInfos.length==1) {
    const pi=pickInfos[0]
    if(G_SPS) {
      selectNodeFromPickedParticle(oSide, pi)
    }
    else { // via Mesh
      const m=pi.pickedMesh // in case of SPS, it is the global SPS Mesh
      if(m) {
        selectNode(oSide, m.metadata.idx)
      }
    }
  }
}

/**
 * 
 * @param {SIDE} oSide 
 */
function releaseSelectedBox_Safe(oSide) {
  try{
    releaseSelectedNode(oSide)
  }
  catch(err) {
    logError(err)
  }
}

/**
 * @param {SIDE} oSide left/right
 */
function releaseSelectedNode(oSide) {
  const n = oSide.selectedNode
  if(!n) return
  n.color.copyFrom(G_def_color)
  if(n.mesh) {
    const m = n.mesh
    m.material=G_boxMat
    m.setParent(oSide.parent) // release from controller, og parent should be null
    m.getDirectionToRef(G_REF_LOCAL_VECT, n.velocity) // direction vector from current rotation
    n.velocity.scaleInPlace(0.02)
  }
  n.selected=null
  oSide.selectedNode=null
  oSide.selectedIdx=null
  oSide.selectedMesh=null
  oSide.parent=null
  // G_txts[side=='left'?2:3].text='nP'
  // G_txts[side=='left'?4:5].text='-'
}

/** Init a left/right XR controller, its mesh must be already loaded
 * @param {BABYLON.WebXRInputSource} xrInput
 * @returns {SIDE?} null if failed somehow
 */
function ensureCtrlInit(xrInput) {
  if(!G_scene) return null
  console.log("ensureCtrlInit")
  const controller=xrInput.motionController
  if(!controller) {
    console.log("no motionController !!")
    return null
  }
  const side=controller.handedness
  console.log("ensureCtrlInit", side)
  if(G_side[side]) return G_side[side] // already init, nothing to do

  const mat = new BABYLON.StandardMaterial("", G_scene)
	mat.diffuseColor = side=="right" ? new BABYLON.Color3(1,0,0) : new BABYLON.Color3(0,0,1)

  /** @type {SIDE} */
  const oSide = {
    selectedMesh:null,
    selectedIdx:null,
    selectedNode:null,
    parent:null,
    material:mat,
    color4:side=="right" ? new BABYLON.Color4(1,0,0,1) : new BABYLON.Color4(0,0,1,1),
    srce:xrInput,
    ctrl:controller,
    ray:BABYLON.Ray.Zero(),
    //-- isButton : .value 0-1 .pressed=1 .touched>0
    trigger:controller.components['xr-standard-trigger'],
    squeeze:controller.components['xr-standard-squeeze'],
    butA   :controller.components[side=="right"?'a-button':'x-button'],
    butB   :controller.components[side=="right"?'b-button':'y-button'],
    // isAxes .x .y
    stick  :controller.components['xr-standard-thumbstick'], 
  }
  G_side[side]=oSide
  
  const h=0.5
  //const mCyl = BABYLON.MeshBuilder.CreateCylinder("", {height:h, diameter:0.01})
  // box with shape properly oriented
  // cf: https://github.com/BabylonJS/Babylon.js/blob/master/src/XR/features/WebXRControllerPointerSelection.ts _generateNewMeshPair()
  const mCyl = BABYLON.MeshBuilder.CreateCylinder("",{ height: h, diameterTop: 0.005, diameterBottom: 0.01, tessellation: 20, subdivisions: 1, })
  //const mCyl = BABYLON.MeshBuilder.CreateBox("", {width:0.01, height:0.01, depth:h})
  const mat2 = new BABYLON.StandardMaterial("", G_scene)
  mat2.emissiveColor= side=="right" ? new BABYLON.Color3(0.2,0,0) : new BABYLON.Color3(0,0,0.2)
  //mat2.alpha = 0.7
  mCyl.material = mat2
  mCyl.isPickable = false
  if(G_glowLayer) G_glowLayer.addIncludedOnlyMesh(mCyl)
  //  oSide.srce.getWorldPointerRayToRef(oSide.ray) // not the same as Pointer.ray ??
  //  mCyl.setDirection(oSide.ray.direction)
  mCyl.parent=oSide.srce.pointer
  mCyl.rotation.x = Math.PI / 2 // correct the angle
  mCyl.position.z=(h/2) + 0.05 // adjust the position just in front of controller
  
  //-- register actions on this ctrl
  oSide.trigger.onButtonStateChangedObservable.add((cmpt) => {
    if(cmpt.value==0 && oSide.selectedNode) releaseSelectedBox_Safe(oSide)
    if(cmpt.value==1) detectNodeInRay(oSide) // do not use anymore the onPointerBouncing
  })
  oSide.squeeze.onButtonStateChangedObservable.add((cmpt) => {
    if(oSide.selectedNode) oSide.selectedNode.grabbing=(cmpt.value==1)
    //motionController.pulse(0.5,500)
  })
  oSide.butA.onButtonStateChangedObservable.add((cmpt)=>{
    if(oSide.selectedNode) oSide.selectedNode.pushing=(cmpt.value==1)
  })
  oSide.butB.onButtonStateChangedObservable.add((cmpt)=>{
    if(cmpt.value==1) G_freeze=!G_freeze
  })
  return G_side[side] 
}

/** Generates random position/rotation/velocity, using ROOM space */
function getRandomPRV() {
  return {
    position: getRandomPosition(ROOM),
    rotation: getRandomRotation(),
    velocity: new BABYLON.Vector3(
      Math.random() * 0.005 - 0.005,
      Math.random() * 0.005 - 0.005,
      Math.random() * 0.005 - 0.005)
  }
}

/** picked bouncing using cloned Meshes
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.Mesh} box
 */
function initBouncing_Clone(scene, box) {
  for(let i=0; i<G_nodes.length; i++) {
    const b=i==0?box:box.clone("")
    const n=G_nodes[i]
    G_boxes.push(b) // needed for the manual intersect detection when XrPointerSelection is off
    b.metadata={idx:i}
    b.position = n.position
    //b.rotation = n.rotation
    b.setDirection(n.velocity)
  }
  // boxes animation
  scene.registerBeforeRender(onUpdateBouncing_Safe)
  //scene.onPointerObservable.add(onPointerBouncing_Safe, BABYLON.PointerEventTypes.POINTERDOWN)
  //scene.onPointerObservable.add(on_up, BABYLON.PointerEventTypes.POINTERUP)
}

/** picked bouncing using SPS, only chg colors, no setDirection()
 * @param {BABYLON.Scene} scene
 * @param {BABYLON.Mesh} model
 */
function initBouncing_SPS(scene, model) {
  var SPS = new BABYLON.SolidParticleSystem('SPS', scene, {isPickable: true})
  G_SPS = SPS // needed for node detection
  SPS.addShape(model, G_nodes.length)
  var mesh = SPS.buildMesh()
  //mesh.position = BABYLON.Vector3.Zero()
  mesh.updateFacetData()
  model.dispose()
  SPS.initParticles=()=>{
    for(let i=0; i<G_nodes.length; i++) {
      const p = SPS.particles[i]
      const n = G_nodes[i]
      n.particle = p
      p.position = n.position
      p.rotation = n.rotation // no set Direction() method on particles
      p.velocity = n.velocity
      p.color = n.color
    }
  }

  SPS.updateParticle=(particle)=>{
    updateOneBouncingBox(particle.idx)
    return particle
  }
  // nb: no use of SPS.recycleParticle()

  SPS.initParticles()	  	// compute particle initial status
  SPS.setParticles()  		// updates the SPS mesh and draws it
  SPS.refreshVisibleSize() // updates the BBox for pickability

  // Optimizers after first setParticles() call
  // This will be used only for the next setParticles() calls
  SPS.computeParticleTexture = false
  SPS.computeParticleColor = true
  SPS.computeParticleRotation = false
  SPS.computeParticleVertex = false

  scene.registerBeforeRender(()=>{
    SPS.setParticles() // will call SPS.updateParticle() callback
  })

}

const G_def_color = new BABYLON.Color4(1, 1, 1, 1)

/**
 * 
 * @param {BABYLON.Scene} scene
 */
function initBouncing(scene) {
  G_boxMat = new BABYLON.StandardMaterial("", scene)
	G_boxMat.diffuseColor = new BABYLON.Color3(1,1,1)

  //const model=BABYLON.MeshBuilder.CreateBox("",{size:0.25})
  const model=buildArrowMesh()
  model.scaling = new BABYLON.Vector3(0.25,0.25,0.25)

  model.material = G_boxMat

  for(let i=0; i<ROOM.nb; i++) {
    const r=getRandomPRV()
    /**@type {MY_NODE}*/
    const n={
      idx:i,
      position: r.position,
      rotation: r.rotation,
      velocity: r.velocity,
      color: G_def_color.clone(),
      grabbing:false,
      pushing:false,
      selected:null,
      mesh:null,
      particle:null,
    }
    G_nodes.push(n)
  }

  initBouncing_SPS(scene, model)
  //initBouncing_Clone(scene, model)

  touchAction('f',()=>{G_freeze=true})
}

/** share same geo, or just a copy ?
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.AbstractMesh[]} shadows
 */
function initBlocks_Clone(scene, shadows) {
  // https://doc.babylonjs.com/divingDeeper/mesh/copies
  const boxMat = new BABYLON.StandardMaterial("boxMat", scene)
	boxMat.diffuseColor = new BABYLON.Color3(1, 1, 1)
	//boxMat.alpha = 0.5
  // add objects, should use MeshBuilder
  // const sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 1, scene)
  // sphere.material = boxMat
  // sphere.position.x = -2
  // sphere.position.y = 1
  // if(shadows) shadows.push(sphere)
  // use cloning to share geometry
  const box=BABYLON.MeshBuilder.CreateBox("box0",{},scene)
  box.material = boxMat
  const pos=getCubePosFrom(1.5,0,3,6)
  const boxes=[]
  boxes.push(box)
  for(let i=1; i<pos.length; i++) boxes.push(box.clone("box"+i))
  for(let i=0; i<pos.length; i++) {
    const box = boxes[i]
    //setRandomAtrs(box)
    box.position=pos[i]
    if(shadows) shadows.push(box)
  }
  return boxes
}
/**
 * @param {BABYLON.Scene} scene 
 * @param {BABYLON.AbstractMesh[]} shadows
 */
function initBlocks(scene, shadows) {
  const boxMat = new BABYLON.StandardMaterial("boxMat", scene)
	boxMat.diffuseColor = new BABYLON.Color3(1, 0, 1)
  const pos=getCubePosFrom(1.5,-6,3,6)
  for(let i=0; i<pos.length; i++) {
    const box=BABYLON.MeshBuilder.CreateBox("box"+i,{},scene)
    box.material = boxMat
    box.position = pos[i]
    if(shadows) shadows.push(box)
  }
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function niceTextures(scene) {
	var brickWallDiffURL = "http://i.imgur.com/Rkh1uFK.png";
	var brickWallNHURL = "http://i.imgur.com/GtIUsWW.png";
	var stoneDiffURL = "http://i.imgur.com/VSbN3Fc.png";
	var stoneNHURL = "http://i.imgur.com/zVGaZNi.png";
  const textures=[
    {
      diff:new BABYLON.Texture(stoneDiffURL, scene), 
      normHeight:new BABYLON.Texture(stoneNHURL, scene)},
    {
      diff:new BABYLON.Texture(brickWallDiffURL, scene), 
      normHeight:new BABYLON.Texture(brickWallNHURL, scene)}
  ]
  return textures
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {number} nuText 
 */
function groundMat(scene, nuText) {
  const t=niceTextures(scene)[nuText]
  t.diff.uScale = 100
  t.diff.vScale = 100
  t.normHeight.uScale = 100
  t.normHeight.vScale = 100
  const material = new BABYLON.StandardMaterial("niceMat"+nuText, scene)
  material.diffuseTexture = t.diff
  material.bumpTexture = t.normHeight
  material.useParallax = true
  material.useParallaxOcclusion = true
  material.parallaxScaleBias = 0.1
  material.specularPower = 1000.0
  material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5)
  return material
}

function initPlane() {
  if(!G_scene) return
  const mat = new BABYLON.StandardMaterial("", G_scene)
  mat.diffuseTexture = new BABYLON.Texture("http://i.imgur.com/Rkh1uFK.png", G_scene)
  mat.bumpTexture = new BABYLON.Texture("http://i.imgur.com/GtIUsWW.png", G_scene)
  //const abstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 20, 10), new BABYLON.Vector3(1, 0, -1))
	//const options = {
		//sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    //pattern: BABYLON.Mesh.NO_FLIP, // defaut
    //sourcePlane: abstractPlane, // only for CreatePlane() ?
		//width: 2, height: 2, // default=1 ; size=width=height
		//tileWidth: 1, tileHeight: 1 // default=1 ; tileSize=tileWidth=tileHeight
	//}
	const tiledPane = BABYLON.MeshBuilder.CreateTiledPlane("", {width:4, height:2})
  tiledPane.material = mat
  tiledPane.position = new BABYLON.Vector3(0,2.5,0)
	const tileR = BABYLON.MeshBuilder.CreateTiledPlane("", {width:4, height:2})
  tileR.material = mat
  tileR.position = new BABYLON.Vector3(-2,2.5,-2)
  tileR.rotation = new BABYLON.Vector3(0,-1.55,0)
	const tile2 = BABYLON.MeshBuilder.CreateTiledPlane("", {width:4, height:2})
  tile2.material = mat
  tile2.position = new BABYLON.Vector3(2,2.5,-2)
  tile2.rotation = new BABYLON.Vector3(0,1.55,0)
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function initParalax(scene) {
  const textures = niceTextures(scene)
  const options=[
    {bump:false, para:false, occlu:false},
    {bump:true, para:false, occlu:false},
    {bump:true, para:true, occlu:false},
    {bump:true, para:true, occlu:true},
  ]
  let y=1
  for(const t of textures) {
    let x=-2
    t.diff.uScale=5
    t.diff.vScale=5
    t.normHeight.uScale=5
    t.normHeight.vScale=5
    for(const o of options) {
      const material = new BABYLON.StandardMaterial("mt"+y+"-"+x, scene)
      material.diffuseTexture = t.diff
      if(o.bump) {
        material.bumpTexture = t.normHeight
        material.useParallax = o.para
        material.useParallaxOcclusion = o.occlu
        material.parallaxScaleBias = 0.1
      }
      material.specularPower = 1000.0
      material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5)
      const mesh = BABYLON.Mesh.CreateBox("box"+y+"-"+x, 0.5, scene)
      mesh.position = new BABYLON.Vector3(x, y, 0)
      mesh.material = material
      x+=0.6
    }
    y+=0.6
  }
}


function initAxis() {
  const org=new BABYLON.Vector3(0,0,0)
  // const x = BABYLON.MeshBuilder.CreateLines("", {points:[org, new BABYLON.Vector3(1,0,0)]})
  // x.color=new BABYLON.Color3(1,0,0)
  //const y = BABYLON.MeshBuilder.CreateLines("", {points:[org, new BABYLON.Vector3(0,1,0)]})
  //y.color=new BABYLON.Color3(0,1,0)
  // const z = BABYLON.MeshBuilder.CreateLines("", {points:[org, new BABYLON.Vector3(0,0,1)]})
  // z.color=new BABYLON.Color3(0.5,0.5,1)
  const x = BABYLON.MeshBuilder.CreateBox("",{width:1,height:0.05,depth:0.05})
  x.position=new BABYLON.Vector3(0.5,0.025,0)
  x.material = newMat(1,0,0,1)
  const y = BABYLON.MeshBuilder.CreateBox("",{width:0.05,height:1,depth:0.05})
  y.position=new BABYLON.Vector3(0,0.5,0)
  y.material = newMat(0,1,0,1)
  const z = BABYLON.MeshBuilder.CreateBox("",{width:0.05,height:0.05,depth:1})
  z.position=new BABYLON.Vector3(0,0.025,0.5)
  z.material = newMat(0,0,1,1)

  x.isPickable=false
  y.isPickable=false
  z.isPickable=false
}

function buildArrowMesh() {
  const m = new BABYLON.Mesh("")
  const v = new BABYLON.VertexData()
  // 0,0,0 is local origin? = default position/rotation/scale center (pivot point)
  v.positions = [
     0  , -0.15, 1, // front
    -0.5, -0.15, -1, // back left
     0.5, -0.15, -1, // back right
     0  ,  0.15, -0.75, // back top
  ]
  // from object center to facet points=clockwise
  v.indices = [
    0, 1, 3, // left
    0, 3, 2, // right
    0, 2, 1, // floor
    1, 2, 3, // back
  ]
  v.normals = []
  BABYLON.VertexData.ComputeNormals(v.positions, v.indices, v.normals)
  v.applyToMesh(m)
  return m
}

function initPolyDir() {
  if(!G_scene) return
  // Ray .origin .direction .length
  // type:0
  //const p = BABYLON.MeshBuilder.CreatePolyhedron("", {})
  const m=buildArrowMesh()
  m.position = new BABYLON.Vector3(0,1,0)
  var mat = new BABYLON.StandardMaterial("", G_scene)
	mat.wireframe = true
  //m.material = mat
  m.lookAt(new BABYLON.Vector3(0,1,1)) // target point, +corrective XYZ rotations
	
  //const p = BABYLON.MeshBuilder.CreateCylinder("", {size:0.5,diameterTop:0})
  //p.lookAt(target) // mesh drawn facing user
  //p.setDirection(new BABYLON.Vector3(dx,dy,dz))
  //p.rotation = BABYLON.Vector3.RotationFromAxis(axis1, axis2, axis3)
  //const d = new BABYLON.Vector3(1,1,0)
  //p.rotationQuaternion = BABYLON.Quaternion.RotationAxis(d, 0)
  //p.rotate(d, Math.PI, BABYLON.Space.WORLD)
  G_scene.registerBeforeRender(()=>{
    //m.rotation.x+=0.01
    //m.rotation.y+=0.01
    //m.rotation.z+=0.01
    // // d.x++
    // if(d.x>10) d.x=1
    // p.setDirection(d)
    // G_txts[0].text=Math.floor(p.rotation.x*100).toString()
    // G_txts[2].text=Math.floor(p.rotation.y*100).toString()
    // G_txts[4].text=Math.floor(p.rotation.z*100).toString()
    // G_txts[1].text=d.x.toString()
    // G_txts[3].text=d.y.toString()
    // G_txts[5].text=d.z.toString()
    //p.rotation.y += 0.02
  })
}

/**
 * 
 * @param {BABYLON.Scene} scene 
 * @param {boolean} isPickable 
 */
function initSpsCube(scene, isPickable) {
  var nb = 50000; // nb of triangles
  var fact = 20;   // cube size
  var model = BABYLON.MeshBuilder.CreatePolyhedron("", {size:0.05}, scene);
  var SPS = new BABYLON.SolidParticleSystem('SPS', scene, {isPickable: isPickable});
  SPS.addShape(model, nb)
  var mesh = SPS.buildMesh()
  mesh.position = new BABYLON.Vector3(0,fact/2,5)
  mesh.updateFacetData()
  model.dispose()
  SPS.initParticles = function () {
	  for (const p of SPS.particles) {
      p.position.x = (Math.random() - 0.5) * fact
      p.position.y = (Math.random() - 0.5) * fact
      p.position.z = (Math.random() - 0.5) * fact
      p.rotation.x = Math.random() * 3.15
      p.rotation.y = Math.random() * 3.15
      p.rotation.z = Math.random() * 1.5
      p.color = new BABYLON.Color4(p.position.x / fact + 0.5, p.position.y / fact + 0.5, p.position.z / fact + 0.5, 1.0);
	  }
  }
  SPS.initParticles()	  	// compute particle initial status
  SPS.setParticles()  		// updates the SPS mesh and draws it
  SPS.refreshVisibleSize() // updates the BBox for pickability
  // Optimizers after first setParticles() call
  // This will be used only for the next setParticles() calls
  SPS.computeParticleTexture = false
  
  const upd = function(/**@type {*}*/evt, /**@type {BABYLON.PickingInfo}*/ pickResult) {
    var faceId = pickResult.faceId
    if (faceId == -1) return
    var idx = SPS.pickedParticles[faceId].idx;
    var p = SPS.particles[idx];
    p.color = new BABYLON.Color4(1,1,1,1)
    // p.scale.x = 5;
    // p.scale.y = 5;
    // p.scale.z = 5;
    SPS.setParticles() // sudden slow
    // mesh.getFacetPositionToRef(faceId, ball.position);
  }

  // active a permanent hit test on all pickables of the scene
  if(isPickable) scene.onPointerDown = upd

  // SPS mesh animation
  scene.registerBeforeRender(()=>{
    //SPS.mesh.rotation.x += 0.002
    SPS.mesh.rotation.y += 0.002
    //SPS.mesh.rotation.z += 0.002
  })
}

/**
 * 
 * @param {string} char 
 * @param {function} fct 
 */
function touchAction(char, fct) {
  if(!G_scene) return
  if(!G_action_manager) {
    G_action_manager = new BABYLON.ActionManager(G_scene)
    G_scene.actionManager = G_action_manager
  }
  const opt = { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: char }
  // @ts-ignore
  const a = new BABYLON.ExecuteCodeAction( opt, fct )
  G_action_manager.registerAction(a)
}
/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function initActions(scene) {
  if(!G_action_manager) {
    G_action_manager = new BABYLON.ActionManager(scene)
    scene.actionManager = G_action_manager
  }
  touchAction('s', switchSky)
  touchAction('e', stop)
}
/**
 * 
 * @param {BABYLON.Scene} scene 
 */
function initModels(scene) {
  BABYLON.SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "shark.glb", scene, function (meshes) {
    meshes[0].position = new BABYLON.Vector3(0,0,20)
    meshes[0].rotation = new BABYLON.Vector3(0,0.75,0) // pitch yaw roll ; rotations around axis : X Y Z
    scene.animationGroups[0].start(true)
  })
  //BABYLON.SceneLoader.ImportMesh("him", "https://playground.babylonjs.com/scenes/Dude/", "Dude.babylon", scene, onLoadedModel)
}

/**
 * 
 * @param {number} r 
 * @param {number} g 
 * @param {number} b 
 * @param {number?} a 
 */
function newMat(r,g,b,a) {
  if(!G_scene) return null
  const mat=new BABYLON.StandardMaterial("", G_scene)
  mat.diffuseColor=new BABYLON.Color3(r,g,b)
  mat.alpha=a==null?1:a
  return mat
}

//-- the createScene/createSceneAsync func var is to be used for the playground
//-- need to be in async to trigger XR
function createScene() {
  if(!G_engine) return null
  if(!G_canvas) return null
  const scene = new BABYLON.Scene(G_engine)
  /** must assign here the glob scene as needed by callback */
  G_scene = scene
  initCamera(scene, G_canvas)
  const sLight=initLight(scene, false, false)

  // make meshes with emissive material to have a glow
  //G_glowLayer = new BABYLON.GlowLayer("glow", scene)

  //initParticles(scene, sLight, 1000)
  
  initAxis()

  G_plane = initGUIGrid(scene)
  //G_plane = initGUISmall(scene)

  //const ground = initEnv(scene, G_shadows) // ground and sky
  //scene.clearColor = new BABYLON.Color3(0.5, 0.7, 1) // blue
  //scene.clearColor = new BABYLON.Color3(0, 0, 0)
  initSky(scene)
  //const ground = initGround(scene, G_shadows, newMat(0,1,0,0.5))
  const ground = initGround(scene, G_shadows, null)
  //const ground = initGround(scene, G_shadows, groundMat(scene, 1))
  //const ground = null // no ground to look at skybox
  //initPlane()
  //initPolyDir()
  initBouncing(scene)
  //initParalax(scene)
  //initSpsCube(scene, false)
  // initBlocks(scene, G_shadows)
  // initBlocks_Clone(scene, G_shadows) // shared geometry
  // initBlocks_Inst(scene) // shared material
  // initBlocks_SPS(scene) // single mesh, no physics
  // initBlocks_Thin(scene) // single mesh, no physics
  
  //initModels(scene)

  initActions(scene)

  /**@type {BABYLON.WebXRDefaultExperienceOptions} */
  const options={}
  if(ground) options.floorMeshes=[ground]
  //options.disableDefaultUI=true // UI to enter XR
  //options.optionalFeatures=[] // remove all optional features
  scene.createDefaultXRExperienceAsync(options).then(initXr)

  // floorMeshes are used for teleport  ; G_xr.disableTeleportation
  //scene.onPointerObservable.add(onPointer, BABYLON.PointerEventTypes.POINTERDOWN)
  return scene
}

/**
 * 
 * @param {BABYLON.WebXRDefaultExperience} xr 
 */
function initXr(xr) {
  //console.log(BABYLON.WebXRFeaturesManager.GetAvailableFeatures()) on Emulator :
  // xr-controller-pointer-selection xr-controller-teleportation xr-hit-test xr-anchor-system xr-plane-detection
  // xr-background-remover xr-physics-controller xr-feature-points xr-hand-tracking xr-mesh-detection xr-image-tracking
  // BABYLON.WebXRFeatureName.POINTER_SELECTION
  G_xr=xr
  const fm=xr.baseExperience.featuresManager
  // disabling does not improve fps
  // fm.disableFeature(BABYLON.WebXRFeatureName.POINTER_SELECTION)
  // fm.disableFeature(BABYLON.WebXRFeatureName.HIT_TEST)
  //xr.pointerSelection.detach()
  /**@type {BABYLON.IWebXRControllerPointerSelectionOptions}*/
  const psOptions = {
    xrInput: xr.input,
    enablePointerSelectionOnAllControllers: true,
    //maxPointerDistance:100, // default 100
    forceGazeMode: false,
    //timeToSelect: 1500, // in gaz mode delay between pointing and down event
    //gazeCamera: xr.baseExperience.camera,
    disablePointerUpOnTouchOut:false, // by default, removing controllers is like a pointer up
    disableScenePointerVectorUpdate:false, // disabling needed only for AR
  }
  const psFeature = fm.enableFeature(BABYLON.WebXRFeatureName.POINTER_SELECTION, 'latest', psOptions)
  // can psFeature.detach() to temporary disable, then psFeature.attach() to use enable
  // wait for all stuff to be loaded before doing our own init
  G_xr.input.onControllerAddedObservable.add((xrInput, state)=>{
    xrInput.onMotionControllerInitObservable.add((ctrl,state2)=>{
      ctrl.onModelLoadedObservable.add((ctrl2,state3)=>{
        ensureCtrlInit(xrInput)
      })
    })
  })
}

/**
 * 
 * @param {BABYLON.InstancedMesh[]} meshes 
 * @param {*} particleSystems 
 * @param {*} skeletons 
 */
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
          if(!instance.parent || !(/**@type {BABYLON.AbstractMesh}*/(instance.parent)).subMeshes) {
              instance.position.x += offsetX
              instance.position.z -= offsetZ
          }
      }
  }
  //dude.rotation.y = Math.PI;
  //skeletons2[0].scale(0.5,0.5,0.5,true)
  dude.scaling = new BABYLON.Vector3(0.05, 0.05, 0.05)
  dude.position = new BABYLON.Vector3(0, 0, 10)
  if(G_scene) G_scene.beginAnimation(skeletons[0], 0, 100, true, 1.0)
}

/**
 * 
 * @param {BABYLON.PointerInfo} pointerInfo 
 */
function onPointer(pointerInfo) {
  if(!G_xr) return
  if(!pointerInfo) return
  if(!pointerInfo.pickInfo) return
  //console.log('POINTER DOWN', pointerInfo)
  if (! pointerInfo.pickInfo.hit) return
  if (! pointerInfo.pickInfo.pickedMesh) return
  // "Grab" it by attaching the picked mesh to the VR Controller
  if (G_xr.baseExperience.state !== BABYLON.WebXRState.IN_XR) return
  const xrInput = G_xr.pointerSelection.getXRControllerByPointerId(/**@type {PointerEvent}*/(pointerInfo.event).pointerId)
  if (!xrInput) return
  const motionController = xrInput.motionController
  if (!motionController) return
  pointerInfo.pickInfo.pickedMesh.setParent(motionController.rootMesh)
}