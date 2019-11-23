# Colision-Detector
[![CircleCI](https://circleci.com/gh/piyoppi/colision-detector.svg?style=svg)](https://circleci.com/gh/piyoppi/colision-detector)

The colision detection library for game development.

## Sample
See below a website.
- https://garakuta-toolbox.com/colision-detector/sample/

## Usage

### Detecting items in specific area
```javascript
// items in the field.
const items = [
  { position: [100, 100], width: 40, height: 40 },
  { position: [400, 600], width: 40, height: 40 },
  { position: [200, 800], width: 400, height: 40 },
  { position: [300, 0], width: 350, height:  350 },
  { position: [10, 300], width: 250, height: 80 }
];

//initialize
const level = 2;  // level is the depth of quadtree. (1 or 2 or 3)
const colisionDetector = new ColisionDetector(width, height, level, items);

// detect at a specific rectangle.
const clickedItems = colisionDetector.detectAt({position: [110, 110], width: 2, height: 2});

// display the result of detecting.
console.log(clickedItems);
```

The result of `console.log` is shown below. `detectAt(rectangle)` returns an array including colided items.

```javascript
[
  {
    colisionState: {
      colisionId: 0,
      colisions: [],
      treeIndex: 5
    },
    width: 40,
    height: 40,
    position: [100, 100]
  }
]
```

### Detecting each items
```javascript
// items in the field.
const items = [
  { position: [130, 120], width: 40, height: 40 },
  { position: [100, 100], width: 40, height: 40 },
  { position: [400, 600], width: 40, height: 40 },
  { position: [200, 800], width: 400, height: 40 },
  { position: [300, 0], width: 350, height:  350 },
  { position: [10, 300], width: 250, height: 80 }
];

//initialize
const level = 2;  // level is the depth of quadtree. (1 or 2 or 3)
const colisionDetector = new ColisionDetector(width, height, level, items);

// detect some colisions
colisionDetector.detect(items);

// display the result of detecting.
console.log(items[0]);
```

The result of `console.log` is shown below. The `detect()' method set the result of detecting colision on each items.

```javascript
{
  width: 40,
  height: 40,
  position: [130, 120],
  colisionState: {                      // The state of detecting colision
    colisionId: 0,                      // Colision id (colision-detector use this value)
    treeIndex: 5,
    colisions: [                        // Colided details
      {
        distX: -10,                     // The overwrapped area (about x axis)
        distY: -20,                     // The overwrapped area (about y axis)
        absDistX: 10,                   // The amount of overwrapped area (about x axis)
        absDistY: 20,                   // The amount of overwrapped area (about y axis)
        colisionFaceVec: [-1, 0],       // Normarized vector about colided face
        pair: {                         // Colided item
          width: 40,
          height: 40,
          position: [100, 100],
          colisionState: {
            colisions: Array(1),
            treeIndex: 5,
            colisionId: 1
          }
        }
      }
    ]
  }
}

```
