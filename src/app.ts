import { audio } from './audio';
import { efectos } from './fx/loop';
import { aplicarConfigVisual } from './settings/settings';
import { voz } from './speech';
import { cargar, guardar, type Guardado } from './storage';

export type NombrePantalla =
  | 'bienvenida'
  | 'inicio'
  | 'juego'
  | 'recorrido'
  | 'alfoli'
  | 'versiculos'
  | 'configuracion'
  | 'acerca'
  | 'biblia';

export interface Pantalla {
  el: HTMLElement;
  limpiar?: () => void;
}

export type ConstructorPantalla = (params: Record<string, unknown>) => Pantalla;

/** Estado global de la aplicación y navegación entre pantallas. */
class Aplicacion {
  g: Guardado = cargar();
  private raiz: HTMLElement | null = null;
  private actual: Pantalla | null = null;
  private pantallas = new Map<NombrePantalla, ConstructorPantalla>();
  private calidadMedida = false;
  nombrePantalla: NombrePantalla | null = null;

  registrar(nombre: NombrePantalla, constructor: ConstructorPantalla): void {
    this.pantallas.set(nombre, constructor);
  }

  montar(raiz: HTMLElement): void {
    this.raiz = raiz;
  }

  ir(nombre: NombrePantalla, params: Record<string, unknown> = {}): void {
    const constructor = this.pantallas.get(nombre);
    if (!constructor || !this.raiz) return;
    this.actual?.limpiar?.();
    voz.detener();
    const pantalla = constructor(params);
    this.raiz.replaceChildren(pantalla.el);
    this.actual = pantalla;
    this.nombrePantalla = nombre;
    window.scrollTo(0, 0);
    // Lleva el foco al título para lectores de pantalla y teclado.
    const titulo = pantalla.el.querySelector<HTMLElement>('h1');
    if (titulo) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }

  guardar(): void {
    guardar(this.g);
  }

  /** Nombre para mostrar en saludos y mensajes. */
  nombre(): string {
    return this.g.nombre ?? 'Hermano(a)';
  }

  /** Aplica la configuración y lo equipado (fondo, estilo, melodía) al instante. */
  aplicarConfig(): void {
    const c = this.g.config;
    aplicarConfigVisual(c);
    const html = document.documentElement;
    html.dataset.estilo = this.g.equipado.estilo;
    document.body.dataset.fondo = this.g.equipado.fondo;
    audio.setVolumenes(c.volumenGeneral, c.volumenMusica, c.volumenEfectos);
    voz.velocidad = c.velocidadVoz;
    efectos.setLimiteFps(c.fps);
    efectos.setMostrarFps(c.mostrarFps);
    if (c.calidad !== 'auto') efectos.setCalidad(c.calidad);
    else if (!this.calidadMedida) efectos.setCalidad('alta');
    if (audio.activo) {
      if (c.volumenMusica > 0 && c.volumenGeneral > 0) audio.reproducirMelodia(c.melodia);
      else audio.detenerMusica();
    }
  }

  /** En calidad automática, mide el rendimiento una vez por sesión y ajusta. */
  async ajustarCalidadAutomatica(): Promise<void> {
    if (this.g.config.calidad !== 'auto' || this.calidadMedida) return;
    this.calidadMedida = true;
    const calidad = await efectos.medirRendimiento();
    if (this.g.config.calidad === 'auto') efectos.setCalidad(calidad);
  }

  /** La voz está activada y hay una voz en español disponible. */
  vozActiva(): boolean {
    return this.g.config.vozActiva && voz.disponible;
  }
}

export const app = new Aplicacion();
