import { ACORDES, MELODIAS_POR_ID, duracionTotal, frecuencia, type Melodia } from './content/melodias';

export type Efecto = 'toc' | 'trio' | 'victoria' | 'aviso' | 'acierto' | 'error' | 'boton' | 'canje' | 'bloqueada';

/**
 * Motor de sonido con Web Audio: música tranquila sintetizada (piano y arpa
 * suaves con reverberación), efectos agradables y atenuación automática.
 */
class MotorAudio {
  private ctx: AudioContext | null = null;
  private general!: GainNode;
  private musica!: GainNode;
  private atenuador!: GainNode;
  private efectos!: GainNode;
  private reverb!: ConvolverNode;
  private volumenes = { general: 0.7, musica: 0.4, efectos: 0.7 };
  private melodiaActual: Melodia | null = null;
  private temporizador: number | null = null;
  private inicioCiclo = 0;
  private programadoHasta = 0;
  private eventos: Array<{ t: number; tipo: 'nota' | 'acorde'; valor: string; dur: number }> = [];
  private duracionCiclo = 0;

  /** Debe llamarse tras un gesto del usuario (política de reproducción automática). */
  iniciar(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.general = this.ctx.createGain();
    this.musica = this.ctx.createGain();
    this.atenuador = this.ctx.createGain();
    this.efectos = this.ctx.createGain();
    this.reverb = this.ctx.createConvolver();
    this.reverb.buffer = this.respuestaReverb(2.6);
    const mezclaReverb = this.ctx.createGain();
    mezclaReverb.gain.value = 0.35;

    this.musica.connect(this.atenuador);
    this.atenuador.connect(this.general);
    this.musica.connect(this.reverb);
    this.efectos.connect(this.general);
    this.efectos.connect(this.reverb);
    this.reverb.connect(mezclaReverb);
    mezclaReverb.connect(this.general);
    this.general.connect(this.ctx.destination);
    this.aplicarVolumenes();
  }

  get activo(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  private respuestaReverb(segundos: number): AudioBuffer {
    const ctx = this.ctx!;
    const largo = Math.floor(ctx.sampleRate * segundos);
    const buffer = ctx.createBuffer(2, largo, ctx.sampleRate);
    for (let canal = 0; canal < 2; canal++) {
      const datos = buffer.getChannelData(canal);
      for (let i = 0; i < largo; i++) datos[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3);
    }
    return buffer;
  }

  setVolumenes(general: number, musica: number, efectos: number): void {
    this.volumenes = { general: general / 100, musica: musica / 100, efectos: efectos / 100 };
    this.aplicarVolumenes();
  }

  private aplicarVolumenes(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.general.gain.setTargetAtTime(this.volumenes.general, t, 0.05);
    this.musica.gain.setTargetAtTime(this.volumenes.musica * 0.8, t, 0.05);
    this.efectos.gain.setTargetAtTime(this.volumenes.efectos, t, 0.05);
  }

  /** Baja la música mientras hay una pregunta o una celebración. */
  atenuar(activo: boolean): void {
    if (!this.ctx) return;
    this.atenuador.gain.setTargetAtTime(activo ? 0.3 : 1, this.ctx.currentTime, 0.4);
  }

  suspender(): void {
    void this.ctx?.suspend();
  }

  reanudar(): void {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }

  /* ---------- Música ---------- */

  reproducirMelodia(id: string): void {
    if (!this.ctx) return;
    const melodia = MELODIAS_POR_ID.get(id) ?? MELODIAS_POR_ID.get('gracia')!;
    if (this.melodiaActual?.id === melodia.id && this.temporizador !== null) return;
    this.detenerMusica();
    this.melodiaActual = melodia;
    const tiempo = 60 / melodia.tempo;
    this.eventos = [];
    let t = 0;
    for (const [nota, dur] of melodia.notas) {
      if (nota !== 'R') this.eventos.push({ t: t * tiempo, tipo: 'nota', valor: nota, dur: dur * tiempo });
      t += dur;
    }
    t = 0;
    for (const [acorde, dur] of melodia.acordes) {
      if (acorde !== 'R') this.eventos.push({ t: t * tiempo, tipo: 'acorde', valor: acorde, dur: dur * tiempo });
      t += dur;
    }
    this.eventos.sort((a, b) => a.t - b.t);
    this.duracionCiclo = (duracionTotal(melodia) + 2) * tiempo;
    // Entrada suave.
    const ahora = this.ctx.currentTime;
    this.musica.gain.cancelScheduledValues(ahora);
    this.musica.gain.setValueAtTime(0.0001, ahora);
    this.musica.gain.linearRampToValueAtTime(this.volumenes.musica * 0.8, ahora + 2);
    this.inicioCiclo = ahora + 0.3;
    this.programadoHasta = this.inicioCiclo;
    this.temporizador = window.setInterval(() => this.programar(), 150);
    this.programar();
  }

  detenerMusica(): void {
    if (this.temporizador !== null) window.clearInterval(this.temporizador);
    this.temporizador = null;
    this.melodiaActual = null;
    if (this.ctx) {
      const ahora = this.ctx.currentTime;
      this.musica.gain.cancelScheduledValues(ahora);
      this.musica.gain.setTargetAtTime(0.0001, ahora, 0.5);
    }
  }

  private programar(): void {
    if (!this.ctx || !this.melodiaActual) return;
    const ventana = this.ctx.currentTime + 0.8;
    while (this.programadoHasta < ventana) {
      const desde = this.programadoHasta - this.inicioCiclo;
      const hasta = Math.min(ventana - this.inicioCiclo, this.duracionCiclo);
      for (const ev of this.eventos) {
        if (ev.t >= desde && ev.t < hasta) {
          const cuando = this.inicioCiclo + ev.t;
          if (ev.tipo === 'nota') this.piano(frecuencia(ev.valor), cuando, ev.dur, 0.2, this.musica);
          else this.acorde(ev.valor, cuando, ev.dur);
        }
      }
      if (hasta >= this.duracionCiclo) {
        this.inicioCiclo += this.duracionCiclo;
        this.programadoHasta = this.inicioCiclo;
      } else {
        // Se fija exactamente en la ventana: con sumas de punto flotante podía
        // quedar apenas por debajo y el bucle no terminaba nunca.
        this.programadoHasta = ventana;
      }
    }
  }

  private acorde(nombre: string, cuando: number, dur: number): void {
    const notas = ACORDES[nombre];
    if (!notas) return;
    const tiempo = 60 / (this.melodiaActual?.tempo ?? 66);
    // Bajo suave.
    this.tono(frecuencia(notas[0]) / 2, cuando, dur + 0.6, 0.11, 'sine', this.musica, 0.04);
    // Arpegio de arpa una octava arriba.
    const pasos = Math.max(1, Math.round(dur / tiempo));
    for (let i = 0; i < pasos; i++) {
      const nota = notas[(i + 1) % notas.length];
      this.arpa(frecuencia(nota) * 2, cuando + i * tiempo, 0.045, this.musica);
    }
  }

  /* ---------- Voces ---------- */

  private tono(
    hz: number,
    cuando: number,
    dur: number,
    volumen: number,
    forma: OscillatorType,
    destino: AudioNode,
    ataque = 0.01,
  ): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = forma;
    osc.frequency.value = hz;
    env.gain.setValueAtTime(0.0001, cuando);
    env.gain.exponentialRampToValueAtTime(volumen, cuando + ataque);
    env.gain.exponentialRampToValueAtTime(0.0001, cuando + dur);
    osc.connect(env);
    env.connect(destino);
    osc.start(cuando);
    osc.stop(cuando + dur + 0.05);
  }

  private piano(hz: number, cuando: number, dur: number, volumen: number, destino: AudioNode): void {
    const ctx = this.ctx!;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 2200;
    filtro.connect(destino);
    const cola = Math.max(dur, 0.4) + 1.2;
    this.tono(hz, cuando, cola, volumen, 'triangle', filtro, 0.012);
    this.tono(hz * 2, cuando, cola * 0.6, volumen * 0.18, 'sine', filtro, 0.012);
  }

  private arpa(hz: number, cuando: number, volumen: number, destino: AudioNode): void {
    this.tono(hz, cuando, 1.6, volumen, 'sine', destino, 0.006);
    this.tono(hz * 3, cuando, 0.5, volumen * 0.15, 'sine', destino, 0.004);
  }

  /* ---------- Efectos ---------- */

  efecto(nombre: Efecto): void {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.01;
    const e = this.efectos;
    switch (nombre) {
      case 'toc':
        this.tono(620, t, 0.14, 0.28, 'triangle', e, 0.004);
        this.tono(1240, t, 0.06, 0.06, 'sine', e, 0.002);
        break;
      case 'bloqueada':
        this.tono(330, t, 0.12, 0.12, 'sine', e, 0.005);
        break;
      case 'trio':
        ['C5', 'E5', 'G5'].forEach((n, i) => this.campana(frecuencia(n), t + i * 0.07, 0.16));
        break;
      case 'victoria':
        ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6'].forEach((n, i) => this.arpa(frecuencia(n), t + i * 0.11, 0.2, e));
        break;
      case 'aviso':
        this.tono(frecuencia('E5'), t, 0.35, 0.12, 'sine', e, 0.02);
        this.tono(frecuencia('C5'), t + 0.22, 0.45, 0.12, 'sine', e, 0.02);
        break;
      case 'acierto':
        this.campana(frecuencia('G5'), t, 0.18);
        this.campana(frecuencia('C6'), t + 0.12, 0.18);
        break;
      case 'error':
        this.tono(frecuencia('A3'), t, 0.4, 0.12, 'sine', e, 0.03);
        this.tono(frecuencia('F3'), t + 0.2, 0.6, 0.1, 'sine', e, 0.03);
        break;
      case 'boton':
        this.tono(880, t, 0.06, 0.05, 'sine', e, 0.003);
        break;
      case 'canje':
        this.campana(frecuencia('E6'), t, 0.12);
        this.campana(frecuencia('B6'), t + 0.08, 0.1);
        break;
    }
  }

  private campana(hz: number, cuando: number, volumen: number): void {
    this.tono(hz, cuando, 1.2, volumen, 'sine', this.efectos, 0.004);
    this.tono(hz * 2.76, cuando, 0.5, volumen * 0.2, 'sine', this.efectos, 0.003);
  }
}

export const audio = new MotorAudio();
