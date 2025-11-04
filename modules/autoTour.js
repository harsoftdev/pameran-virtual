import * as THREE from 'three';
import { hideMenu, showConstrols } from './menu.js';
import { displayPaintingInfo, hidePaintingInfo } from './paintingInfo.js';

let isGuidedTourActive = false;
let currentPaintingIndex = 0;
let paintings = [];
let camera = null;
let controls = null;

// Durasi untuk transisi kamera
const TRANSITION_DURATION = 2000;

// Function to sort paintings by wall position for optimal tour flow
const sortPaintingsByWallPosition = (paintingsArray) => {
    const sortedPaintings = [...paintingsArray];
    
    // Group paintings by wall based on rotation
    const leftWall = [];
    const frontWall = [];
    const rightWall = [];
    
    sortedPaintings.forEach(painting => {
        const rotation = painting.rotation.y;
        
        if (Math.abs(rotation - Math.PI/2) < 0.1) {
            // Left wall (rotation ~π/2)
            leftWall.push(painting);
        } else if (Math.abs(rotation) < 0.1) {
            // Front wall (rotation ~0)
            frontWall.push(painting);
        } else if (Math.abs(rotation + Math.PI/2) < 0.1) {
            // Right wall (rotation ~-π/2)
            rightWall.push(painting);
        }
    });
    
    // Sort each wall by position (left to right for front wall, top to bottom for side walls)
    leftWall.sort((a, b) => {
        const posA = new THREE.Vector3();
        const posB = new THREE.Vector3();
        a.getWorldPosition(posA);
        b.getWorldPosition(posB);
        return posA.z - posB.z; // Sort by z position for left wall
    });
    
    frontWall.sort((a, b) => {
        const posA = new THREE.Vector3();
        const posB = new THREE.Vector3();
        a.getWorldPosition(posA);
        b.getWorldPosition(posB);
        return posA.x - posB.x; // Sort by x position for front wall
    });
    
    rightWall.sort((a, b) => {
        const posA = new THREE.Vector3();
        const posB = new THREE.Vector3();
        a.getWorldPosition(posA);
        b.getWorldPosition(posB);
        return posB.z - posA.z; // Sort by z position for right wall (reverse order)
    });
    
    // Combine in order: left → front → right
    const orderedPaintings = [...leftWall, ...frontWall, ...rightWall];
    
    console.log('Paintings sorted by walls:');
    console.log('Left wall:', leftWall.length, 'paintings');
    console.log('Front wall:', frontWall.length, 'paintings');
    console.log('Right wall:', rightWall.length, 'paintings');
    
    return orderedPaintings;
};

export const initAutoTour = (paintingsArray, cameraRef, controlsRef) => {
    // Sort paintings by wall position: left → front → right
    paintings = sortPaintingsByWallPosition(paintingsArray);
    camera = cameraRef;
    controls = controlsRef;
    
    console.log('Auto tour initialized with sorted paintings:', paintings.length);
};

export const startGuidedTour = () => {
    if (isGuidedTourActive || paintings.length === 0) return;
    
    isGuidedTourActive = true;
    currentPaintingIndex = 0;
    
    controls.lock();
    hideMenu();
    showConstrols();
    hideMovementControls(); // Hide mouse hint and direction controls
    hideControlButtons(); // Hide control buttons di kanan atas
    showNavigationUI();
    navigateToCurrentPainting();
};

export const stopGuidedTour = () => {
    if (!isGuidedTourActive) return;
    
    isGuidedTourActive = false;
    hideNavigationUI();
    hidePaintingInfoLocal();
    showMovementControls(); // Show back mouse hint and direction controls
    showControlButtons(); // Show back control buttons di kanan atas
    currentPaintingIndex = 0;
};

export const nextPainting = () => {
    if (!isGuidedTourActive || currentPaintingIndex >= paintings.length - 1) return;
    
    currentPaintingIndex++;
    navigateToCurrentPainting();
    updateNavigationButtons();
};

export const previousPainting = () => {
    if (!isGuidedTourActive || currentPaintingIndex <= 0) return;
    
    currentPaintingIndex--;
    navigateToCurrentPainting();
    updateNavigationButtons();
};

const navigateToCurrentPainting = () => {
    if (currentPaintingIndex >= paintings.length) return;
    
    const painting = paintings[currentPaintingIndex];
    console.log('Navigating to painting:', currentPaintingIndex, painting);
    
    const optimalPosition = calculateOptimalViewingPosition(painting);
    
    animateCameraToPosition(optimalPosition, () => {
        console.log('Animation complete, showing painting info');
        setTimeout(() => {
            showPaintingInfo(painting);
            updateNavigationButtons();
        }, 100);
    });
};

const calculateOptimalViewingPosition = (painting) => {
    const paintingPos = new THREE.Vector3();
    painting.getWorldPosition(paintingPos);
    
    const paintingRotation = painting.rotation.y;
    
    // Adjust distance based on device type
    const isMobile = window.innerWidth <= 768;
    const distance = isMobile ? 8 : 6; // Jarak optimal untuk mobile dan desktop
    
    let cameraPos = new THREE.Vector3();
    
    // Debug: Log painting info
    console.log('Painting position:', paintingPos);
    console.log('Painting rotation:', paintingRotation);
    console.log('Is mobile:', isMobile, 'Distance:', distance);
    
    if (Math.abs(paintingRotation) < 0.1) {
        // Front wall (rotasi ~0)
        cameraPos.set(paintingPos.x, paintingPos.y, paintingPos.z + distance);
        console.log('Front wall detected');
    } else if (Math.abs(paintingRotation - Math.PI/2) < 0.1) {
        // Left wall (rotasi ~π/2)
        cameraPos.set(paintingPos.x + distance, paintingPos.y, paintingPos.z);
        console.log('Left wall detected');
    } else if (Math.abs(paintingRotation + Math.PI/2) < 0.1) {
        // Right wall (rotasi ~-π/2)
        cameraPos.set(paintingPos.x - distance, paintingPos.y, paintingPos.z);
        console.log('Right wall detected');
    }
    
    console.log('Camera position calculated:', cameraPos);
    
    return {
        position: cameraPos,
        target: paintingPos
    };
};

const animateCameraToPosition = (targetData, onComplete) => {
    const startPosition = camera.position.clone();
    const startTime = Date.now();
    
    const direction = new THREE.Vector3()
        .subVectors(targetData.target, targetData.position)
        .normalize();
    
    const animate = () => {
        if (!isGuidedTourActive) {
            if (onComplete) onComplete();
            return;
        }
        
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / TRANSITION_DURATION, 1);
        const easedProgress = progress * progress * (3 - 2 * progress);
        
        camera.position.lerpVectors(startPosition, targetData.position, easedProgress);
        
        const lookAtTarget = new THREE.Vector3().addVectors(camera.position, direction);
        camera.lookAt(lookAtTarget);
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (onComplete) onComplete();
        }
    };
    
    animate();
};

const showNavigationUI = () => {
    let navContainer = document.getElementById('guided-tour-nav');
    if (!navContainer) {
        navContainer = document.createElement('div');
        navContainer.id = 'guided-tour-nav';
        navContainer.innerHTML = `
            <div class="nav-container">
                <button id="prev-painting" class="nav-button">
                    <span>❮ Previous</span>
                </button>
                <div class="nav-info">
                    <span id="painting-counter">1 / ${paintings.length}</span>
                </div>
                <button id="next-painting" class="nav-button">
                    <span>Next ❯</span>
                </button>
            </div>
        `;
        document.body.appendChild(navContainer);
        
        document.getElementById('prev-painting').addEventListener('click', previousPainting);
        document.getElementById('next-painting').addEventListener('click', nextPainting);
    }
    
    navContainer.style.display = 'block';
    updateNavigationButtons();
};

const hideNavigationUI = () => {
    const navContainer = document.getElementById('guided-tour-nav');
    if (navContainer) {
        navContainer.style.display = 'none';
    }
};

const updateNavigationButtons = () => {
    const prevBtn = document.getElementById('prev-painting');
    const nextBtn = document.getElementById('next-painting');
    const counter = document.getElementById('painting-counter');
    
    if (prevBtn) prevBtn.disabled = currentPaintingIndex === 0;
    if (nextBtn) nextBtn.disabled = currentPaintingIndex === paintings.length - 1;
    if (counter) counter.textContent = `${currentPaintingIndex + 1} / ${paintings.length}`;
};

const showPaintingInfo = (painting) => {
    console.log('showPaintingInfo called for painting:', painting);
    const info = painting.userData.info;
    console.log('Painting info:', info);
    
    if (!info) {
        console.log('No info found for painting');
        return;
    }
    
    // Get painting-info element
    const infoElement = document.getElementById('painting-info');
    console.log('painting-info element before displayPaintingInfo:', infoElement);
    console.log('Element classes before:', infoElement ? infoElement.classList.toString() : 'element not found');
    
    if (infoElement) {
        // Remove locked class if it exists
        infoElement.classList.remove('locked');
        console.log('Removed locked class');
        
        // Force show the element immediately with proper responsive centering
        infoElement.style.display = 'block';
        infoElement.style.opacity = '1';
        
        // Check screen size for proper transform
        const screenWidth = window.innerWidth;
        if (screenWidth <= 1024) {
            // Mobile, tablet, and small laptop - center horizontally
            infoElement.style.transform = 'translateX(-50%) translateY(0)';
        } else {
            // Desktop - normal positioning
            infoElement.style.transform = 'translateY(0)';
        }
        
        console.log('Applied inline styles for immediate visibility, screen width:', screenWidth);
    }
    
    // Use the existing displayPaintingInfo function from paintingInfo.js
    displayPaintingInfo(info);
    console.log('Called displayPaintingInfo with info:', info);
    
    // Force add show class after displayPaintingInfo
    if (infoElement) {
        infoElement.classList.add('show');
        console.log('Manually added show class, final classes:', infoElement.classList.toString());
        
        // Double check the computed styles
        const computedStyle = window.getComputedStyle(infoElement);
        console.log('Final opacity:', computedStyle.opacity);
        console.log('Final transform:', computedStyle.transform);
        console.log('Final z-index:', computedStyle.zIndex);
    }
    
    // Final check after a short delay
    setTimeout(() => {
        const infoElementAfter = document.getElementById('painting-info');
        if (infoElementAfter) {
            const finalStyle = window.getComputedStyle(infoElementAfter);
            console.log('=== FINAL CHECK ===');
            console.log('Element classes:', infoElementAfter.classList.toString());
            console.log('Final opacity:', finalStyle.opacity);
            console.log('Final transform:', finalStyle.transform);
            console.log('Element should be visible now!');
        }
    }, 100);
};

const hidePaintingInfoLocal = () => {
    // Use the existing hidePaintingInfo function from paintingInfo.js
    hidePaintingInfo();
};

const hideMovementControls = () => {
    // Hide mouse hint and direction controls during guided tour
    const directionWrapper = document.getElementById('direction-wrapper');
    const mouseHint = document.getElementById('mouse-hint');
    const mouseHintText = document.getElementById('mouse-hint-text');
    
    if (directionWrapper) directionWrapper.style.display = 'none';
    if (mouseHint) mouseHint.style.display = 'none';
    if (mouseHintText) mouseHintText.style.display = 'none';
};

const showMovementControls = () => {
    // Show back mouse hint and direction controls after guided tour
    const directionWrapper = document.getElementById('direction-wrapper');
    const mouseHint = document.getElementById('mouse-hint');
    const mouseHintText = document.getElementById('mouse-hint-text');
    
    if (directionWrapper) directionWrapper.style.display = 'block';
    if (mouseHint) mouseHint.style.display = 'flex';
    if (mouseHintText) mouseHintText.style.display = 'block';
};

const hideControlButtons = () => {
    // Hide control buttons di kanan atas during guided tour
    const controlWrapper = document.getElementById('control-wrapper');
    if (controlWrapper) controlWrapper.style.display = 'none';
};

const showControlButtons = () => {
    // Show back control buttons di kanan atas after guided tour
    const controlWrapper = document.getElementById('control-wrapper');
    if (controlWrapper) controlWrapper.style.display = 'flex';
};

export const setupAutoTourButton = (controlsRef) => {
    controls = controlsRef;
    
    const autoTourButton = document.getElementById('auto_tour_button');
    if (autoTourButton) {
        autoTourButton.addEventListener('click', () => {
            if (!isGuidedTourActive) {
                startGuidedTour();
            }
        });
    }
};

export const isAutoTourRunning = () => isGuidedTourActive;

export const handleUserInteraction = () => {
    // Stop guided tour when user presses T key
    if (isGuidedTourActive) {
        stopGuidedTour();
    }
};
