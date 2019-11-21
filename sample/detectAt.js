import ColisionDetector from '../src/colisionDetector.js';

const items = [
  { position: [100, 100], width: 40, height: 40 },
  { position: [400, 600], width: 40, height: 40 },
  { position: [200, 800], width: 400, height: 40 },
  { position: [300, 0], width: 350, height:  350 },
  { position: [10, 300], width: 250, height: 80 }
];

const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d');
items.forEach( item => ctx.fillRect(item.position[0], item.position[1], item.width, item.height) );

const width = canvas.clientWidth;
const height = canvas.clientHeight;
const colisionDetector = new ColisionDetector(width, height, 2, items);

canvas.addEventListener('click', e => {
  const clientRect = canvas.getBoundingClientRect();
  let position = [
    e.pageX - clientRect.left - window.pageXOffset,
    e.pageY - clientRect.top - window.pageYOffset
  ];

  const clickedItems = colisionDetector.detectAt({position, width: 2, height: 2});
  ctx.fillStyle = 'rgba(255,150,0,1)';
  clickedItems.forEach( item => ctx.fillRect(item.position[0], item.position[1], item.width, item.height) );
});

