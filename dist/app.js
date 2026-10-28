// PÁGINA Y ANIMACIÓN: las reglas de sincronización están en algoritmo.js.
import { Simulacion } from './simulacion.js';
const $ = id => document.getElementById(id);
let simulation = new Simulacion();
let paused = false;
let ticking = false;
let generation = 0;
let demoTimer;
const nodes = new Map();
const iconReader = '<svg viewBox="0 0 28 28"><circle cx="14" cy="7" r="3"/><path d="M6 23v-8c3-2 5-1 8 1 3-2 5-3 8-1v8c-3-1-5 0-8 2-3-2-5-3-8-2zM14 16v9"/></svg>';
const iconWriter = '<svg viewBox="0 0 28 28"><circle cx="12" cy="7" r="3"/><path d="M5 23v-6a7 7 0 0 1 10-6M15 22l2-5 7-7 3 3-7 7-5 2zM22 12l3 3"/></svg>';

function render() {
  const s = simulation;
  const active = s.activos;
  const writer = active.find(p => p.tipo === 'E');
  const finished = s.procesos.filter(p => p.estado === 'terminado');
  $('valor').textContent = s.valor;
  $('modo').textContent = writer ? 'Escribiendo' : active.length ? 'Leyendo' : 'Libre';
  $('area').className = 'shared-area' + (writer ? ' writing' : active.length ? ' reading' : '');
  $('titulo-activos').textContent = writer ? 'ESCRIBE SOLO' : active.length ? 'LEEN JUNTOS' : 'RECURSO DISPONIBLE';
  $('cantidad-activos').textContent = writer ? writer.id : active.length ? `${active.length} ${active.length === 1 ? 'lector' : 'lectores'}` : 'Agregá un proceso';
  $('esperan').textContent = `${s.cola.length} ${s.cola.length === 1 ? 'proceso' : 'procesos'}`;
  $('terminaron').textContent = `${finished.length} ${finished.length === 1 ? 'proceso' : 'procesos'}`;
  $('contador').textContent = s.lectores;
  for (const name of ['mutex','recurso']) {
    const free = s[name].valor === 1;
    $('signal-'+name).className = 'signal' + (free ? '' : ' busy');
    $('estado-'+name).textContent = free ? 'Libre' : 'Ocupado';
    $('permiso-'+name).textContent = s[name].valor;
  }
  $('vacio').hidden = s.procesos.length > 0;
  $('lector').disabled = $('escritor').disabled = s.procesos.filter(p => p.estado !== 'terminado').length >= 10;
  $('live').textContent = paused ? 'EN PAUSA' : 'EN VIVO';
  $('pausa').textContent = paused ? '▶ Seguir' : 'Ⅱ Pausar';
  $('pausa').setAttribute('aria-label', paused ? 'Continuar animación' : 'Pausar animación');
  document.body.classList.toggle('paused', paused);
  let message = 'Probá el ejemplo y seguí el movimiento.';
  if (writer) message = `${writer.id} escribe solo. Los demás esperan.`;
  else if (active.length && s.cola.some(p => p.tipo === 'E')) message = 'El escritor espera a que salga el último lector.';
  else if (active.length) message = active.length > 1 ? 'Pueden leer al mismo tiempo.' : 'El lector está consultando el dato.';
  else if (finished.length) message = '¡Listo! El recurso vuelve a estar libre.';
  if (paused) message = 'Animación pausada. Tocá Seguir para continuar.';
  $('mensaje').textContent = message;
  layout();
}

function layout() {
  const width = $('escena').clientWidth;
  const height = $('escena').clientHeight;
  const small = width < 650;
  const size = small ? 35 : 48;
  const active = simulation.activos;
  const waiting = simulation.cola;
  const done = simulation.procesos.filter(p => p.estado === 'terminado').slice(-6);
  for (const p of simulation.procesos) {
    if (p.estado === 'terminado' && !done.includes(p)) {
      nodes.get(p.id)?.remove(); nodes.delete(p.id); continue;
    }
    let node = nodes.get(p.id);
    if (!node) {
      node = document.createElement('div');
      node.className = `person ${p.tipo} waiting`;
      node.innerHTML = `<div class="avatar">${p.tipo === 'L' ? iconReader : iconWriter}<span class="progress"><i></i></span></div><span class="person-label">${p.id}</span>`;
      node.style.transform = `translate(${width*.10}px,120px)`;
      $('personas').appendChild(node);
      nodes.set(p.id,node);
      node.getBoundingClientRect(); // Posición inicial antes de animar el movimiento.
    }
    let x,y;
    if (p.estado === 'activo') {
      const i = active.indexOf(p);
      const angle = active.length === 1 ? -Math.PI/2 : -Math.PI/2 + i*Math.PI*2/active.length;
      x = width*.5 + Math.cos(angle)*Math.min(130,width*.17);
      y = height*(small?.51:.54) + Math.sin(angle)*(small?105:123);
      node.className = `person ${p.tipo} active`;
      node.querySelector('.progress i').style.width = `${p.restante/3*100}%`;
    } else if (p.estado === 'terminado') {
      const i = done.indexOf(p);
      x = width*(.82+(i%2)*.10); y = 130+Math.floor(i/2)*74;
      node.className = `person ${p.tipo} done`;
    } else {
      const i = Math.max(0, waiting.indexOf(p));
      x = width*(.065+(i%3)*.075); y=135+Math.floor(i/3)*74;
      node.className = `person ${p.tipo} waiting`;
    }
    node.style.transform = `translate(${x-size/2}px,${y-22}px)`;
    node.setAttribute('aria-label',`${p.id}: ${p.estado === 'activo' ? (p.tipo==='L'?'leyendo':'escribiendo') : p.estado==='terminado'?'terminó':'esperando'}`);
    node.setAttribute('role','img');
  }
}
async function add(type) {
  const current = simulation;
  if (current.procesos.filter(p=>p.estado!=='terminado').length >= 10) return;
  const task = current.agregar(type);
  render();
  await task;
  if (current === simulation) render();
}
function reset() {
  clearTimeout(demoTimer);
  generation++;
  simulation = new Simulacion();
  nodes.clear(); $('personas').replaceChildren();
  paused=false;render();
}
$('lector').onclick=()=>add('L');
$('escritor').onclick=()=>add('E');
$('reiniciar').onclick=reset;
$('pausa').onclick=()=>{paused=!paused;render();};
$('ejemplo').onclick=async()=>{
  reset();const token=generation;
  await add('L');if(token!==generation)return;
  await add('L');if(token!==generation)return;
  await add('E');if(token!==generation)return;
  demoTimer=setTimeout(()=>{if(token===generation)add('L');},1000);
};
// Un único reloj controla tanto la barra como el final de la operación.
// 3 unidades del modelo = 3900 ms. Pausar congela ambas cosas.
let ultimoFrame = null;
async function animar(ahora) {
  const deltaMs = ultimoFrame === null ? 0 : Math.min(100, ahora - ultimoFrame);
  ultimoFrame = ahora;
  if (!paused && !ticking && simulation.activos.length) {
    const current = simulation;
    ticking = true;
    try {
      await current.avanzar(deltaMs / 1300);
      if (current === simulation) render();
    } finally { ticking = false; }
  }
  requestAnimationFrame(animar);
}
requestAnimationFrame(animar);
window.addEventListener('resize',layout);
// El visor de la página muestra solamente el algoritmo.
async function showCode() {
  try {
    const response = await fetch('algoritmo.js');
    if (!response.ok) throw Error('Archivo no disponible.');
    $('codigo').textContent = await response.text();
  } catch (error) { $('codigo').textContent = error.message; }
}
showCode();render();
