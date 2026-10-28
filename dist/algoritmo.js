// ALGORITMO: sin HTML, animación ni temporizadores.
// P espera un permiso. V lo libera o lo transfiere a quien espera.
export class Semaforo {
  constructor(valor = 1, nombre = '') {
    this.valor = valor;
    this.nombre = nombre;
    this.cola = [];
  }
  P() {
    if (this.valor > 0) {
      this.valor--;
      return Promise.resolve();
    }
    return new Promise(resolve => this.cola.push(resolve));
  }
  V() {
    if (this.cola.length > 0) this.cola.shift()();
    else this.valor++;
  }
}

export class LectoresEscritores {
  constructor() {
    this.lectores = 0;
    this.mutex = new Semaforo(1, 'mutex');
    this.recurso = new Semaforo(1, 'recurso');
  }

  // El primero toma recurso; el último lo libera.
  async lector(leer) {
    await this.mutex.P();
    this.lectores++;
    if (this.lectores === 1) await this.recurso.P();
    this.mutex.V();

    await leer();

    await this.mutex.P();
    this.lectores--;
    if (this.lectores === 0) this.recurso.V();
    this.mutex.V();
  }

  async escritor(escribir) {
    await this.recurso.P();
    await escribir();
    this.recurso.V();
  }
}
