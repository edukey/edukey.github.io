//------ GLOBALS ------

/* globals BABYLON */  // tell JSHint that BABYLON is a global defined elsewhere
let engine = null
let scene = null

//------ MAIN ------

// no main code as this is a module that may never be used

//------ FUNCTIONS ------

export function start() {
  var canvas = document.getElementById("renderCanvas")
  engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true,  disableWebGL2Support: false})
  createSceneAsync().then((returnedScene) => { 
      scene = returnedScene
      engine.runRenderLoop(() => { scene.render() })
  })
  window.addEventListener("resize", function () { engine.resize() })  
}

export function stop() {
  if(!engine) return // nothing to do
  engine.stopRenderLoop()
  scene.dispose()
  engine.dispose()
  engine = null
  scene = null
}

async function createSceneAsync() {
    var scene = new BABYLON.Scene(engine)
  
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3.Zero(), scene)
    // var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene)
    // camera.setTarget(BABYLON.Vector3.Zero())
    // camera.attachControl(canvas, true)
  
    BABYLON.SceneLoader.Append("https://www.babylonjs.com/Scenes/Mansion/",
        "Mansion.babylon", scene, async function  () {
            var xr = await scene.createDefaultXRExperienceAsync({floorMeshes: [scene.getMeshByName("Allée")]})
        }
    )
    // var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 0.7;
    // var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
    // sphere.position.y = 1;
    // sphere.position.z = -2;
    // const environment = scene.createDefaultEnvironment();
    // const xrHelper = await scene.createDefaultXRExperienceAsync({ floorMeshes: [environment.ground] });
    return scene
}
