//------ GLOBALS ------

/* globals BABYLON */  // tell JSHint that BABYLON is a global defined elsewhere
/** needed by camera to attach controls */
let G_canvas = null
/** create scene renderLoop stop perf counter
 * @type {BABYLON.Engine}
*/
let G_engine = null
/** on Draw for GUI camera
 * @type {BABYLON.WebXRExperienceHelper}
 */
let G_xr = null
/** on Draw for GUI camera
 * @type {BABYLON.Plane}
*/
let G_plane = null
/** @type {BABYLON.Scene} */
let G_scene = null
/** @type {BABYLON.ActionManager} */
let G_action_manager=null
/** to set on blocks and model meshes */
let G_shadows = null
/** text updated on Draw*/
let G_txtFPS = null
let G_txts = null
/** boxes by sharing geometry */
let G_boxes=[]

let G_exception = null

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
function addSkyBoxFrom(scene, files) {
  const texture=BABYLON.CubeTexture.CreateFromImages(files, scene)
  addSkyBox(scene, texture)
}

function setSkyDome(url) {
  const texture=new BABYLON.EquiRectangularCubeTexture(url, G_scene, 1000)
  G_skybox.material.reflectionTexture = texture
}
function setSkyBox(files) {
  const texture=BABYLON.CubeTexture.CreateFromImages(files, G_scene)
  G_skybox.material.reflectionTexture = texture
}

function addSkyBox(scene, cubeTexture) {
    const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene)
    G_skybox=skybox
    skybox.material = new BABYLON.StandardMaterial("skyBox", scene)
    skybox.material.reflectionTexture = cubeTexture
    skybox.material.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
    skybox.material.backFaceCulling = false
    skybox.material.diffuseColor = new BABYLON.Color3(0, 0, 0)
    skybox.material.specularColor = new BABYLON.Color3(0, 0, 0)
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

//------ init Scene ------

function initSky(scene) {
  //const skytex = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/skybox", scene)
  addSkyBoxFrom(scene, G_skyFiles[G_nuSky])
  //addSkyDome(scene, "https://immersive-web.github.io/webxr-samples/media/textures/milky-way-4k.png")
  //addSkyDome(scene, "https://playground.babylonjs.com/textures/equirectangular.jpg")
  // const img = "https://playground.babylonjs.com/textures/sidexside.jpg"
  // const dome = new BABYLON.PhotoDome( "skyDome", img, { resolution: 32, size: 1000 }, scene)
  // dome.imageMode = BABYLON.PhotoDome.MODE_SIDEBYSIDE
}

function initGround(scene, shadows, groundMaterial) {
  if(!groundMaterial) {
    groundMaterial = new BABYLON.GridMaterial("groundMaterial", scene)
    groundMaterial.majorUnitFrequency = 1
    groundMaterial.minorUnitVisibility = 0.5
    groundMaterial.gridRatio = 2
    groundMaterial.backFaceCulling = false
    groundMaterial.mainColor = new BABYLON.Color3(0, 0.3, 0)
    groundMaterial.lineColor = new BABYLON.Color3(0, 0.5, 0)
    groundMaterial.opacity = 1 // of lines
    groundMaterial.alpha = 0.5

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
  function addText(txt,r,c) {
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

function initGUISmall(scene) {
  const plane = BABYLON.MeshBuilder.CreatePlane("plane", {size:0.05})
  plane.parent = scene.activeCamera // assign to camera so it will always follow it, must reassign when entering VR
  plane.position = new BABYLON.Vector3(-0.1, 0.1, 1.1)
  plane.isPickable=false
  const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane,1024,1024,false)
  advancedTexture.background = "#AAFFAA44"
  const panel = new BABYLON.GUI.StackPanel()
  advancedTexture.addControl(panel)
  function addText(txt,r,c) {
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

function initLight(scene, isShadow, showSphere) {
  // shodows require a directional light
  const pos = new BABYLON.Vector3(-10, 10, -10)
  if(isShadow) {
    const light = new BABYLON.DirectionalLight("", new BABYLON.Vector3(0, -0.5, 0.5))
    light.position = pos
    light.shadowOrthoScale = 2.0    
    scene.ambientColor = new BABYLON.Color3(0.5, 0.5, 0.5)
    // Shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadows=shadowGenerator.getShadowMap().renderList
  }
  else {
    //const light = new BABYLON.DirectionalLight("", new BABYLON.Vector3(0, -0.5, 0.5))
    // const light = new BABYLON.HemisphericLight("", pos)
    // light.intensity = 0.7
    scene.createDefaultLight()
  }

  if(!showSphere) return null
  const yellow = new BABYLON.StandardMaterial("")
	//yellow.diffuseColor = new BABYLON.Color3(1, 0.5, 0.5)
	yellow.emissiveColor = new BABYLON.Color3(1, 0.5, 0.5)
  const sLight = BABYLON.Mesh.CreateSphere("", 16, 1)
  sLight.position = pos
  sLight.material = yellow
  return sLight
}

function initCamera(scene, canvas) {
  //scene.createDefaultCamera(false, true, true)
  const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 1.75, -10), scene)
  camera.setTarget(BABYLON.Vector3.Zero())
  camera.attachControl(canvas, true)
}

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
function getRandomScale(min, max) {
  const scale = BABYLON.Scalar.RandomRange(min, max)
  return new BABYLON.Vector3(scale, scale, scale)
}

/** single mesh with multiple instances inside, color per instance, no collision/detection per instance */
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
    box.thinInstanceAdd(m)
  }
}

/** instances : same geo+mat */
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
function initBlocks_SPS(scene, isPickable) {
  const pos=getCubePosFrom(1.5,0,9,6)
  //const boxMat = new BABYLON.StandardMaterial("boxMat", scene)
	const c = new BABYLON.Color3(1, 0, 0)
  const sps = new BABYLON.SolidParticleSystem("sps", scene, {isPickable: isPickable})
  // sps.pickedParticles[faceId]
  const box = BABYLON.MeshBuilder.CreateBox("box", {})
  //box.position = new BABYLON.Vector3(0,9,6) // does not solve disappearance
  //box.material = boxMat // useless ?
  sps.addShape(box, pos.length) // add as many copies as you want to the SPS
  box.dispose() // dispose of the original mesh
  const spsMesh = sps.buildMesh() //builds the SPS mesh
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

function gotException(err) {
  if(err==null) return
  if(G_exception) return // error already trapped
  // err.toString()==err.message
  //G_exception=err.toString()+' - '+err.name+'\n'+err.stack
  G_exception=err.stack
  const dbg=document.getElementById('debug')
  if(dbg) dbg.innerText=G_exception
  if(G_txts && G_txts.length && G_txts.length>=3) G_txts[2].text='!!'
}

function initBouncing(scene) {
  const sel={left:null, right:null}
  const parent={left:null, right:null}
  const ctrl={ left:null, right:null }
  const boxMat = new BABYLON.StandardMaterial("")
	boxMat.diffuseColor = new BABYLON.Color3(1,1,1)
  const selMat = new BABYLON.StandardMaterial("")
	selMat.diffuseColor = new BABYLON.Color3(1,0,0)
  const leftMat = new BABYLON.StandardMaterial("")
	leftMat.diffuseColor = new BABYLON.Color3(0,0,1)
  //const box=BABYLON.MeshBuilder.CreateBox("",{size:0.2})
  const box=buildArrowMesh()
  box.material = boxMat
  /** @type {BABYLON.Mesh[]} */
  const boxes=[]
  for(let i=0; i<ROOM.nb; i++) {
    const b=i==0?box:box.clone("")
    boxes.push(b)
    b.metadata={nu:i, selected:'', grabbing:false, pushing:false, velocity:null}
    b.scaling = new BABYLON.Vector3(0.25,0.25,0.25)
    b.position = getRandomPosition(ROOM)
    b.rotation = getRandomRotation()
    const v = new BABYLON.Vector3(
      Math.random() * 0.005 - 0.005,
      Math.random() * 0.005 - 0.005,
      Math.random() * 0.005 - 0.005)
    b.metadata.velocity = v
    b.setDirection(v)
  }
  let freeze=false
  touchAction('f',()=>{freeze=true})
  // boxes animation
  scene.registerBeforeRender(()=>{
    if(freeze) return
    for(const b of boxes) {
      if(b.metadata.selected) {
        try {
          if(b.metadata.grabbing) {
            // has mesh is attached to parent, should just move it closer to 0,0,0 as origin in parent's space
            if(b.position.length()<=0.5) continue // close enough to origin
            const dst=b.position.clone()
            dst.normalize() // same direction with length=1
            dst.scaleInPlace(0.05)
            b.position.subtractInPlace(dst)
          }
          else if(b.metadata.pushing) {
            if(b.position.length()>10) continue // already too far
            const dst=b.position.clone()
            dst.normalize() // same direction with length=1
            dst.scaleInPlace(0.05)
            b.position.addInPlace(dst)

          }
          // const ct=ctrl[b.metadata.selected]
          // ct.srce.getWorldPointerRayToRef(ct.ray)
          // ct.ray.direction.scaleInPlace(0.1)
          // b.setParent(null) // detach from controller mesh
          // b.position.subtractInPlace(ct.ray.direction) // move closer
          // b.setParent(ct.ctrl.rootMesh)
        }
        catch(err) {
          gotException(err)
        }
        continue
      }
      const v = b.metadata.velocity
      const p = b.position
      p.addInPlace(v)
      let chg=false
           if(p.x < ROOM.min.x) { v.x =  Math.abs(v.x); chg=true }
      else if(p.x > ROOM.max.x) { v.x = -Math.abs(v.x); chg=true }
           if(p.z < ROOM.min.z) { v.z =  Math.abs(v.z); chg=true }
      else if(p.z > ROOM.max.z) { v.z = -Math.abs(v.z); chg=true }
           if(p.y < ROOM.min.y) { v.y =  Math.abs(v.y); chg=true }
      else if(p.y > ROOM.max.y) { v.y = -Math.abs(v.y); chg=true }
      if(chg) { // orient the mesh to new direction
        // b.lookAt(target)==b.setDirection(target.substract(b.position))
        // b.lookAt(b.position.add(v))
        b.setDirection(v)
        //b.setDirection(v.normalizeToNew())
      }
    }
  })
  const refLocalVect = new BABYLON.Vector3(0,0,1)
  const ensureCtrlInit=(/** @type {BABYLON.WebXRInputSource} */ xrInput)=>{
    // initialise this controller, for up event, should do that elsewhere ?
    const motionController=xrInput.motionController
    const side=motionController.handedness
    if(ctrl[side]) return // already init, nothing to do
    const obj ={
      srce:xrInput,
      ctrl:motionController,
      ray:BABYLON.Ray.Zero(),
      //-- isButton : .value 0-1 .pressed=1 .touched>0
      trigger:motionController.components['xr-standard-trigger'],
      squeeze:motionController.components['xr-standard-squeeze'],
      butA   :motionController.components['a-button'],
      butB   :motionController.components['b-button'],
      // isAxes .x .y
      stick  :motionController.components['xr-standard-thumbstick'], 
    }
    ctrl[side]=obj

    const mCyl = BABYLON.MeshBuilder.CreateCylinder("", {height:0.5, diameter:0.01})
    mCyl.material = side=="left"?newMat(0,0,1):newMat(1,0,0)
    obj.srce.getWorldPointerRayToRef(obj.ray)
    mCyl.setDirection(obj.ray.direction)
    mCyl.setParent(motionController.rootMesh)
    mCyl.position=BABYLON.Vector3.Zero() // relative to parent

    //mCyl.rotation=BABYLON.Vector3.Zero() // relative to parent, but aligned to squeeze button ?
    //mCyl.position=motionController.rootMesh.position.clone()
    //mCyl.rotation=motionController.rootMesh.rotation.clone()
    //mCyl.setDirection(motionController.rootMesh.getDirection(BABYLON.Vector3.Zero))
    
    //console.log(ctrl[side])
    obj.trigger.onButtonStateChangedObservable.add((component) => {
      if(component.value==0) { // released
        /** @type {BABYLON.Mesh} */
        const m=sel[side]
        if(!m) return
        m.material=boxMat
        m.setParent(parent[side]) // release from controller, og parent should be null
        m.getDirectionToRef(refLocalVect, m.metadata.velocity) // direction vector from current rotation
        m.metadata.velocity.scaleInPlace(0.02)
        m.metadata.selected=null
        sel[side]=null
        G_txts[side=='left'?2:3].text='nP'
        G_txts[side=='left'?4:5].text='-'
      }
    })
    obj.butA.onButtonStateChangedObservable.add((component)=>{
      const m=sel[side]
      if(!m) return
      m.metadata.pushing=(component.value==1)
    })
    obj.squeeze.onButtonStateChangedObservable.add((component) => {
      const m=sel[side]
      if(!m) return
      //motionController.pulse(0.5,500)
      m.metadata.grabbing=(component.value==1)
    })
  }
  const on_point=(/** @type {BABYLON.PointerInfo} */ pointerInfo)=>{
    if (G_xr.baseExperience.state !== BABYLON.WebXRState.IN_XR) return
    /** @type {BABYLON.WebXRInputSource} */
    const xrInput = G_xr.pointerSelection.getXRControllerByPointerId(pointerInfo.event.pointerId)
    if (!xrInput) return
    
    const motionController = xrInput.motionController
    if (!motionController) return
    ensureCtrlInit(xrInput)
    if (! pointerInfo.pickInfo.hit) return
    if (! pointerInfo.pickInfo.pickedMesh) return
    const m=pointerInfo.pickInfo.pickedMesh
    if(!m.metadata || !m.metadata.velocity) return // not a box
    // motionController.profileId oculus-touch
    const side=motionController.handedness
    sel[side]=m

    //const ray = pointerInfo.pickInfo.ray
    //ray.direction
    // ray.direction.scaleInPlace(0.2)
    // b.position.copyFrom(ray.origin)
    // b.position.addInPlace(ray.direction)

    m.metadata.selected=side
    //console.log(m.parent)
    parent[side]=m.parent // should be null
    m.material=side=="left" ? leftMat : selMat
    m.setParent(motionController.rootMesh) //-- grap to controller
    G_txts[side=='left'?2:3].text='PR'
    G_txts[side=='left'?4:5].text=m.metadata.nu.toString()
  }
  scene.onPointerObservable.add(on_point, BABYLON.PointerEventTypes.POINTERDOWN)
  //scene.onPointerObservable.add(on_up, BABYLON.PointerEventTypes.POINTERUP)
}

/** share same geo, or just a copy ? */
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

function groundMat(scene, nuText) {
  const t=niceTextures(scene)[nuText]
  const material = new BABYLON.StandardMaterial("niceMat"+nuText, scene)
  material.diffuseTexture = t.diff
  material.diffuseTexture.uScale=100
  material.diffuseTexture.vScale=100
  material.bumpTexture = t.normHeight
  material.bumpTexture.uScale=100
  material.bumpTexture.vScale=100
  material.useParallax = true
  material.useParallaxOcclusion = true
  material.parallaxScaleBias = 0.1
  material.specularPower = 1000.0
  material.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5)
  return material
}

function initPlane() {
  const mat = new BABYLON.StandardMaterial("")
  mat.diffuseTexture = new BABYLON.Texture("http://i.imgur.com/Rkh1uFK.png")
  mat.bumpTexture = new BABYLON.Texture("http://i.imgur.com/GtIUsWW.png")
  //const abstractPlane = BABYLON.Plane.FromPositionAndNormal(new BABYLON.Vector3(0, 20, 10), new BABYLON.Vector3(1, 0, -1))
	const options = {
		//sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    //pattern: BABYLON.Mesh.NO_FLIP, // defaut
    //sourcePlane: abstractPlane, // only for CreatePlane() ?
		//width: 2, height: 2, // default=1 ; size=width=height
		//tileWidth: 1, tileHeight: 1 // default=1 ; tileSize=tileWidth=tileHeight
	}
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
    for(const o of options) {
      const material = new BABYLON.StandardMaterial("mt"+y+"-"+x, scene)
      material.diffuseTexture = t.diff
      material.diffuseTexture.uScale = 5
      material.diffuseTexture.vScale = 5
      if(o.bump) {
        material.bumpTexture = t.normHeight
        material.bumpTexture.uScale = 5
        material.bumpTexture.vScale = 5
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
  x.material = newMat(1,0,0)
  const y = BABYLON.MeshBuilder.CreateBox("",{width:0.05,height:1,depth:0.05})
  y.position=new BABYLON.Vector3(0,0.5,0)
  y.material = newMat(0,1,0)
  const z = BABYLON.MeshBuilder.CreateBox("",{width:0.05,height:0.05,depth:1})
  z.position=new BABYLON.Vector3(0,0.025,0.5)
  z.material = newMat(0,0,1)

  x.isPickable=false
  y.isPickable=false
  z.isPickable=false
}

function buildArrowMesh() {
  var m = new BABYLON.Mesh("")
  var v = new BABYLON.VertexData()
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
  // Ray .origin .direction .length
  // type:0
  //const p = BABYLON.MeshBuilder.CreatePolyhedron("", {})
  const m=buildArrowMesh()
  m.position = new BABYLON.Vector3(0,1,0)
  var mat = new BABYLON.StandardMaterial("")
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
  
  
  const upd = function(evt, pickResult) {
    var faceId = pickResult.faceId
    if (faceId == -1) return
    var idx = SPS.pickedParticles[faceId].idx;
    var p = SPS.particles[idx];
    p.color.r = 1;
    p.color.b = 1;
    p.color.g = 1;
    // p.scale.x = 5;
    // p.scale.y = 5;
    // p.scale.z = 5;
    SPS.setParticles(); // sudden slow
    // mesh.getFacetPositionToRef(faceId, ball.position);
  }
  if(isPickable) scene.onPointerDown = upd

  // SPS mesh animation
  scene.registerBeforeRender(()=>{
    //SPS.mesh.rotation.x += 0.002
    SPS.mesh.rotation.y += 0.002
    //SPS.mesh.rotation.z += 0.002
  })
}
function touchAction(char, fct) {
  if(!G_action_manager) {
    G_action_manager = new BABYLON.ActionManager(G_scene)
    G_scene.actionManager = G_action_manager
  }
  const opt = { trigger: BABYLON.ActionManager.OnKeyDownTrigger, parameter: char }
  const a = new BABYLON.ExecuteCodeAction( opt, fct )
  G_action_manager.registerAction(a)
}
function initActions(scene) {
  if(!G_action_manager) {
    G_action_manager = new BABYLON.ActionManager(scene)
    scene.actionManager = G_action_manager
  }
  touchAction('s', switchSky)
  touchAction('e', stop)
}

function initModels(scene) {
  BABYLON.SceneLoader.ImportMesh("", "https://models.babylonjs.com/", "shark.glb", scene, function (meshes) {
    meshes[0].position = new BABYLON.Vector3(0,0,20)
    meshes[0].rotation = new BABYLON.Vector3(0,0.75,0) // pitch yaw roll ; rotations around axis : X Y Z
    scene.animationGroups[0].start(true)
  })
  //BABYLON.SceneLoader.ImportMesh("him", "https://playground.babylonjs.com/scenes/Dude/", "Dude.babylon", scene, onLoadedModel)
}

function newMat(r,g,b,a) {
  const mat=new BABYLON.StandardMaterial("")
  mat.diffuseColor=new BABYLON.Color3(r,g,b)
  mat.alpha=a==null?1:a
  return mat
}


//-- the createScene/createSceneAsync func var is to be used for the playground
//-- need to be in async to trigger XR
async function createSceneAsync() {
  const scene = new BABYLON.Scene(G_engine)
  /** must assign here the glob scene as needed by callback */
  G_scene = scene
  initCamera(scene, G_canvas)
  const sLight=initLight(scene, false, false)
  //initParticles(scene, sLight, 1000)
  
  initAxis()

  G_plane = initGUIGrid(scene)
  //G_plane = initGUISmall(scene)

  //const ground = initEnv(scene, G_shadows) // ground and sky
  //scene.clearColor = new BABYLON.Color3(0.5, 0.7, 1) // blue
  //scene.clearColor = new BABYLON.Color3(0, 0, 0)
  initSky(scene)
  //const ground = initGround(scene, G_shadows, newMat(0,1,0,0.5))
  const ground = initGround(scene, G_shadows)
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

  const options={}
  if(ground) options.floorMeshes=[ground]
  G_xr = await scene.createDefaultXRExperienceAsync(options)

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