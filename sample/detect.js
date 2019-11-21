import ColisionDetector from '../src/colisionDetector.js';

const items = [
  { position: [100, 100], width: 40, height: 40 },
  { position: [400, 600], width: 40, height: 40 },
  { position: [200, 800], width: 400, height: 40 },
  { position: [300, 0], width: 350, height:  350 },
  { position: [10, 300], width: 250, height: 80 }
];
const player = items[0];

const canvas = document.getElementById('field2');
const ctx = canvas.getContext('2d');
items.forEach( item => ctx.fillRect(item.position[0], item.position[1], item.width, item.height) );

const width = canvas.clientWidth;
const height = canvas.clientHeight;
const colisionDetector = new ColisionDetector(width, height, 2, items);

document.addEventListener('keydown', e => {
  ctx.clearRect(player.position[0], player.position[1], player.width, player.height);
  switch(e.keyCode) {
    case 37:
      player.position[0] -= 10;
      break;
    case 38:
      player.position[1] -= 10;
      break;
    case 39:
      player.position[0] += 10;
      break;
    case 40:
      player.position[1] += 10;
      break;
    default:
      return;
  }
  colisionDetector.updateTree(player);
  colisionDetector.detect(items);
  items.forEach( item => {
    if( item.colisionState.colisions.length > 0 ) {
      ctx.fillStyle = 'rgba(255,150,0,1)';
    } else {
      ctx.fillStyle = 'rgba(0,0,0,1)';
    }
    ctx.fillRect(item.position[0], item.position[1], item.width, item.height);
  });

  e.preventDefault();
});
