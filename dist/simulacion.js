// ADAPTADOR DE LA DEMO: procesos y duración. No decide quién entra.
import { LectoresEscritores } from './algoritmo.js';
export class Simulacion extends LectoresEscritores {
  constructor() {
    super();
    this.valor = 0;
    this.tiempo = 0;
    this.procesos = [];
    this.numeroLector = 0;
    this.numeroEscritor = 0;
  }
  operar(p) {
    p.estado = 'activo';
    p.restante = 3;
    return new Promise(resolve => { p.continuar = resolve; });
  }
  async agregar(tipo) {
    if (tipo !== 'L' && tipo !== 'E') throw new Error('Tipo inválido.');
    const numero = tipo === 'L' ? ++this.numeroLector : ++this.numeroEscritor;
    const p = { id: tipo + numero, tipo, estado: 'espera' };
    this.procesos.push(p);
    const operacion = async () => {
      await this.operar(p);
      if (tipo === 'E') this.valor++;
    };
    p.tarea = (tipo === 'L' ? this.lector(operacion) : this.escritor(operacion))
      .then(() => { p.estado = 'terminado'; });
    await this.estabilizar();
  }
  async paso() { await this.avanzar(1); }
  async avanzar(delta) {
    this.tiempo += delta;
    let finalizo = false;
    for (const p of this.activos) {
      p.restante = Math.max(0, p.restante - delta);
      if (p.restante <= 1e-9) {
        p.restante = 0;
        p.estado = 'saliendo';
        p.continuar();
        finalizo = true;
      }
    }
    if (finalizo) await this.estabilizar();
  }
  // Deja completar los await desbloqueados antes de volver a dibujar.
  estabilizar() { return new Promise(resolve => setTimeout(resolve, 0)); }
  get activos() { return this.procesos.filter(p => p.estado === 'activo'); }
  get cola() { return this.procesos.filter(p => p.estado === 'espera'); }
}
