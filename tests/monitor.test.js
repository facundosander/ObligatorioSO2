import test from 'node:test';
import assert from 'node:assert/strict';
import { Simulacion } from '../dist/simulacion.js';
import { Semaforo, LectoresEscritores } from '../dist/algoritmo.js';
const avanzar = async (s,n) => { for(let i=0;i<n;i++) await s.paso(); };
function seguro(s) {
 const e=s.activos.filter(p=>p.tipo==='E').length;
 assert.ok(e<=1);if(e)assert.equal(s.activos.length,1);
 assert.ok(s.mutex.valor===0||s.mutex.valor===1);
 assert.ok(s.recurso.valor===0||s.recurso.valor===1);
}
test('P bloquea y V transfiere un único permiso',async()=>{
 const sem=new Semaforo(1);await sem.P();let entro=false;
 const espera=sem.P().then(()=>{entro=true;});
 await Promise.resolve();assert.equal(entro,false);
 sem.V();await espera;assert.equal(entro,true);assert.equal(sem.valor,0);
 sem.V();assert.equal(sem.valor,1);
});
test('Prioridad lectores: un lector nuevo adelanta al escritor',async()=>{
 const s=new Simulacion();await s.agregar('L');await s.agregar('L');await s.agregar('E');await s.agregar('L');
 assert.deepEqual(s.activos.map(p=>p.id),['L1','L2','L3']);
 assert.equal(s.lectores,3);assert.equal(s.recurso.valor,0);
 await avanzar(s,3);assert.deepEqual(s.activos.map(p=>p.id),['E1']);
 assert.equal(s.lectores,0);await avanzar(s,3);
 assert.equal(s.valor,1);assert.equal(s.recurso.valor,1);assert.equal(s.mutex.valor,1);
});
test('Lector bloqueado en recurso conserva mutex, luego progresa',async()=>{
 const s=new Simulacion();await s.agregar('E');await s.agregar('L');await s.agregar('L');
 assert.equal(s.lectores,1);assert.equal(s.mutex.valor,0);
 assert.equal(s.cola.length,2);
 await avanzar(s,3);assert.equal(s.activos.length,2);assert.equal(s.lectores,2);seguro(s);
 await avanzar(s,3);assert.equal(s.mutex.valor,1);assert.equal(s.recurso.valor,1);
});
test('Carga mixta: exclusión, contador y escrituras sin pérdidas',async()=>{
 const s=new Simulacion();
 for(let i=0;i<30;i++)await s.agregar(i%3===0?'E':'L');
 for(let i=0;i<150&&(s.activos.length||s.cola.length);i++){seguro(s);await s.paso();}
 await Promise.all(s.procesos.map(p=>p.tarea));
 assert.equal(s.valor,10);assert.equal(s.lectores,0);assert.equal(s.activos.length+s.cola.length,0);
 assert.equal(s.mutex.valor,1);assert.equal(s.recurso.valor,1);
});

test('El algoritmo funciona sin página ni reloj de simulación',async()=>{
 const a=new LectoresEscritores();let lectura1,lectura2;let escribio=false;
 const p1=a.lector(()=>new Promise(r=>{lectura1=r;}));
 const p2=a.lector(()=>new Promise(r=>{lectura2=r;}));
 await new Promise(r=>setTimeout(r,0));
 const w=a.escritor(async()=>{escribio=true;});
 await new Promise(r=>setTimeout(r,0));
 assert.equal(a.lectores,2);assert.equal(escribio,false);
 lectura1();await p1;assert.equal(escribio,false);
 lectura2();await Promise.all([p2,w]);
 assert.equal(escribio,true);assert.equal(a.lectores,0);assert.equal(a.recurso.valor,1);
});

test('La operación termina exactamente al agotar el progreso visual', async()=>{
 const s=new Simulacion();await s.agregar('E');
 const p=s.procesos[0];
 await s.avanzar(1.25);assert.equal(p.restante,1.75);assert.equal(p.estado,'activo');assert.equal(s.valor,0);
 await s.avanzar(1.74);assert.ok(p.restante>0);assert.equal(p.estado,'activo');assert.equal(s.valor,0);
 await s.avanzar(.01);assert.equal(p.restante,0);assert.equal(p.estado,'terminado');assert.equal(s.valor,1);
});
