import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/Addons.js';
import { displayPaintingInfo, hidePaintingInfo } from './modules/paintingInfo';

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize( window.innerWidth, window.innerHeight );
// renderer.setAnimationLoop( animate );
// document.body.appendChild( renderer.domElement );

// const geometry = new THREE.BoxGeometry( 1, 1, 1 );
// const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
// const cube = new THREE.Mesh( geometry, material );
// scene.add( cube );

// camera.position.z = 5;

// function animate() {

// 	cube.rotation.x += 0.01;
// 	cube.rotation.y += 0.01;

// 	renderer.render( scene, camera );

// }

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
// scene.add(camera);
// camera.position.z = 5;
camera.position.set(0, 3, 5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor("white", 1);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0x101010, 1.0);
// ambientLight.position = camera.position;
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xddddd, 1.0);
sunLight.position.y = 15;
scene.add(sunLight);

// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const material = new THREE.MeshBasicMaterial({ color: 0xff000 });
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);

// create the walls
const wallGroup = new THREE.Group();
scene.add(wallGroup);

const wallTexture = new THREE.TextureLoader().load('img/wall.jpg');
wallTexture.wrapS = THREE.RepeatWrapping;
wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(1, 1);

const wallMaterial = new THREE.MeshBasicMaterial({ map: wallTexture });

// front wall
const frontWall = new THREE.Mesh(
    new THREE.BoxGeometry(50, 20, 0.001),
    // new THREE.MeshBasicMaterial({ color: 'blue'})
    new THREE.MeshBasicMaterial({ map: wallTexture})
);
frontWall.position.z = -20;

// left wall
const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(50, 20, 0.001),
    // new THREE.MeshBasicMaterial({ color: 'red' })
    new THREE.MeshBasicMaterial({ map: wallTexture })
);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.x = -20;

// right wall
const rightWall = new THREE.Mesh(
    new THREE.BoxGeometry(50, 20, 0.001),
    // new THREE.MeshBasicMaterial({ color: 'yellow' })
    new THREE.MeshBasicMaterial({ map: wallTexture })
);
rightWall.rotation.y = Math.PI / 2;
rightWall.position.x = 20;

// back wall
const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(50, 20, 0.001),
    new THREE.MeshBasicMaterial({ map: wallTexture })
);
backWall.position.z = 20;

wallGroup.add(frontWall, leftWall, rightWall, backWall);

// loop through each wall and create the bounding box
for (let index = 0; index < wallGroup.children.length; index++) {
    let child = wallGroup.children[index];
    child.BoundingBox = new THREE.Box3().setFromObject(child);
}

// check if the player intersects with the wall
function checkCollision() {
    const playerBoundingBox = new THREE.Box3();
    const cameraWorldPosition = new THREE.Vector3();

    camera.getWorldPosition(cameraWorldPosition);
    playerBoundingBox.setFromCenterAndSize(cameraWorldPosition, new THREE.Vector3(1, 1, 1));

    // loop through each wall
    for (let index = 0; index < wallGroup.children.length; index++) {
        const wall = wallGroup.children[index];
        if (playerBoundingBox.intersectsBox(wall.BoundingBox)) {
            return true;
        }
    }

    return false;
}

// create the ceiling
const ceilingGeometry = new THREE.PlaneGeometry(50, 50);
const ceilingMaterial = new THREE.MeshBasicMaterial({ color: "grey" });
const ceilingPlane = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
ceilingPlane.rotation.x = Math.PI / 2;
ceilingPlane.position.y = 10;
scene.add(ceilingPlane);

// create the floor
const textureLoader = new THREE.TextureLoader().load('img/floor.jpg');
textureLoader.wrapS = THREE.RepeatWrapping;
textureLoader.wrapT = THREE.RepeatWrapping;
textureLoader.repeat.set(20, 20);

const planeGeometry = new THREE.PlaneGeometry(50, 50);
const planeMaterial = new THREE.MeshBasicMaterial({ map: textureLoader, side: THREE.DoubleSide });
const floorPlane = new THREE.Mesh(planeGeometry, planeMaterial);
floorPlane.rotation.x = Math.PI / 2;
floorPlane.position.y = -Math.PI;
scene.add(floorPlane);

function createPainting(imageURL, width, height, position, title) {
    const textureLoader = new THREE.TextureLoader();
    const paintingTexture = textureLoader.load(imageURL);
    const paintingMaterial = new THREE.MeshBasicMaterial({
        map: paintingTexture
    });
    const paintingGeometry = new THREE.PlaneGeometry(width, height);
    const painting = new THREE.Mesh(paintingGeometry, paintingMaterial);
    painting.position.set(position.x, position.y, position.z);

    painting.userData.title = title;

    return painting;
}

// image on walls
const painting1 = createPainting('cover/cover-1.png', 10, 7.5, new THREE.Vector3(-10, 5, -19.99), 'Arsip 1');
// const painting1 = createPainting('cover/cover-1.png', 10, 5, new THREE.Vector3(-10, 5, -19.99), 'pdf/pdf-1.pdf');
const painting2 = createPainting('cover/cover-2.png', 10, 7.5, new THREE.Vector3(10, 5, -19.99), 'Arsip 2');
// const painting2 = createPainting('cover/cover-2.png', 10, 5, new THREE.Vector3(10, 5, -19.99), 'pdf/pdf-2.pdf');
const painting3 = createPainting('cover/cover-1.png', 10, 7.5, new THREE.Vector3(-19.99, 5, -10), 'Arsip 3');
const painting4 = createPainting('cover/cover-1.png', 10, 7.5, new THREE.Vector3(19.99, 5, -10), 'Arsip 4');
const painting5 = createPainting('cover/cover-2.png', 10, 7.5, new THREE.Vector3(-19.5, 5, 10), 'Arsip 5');
const painting6 = createPainting('cover/cover-2.png', 10, 7.5, new THREE.Vector3(19.5, 5, 10), 'Arsip 6');
const painting7 = createPainting('cover/cover-1.png', 10, 7.5, new THREE.Vector3(-10, 5, 19.5), 'Arsip 7');
const painting8 = createPainting('cover/cover-2.png', 10, 7.5, new THREE.Vector3(10, 5, 19.5), 'Arsip 8');
painting3.rotation.y = Math.PI / 2;
painting4.rotation.y = -Math.PI / 2;
painting5.rotation.y = Math.PI / 2;
painting6.rotation.y = -Math.PI / 2;
painting7.rotation.y = Math.PI;
painting8.rotation.y = Math.PI;
scene.add(painting1, painting2, painting3, painting4, painting5, painting6, painting7, painting8);

// controls
const controls = new PointerLockControls(camera, document.body);
// lock the pointer (controls are activated) and hide menu when the experience starts
function startExperience() {
    controls.lock();
    hideMenu();
}

// hide menu
function hideMenu() {
    const menu = document.getElementById('menu');
    menu.style.display = 'none';
}

// show menu
function showMenu() {
    const menu = document.getElementById('menu');
    menu.style.display ='block';
}

const playButton = document.getElementById('play_button');
playButton.addEventListener('click', startExperience);

const keyPressed = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    w: false,
    a: false,
    s: false,
    d: false
}

document.addEventListener('keydown', (event) => {
    if (event.key in keyPressed) {
        keyPressed[event.key] = true;
    }
}, false);

document.addEventListener('keyup', (event) => {
    if (event.key in keyPressed) {
        keyPressed[event.key] = false;
    }
}, false);

function updateMovement(delta) {
    const moveSpeed = 5 * delta;
    const previousPosition = camera.position.clone();

    if (keyPressed.ArrowRight || keyPressed.d) {
        controls.moveRight(moveSpeed);
    } else if (keyPressed.ArrowLeft || keyPressed.a) {
        controls.moveRight(-moveSpeed);
    } else if (keyPressed.ArrowUp || keyPressed.w) {
        controls.moveForward(moveSpeed);
    } else if (keyPressed.ArrowDown || keyPressed.s) {
        controls.moveForward(-moveSpeed);
    }

    if (checkCollision()) {
        camera.position.copy(previousPosition);
    }
}

// document.addEventListener('keydown', onKeyDown, false);
function onKeyDown(event) {
    const keyCode = event.which;

    if (keyCode === 39 || keyCode === 68) {
        // camera.translateX(-0.05);
        controls.moveRight(0.08);
    } else if (keyCode === 37 || keyCode === 65) {
        // camera.translateX(0.05);
        controls.moveRight(-0.08);
    } else if (keyCode === 38 || keyCode === 87) {
        // camera.translateY(-0.05);
        controls.moveForward(0.08);
    } else if (keyCode === 40 || keyCode === 83) {
        // camera.translateY(0.05);
        controls.moveForward(-0.08);
    }
}

const clock = new THREE.Clock();
const render = function () {
    // mesh.rotation.x += 0.01;
    // mesh.rotation.y += 0.01;
    const delta = clock.getDelta();
    updateMovement(delta);

    const distanceThreshold = 8;

    let paintingToShow;
    const paintings = [painting1, painting2, painting3, painting4, painting5, painting6, painting7, painting8];

    paintings.forEach((painting) => {
        const distanceToPainting = camera.position.distanceTo(painting.position);
        if (distanceToPainting < distanceThreshold) {
            paintingToShow = painting;
        }
    });

    if (paintingToShow) {
      // if there is a painting to show
      displayPaintingInfo(paintingToShow.userData.title);
    } else {
      hidePaintingInfo();
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
}

render();
