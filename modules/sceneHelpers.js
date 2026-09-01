// This function will take a scene and an array of objects, and add each object to the scene. We can use this function to add the archives  to the scene. It will be called in main.js after we create the archives
export const addObjectsToScene = (scene, objects) => {
  objects.forEach((object) => {
    scene.add(object);
  });
};
