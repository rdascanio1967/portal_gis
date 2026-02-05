function crearOverlayConOpciones(nombre, layer, contenedor) {
  const cont = contenedor;
  if (!cont) return;

  // CONTENEDOR PRINCIPAL
  const wrapper = document.createElement('div');
  wrapper.className = 'overlay-wrapper';

  // CABECERA
  const header = document.createElement('div');
  header.className = 'overlay-header';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = layer.getVisible();
  check.className = 'overlay-check';

  const flecha = document.createElement('span');
  flecha.className = 'flecha';
  flecha.textContent = '➤';

  const titulo = document.createElement('span');
  titulo.className = 'overlay-title';
  titulo.textContent = nombre;

  header.appendChild(check);
  header.appendChild(flecha);
  header.appendChild(titulo);

  // CONTENIDO COLAPSABLE
  const contenido = document.createElement('div');
  contenido.className = 'overlay-opciones';
  contenido.style.display = 'none';

  contenido.innerHTML = `
    <label style="font-size: 11px;">
      Opacidad:
      <input type="range" min="0" max="1" step="0.1"
             value="${layer.getOpacity()}"
             class="opacidad-slider">
    </label>
  `;

  // EVENTOS
  check.addEventListener('change', () => {
    layer.setVisible(check.checked);
  });

  header.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT') return;

    const abierto = contenido.style.display === 'block';
    contenido.style.display = abierto ? 'none' : 'block';
    flecha.classList.toggle('abierta', !abierto);
  });

  contenido.querySelector('.opacidad-slider').addEventListener('input', e => {
    layer.setOpacity(parseFloat(e.target.value));
  });

  // LEYENDA AUTOMÁTICA (solo WMS)
  try {
    const source = layer.getSource();
    if (source && source.getParams) {
      const baseUrl = source.getUrls()[0];
      const layerName = source.getParams().LAYERS;

      const urlLeyenda =
        `${baseUrl}?REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerName}`;

      const leyendaImg = document.createElement('img');
      leyendaImg.src = urlLeyenda;
      leyendaImg.style.marginTop = '4px';
      leyendaImg.style.display = layer.getVisible() ? 'block' : 'none';

      // DETECCIÓN INTELIGENTE DE TAMAÑO
      leyendaImg.onload = () => {
        const w = leyendaImg.naturalWidth;
        const h = leyendaImg.naturalHeight;
        const ratio = w / h;
          // DEBUG VISUAL (PEGAR ACÁ)
        leyendaImg.title = `${w}x${h}`;

        const esPoligono = ratio < 1.4 && h > 20;
        const esLinea = ratio >= 1.4 && h <= 25;
        const esPunto = w <= 25 && h <= 25;

        if (esPoligono) {
          leyendaImg.style.width = '22px';
          leyendaImg.style.height = '22px';
        } 
        else if (esLinea) {
          // NO forzar altura: dejar que se lea el texto
          leyendaImg.style.width = '100%';
          leyendaImg.style.maxWidth = '220px';
          leyendaImg.style.height = 'auto';
          leyendaImg.style.objectFit = 'unset';
        }
        else if (esPunto) {
          leyendaImg.style.width = '18px';
          leyendaImg.style.height = '18px';
        } 
        else {
          leyendaImg.style.width = '70px';
          leyendaImg.style.height = '26px';
        }

        if (esPoligono || esPunto) {
          leyendaImg.style.objectFit = 'contain';
          leyendaImg.style.border = '1px solid #ccc';
          leyendaImg.style.borderRadius = '3px';
          leyendaImg.style.background = '#fff';
          leyendaImg.style.padding = '2px';
        }
       
      };

      contenido.appendChild(leyendaImg);

      layer.on('change:visible', () => {
        leyendaImg.style.display = layer.getVisible() ? 'block' : 'none';
      });
    }
  } catch (err) {
    console.warn("No se pudo generar la leyenda para:", nombre, err);
  }

  wrapper.appendChild(header);
  wrapper.appendChild(contenido);
  cont.appendChild(wrapper);
}
