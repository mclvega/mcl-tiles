/** Lectura en voz alta con la Web Speech API, usando una voz en español. */
class Voz {
  private vozElegida: SpeechSynthesisVoice | null = null;
  private oyentes: Array<() => void> = [];
  velocidad = 0.9;

  constructor() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.elegir();
    window.speechSynthesis.addEventListener?.('voiceschanged', () => this.elegir());
  }

  private elegir(): void {
    const voces = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('es'));
    const preferidas = ['es-419', 'es-mx', 'es-us', 'es-co', 'es-ar', 'es-cl', 'es-es'];
    this.vozElegida =
      preferidas.map((p) => voces.find((v) => v.lang.toLowerCase() === p)).find(Boolean) ?? voces[0] ?? null;
    this.oyentes.forEach((f) => f());
  }

  /** Hay una voz en español disponible en este dispositivo. */
  get disponible(): boolean {
    return this.vozElegida !== null;
  }

  alCambiar(f: () => void): void {
    this.oyentes.push(f);
  }

  hablar(texto: string): void {
    if (!this.vozElegida) return;
    window.speechSynthesis.cancel();
    const frase = new SpeechSynthesisUtterance(texto);
    frase.voice = this.vozElegida;
    frase.lang = this.vozElegida.lang;
    frase.rate = this.velocidad;
    window.speechSynthesis.speak(frase);
  }

  detener(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}

export const voz = new Voz();
