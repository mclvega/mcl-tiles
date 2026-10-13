import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import './styles/main.css';

import { app } from './app';
import { audio } from './audio';
import { efectos } from './fx/loop';
import { pantallaAcerca } from './ui/acerca';
import { pantallaBiblia } from './ui/biblia';
import { pantallaAlfoli } from './ui/alfoli';
import { pantallaBienvenida } from './ui/bienvenida';
import { pantallaConfiguracion } from './ui/configuracion';
import { pantallaInicio } from './ui/inicio';
import { pantallaJuego } from './ui/juego';
import { pantallaRecorrido } from './ui/recorrido';
import { pantallaVersiculos } from './ui/versiculos';

app.registrar('bienvenida', pantallaBienvenida);
app.registrar('inicio', pantallaInicio);
app.registrar('juego', pantallaJuego);
app.registrar('recorrido', pantallaRecorrido);
app.registrar('alfoli', pantallaAlfoli);
app.registrar('versiculos', pantallaVersiculos);
app.registrar('configuracion', pantallaConfiguracion);
app.registrar('acerca', pantallaAcerca);
app.registrar('biblia', pantallaBiblia);

efectos.montar();
app.montar(document.getElementById('app')!);
app.aplicarConfig();
app.ir(app.g.nombre || app.g.invitado ? 'inicio' : 'bienvenida');

// El audio solo puede empezar después de un gesto del usuario.
const iniciarAudio = () => {
  audio.iniciar();
  app.aplicarConfig();
  window.removeEventListener('pointerdown', iniciarAudio);
  window.removeEventListener('keydown', iniciarAudio);
};
window.addEventListener('pointerdown', iniciarAudio);
window.addEventListener('keydown', iniciarAudio);

document.addEventListener('visibilitychange', () => {
  if (document.hidden) audio.suspender();
  else audio.reanudar();
});

// Si el tema es automático, se vuelve a aplicar cuando cambia el del sistema.
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => app.aplicarConfig());

// Caché del navegador para cargar rápido y seguir funcionando sin conexión.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
