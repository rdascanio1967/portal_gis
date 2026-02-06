/************************************************
 * OVERLAYS / TOC AVANZADO
 * - Checkbox visibilidad
 * - Panel desplegable
 * - Opacidad
 * - Leyenda mixta (custom / WMS)
 ************************************************/

/**
 * Crea un overlay con controles y leyenda
 * @param {string} nombre
 * @param {ol.layer.Layer} layer
 * @param {HTMLElement} contenedor
 */
function crearOverlayConOpciones(nombre, layer, contenedor) {
  if (!contenedor) return;

  /* CONTENEDOR PRINCIPAL */
  const wrapper = document.createElement('div');
  wrapper.className = 'overlay-wrapper';

  /* CABECERA */
  const header = document.createElement('div');
  header.className = 'overlay-header';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = layer.getVisible();

  const flecha = document.createElement('span');
  flecha.className = 'overlay-arrow';
  flecha.textContent = '▸';

  const titulo = document.createElement('span');
  titulo.className = 'overlay-title';
  titulo.textContent = nombre;

  header.appendChild(check);
  header.appendChild(flecha);
  header.appendChild(titulo);

  /* CONTENIDO DESPLEGABLE */
  const contenido = document.createElement('div');
  contenido.className = 'overlay-content';
  contenido.style.display = 'none';

  /* OPACIDAD */
  const opWrap = document.createElement('div');
  opWrap.className = 'overlay-opacidad';

  const opLabel = document.createElement('label');
  opLabel.textContent = 'Opacidad';

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = 1;
  slider.step = 0.1;
  slider.value = layer.getOpacity();

  opWrap.appendChild(opLabel);
  opWrap.appendChild(slider);
  contenido.appendChild(opWrap);

  /* EVENTOS */
  check.addEventListener('change', () => {
    layer.setVisible(check.checked);
  });

  slider.addEventListener('input', e => {
    layer.setOpacity(parseFloat(e.target.value));
  });

  header.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT') return;

    const abierto = contenido.style.display === 'block';
    contenido.style.display = abierto ? 'none' : 'block';
    flecha.textContent = abierto ? '▸' : '▾';
  });

  /* LEYENDA */
  if (layer.cfg && layer.cfg.leyenda?.mostrar) {
    const leyenda = crearLeyenda(layer);
    if (leyenda) contenido.appendChild(leyenda);
  }

  wrapper.appendChild(header);
  wrapper.appendChild(contenido);
  contenedor.appendChild(wrapper);
}

/************************************************
 * LEYENDA (DECIDE SI ES CUSTOM O WMS)
 ************************************************/
function crearLeyenda(layer) {
  const cfg = layer.cfg?.leyenda;
  if (!cfg) return null;

  // Leyenda WMS completa (restricciones, categorías)
  if (cfg.tipo === 'wms') {
    const source = layer.getSource();
    const baseUrl = source.getUrls()[0];
    const layerName = source.getParams().LAYERS;

    const img = document.createElement('img');
    img.src =
      `${baseUrl}?REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${layerName}`;

    img.className = 'leyenda-wms';
    img.style.maxWidth = '220px';
    img.style.marginTop = '6px';

    return img;
  }

  // Leyenda custom simple
  return crearLeyendaCustom(cfg);
}

/************************************************
 * LEYENDA CUSTOM (POLÍGONO / LÍNEA / PUNTO)
 ************************************************/
function crearLeyendaCustom(cfg) {
  const div = document.createElement('div');
  div.className = 'leyenda-custom';

  if (cfg.tipo === 'polygon') {
    const box = document.createElement('div');
    box.className = 'leyenda-poligono';
    box.style.background = `rgb(${cfg.color})`;
    box.style.border = `1px solid rgb(${cfg.borde || '0,0,0'})`;
    div.appendChild(box);
  }

  if (cfg.tipo === 'line') {
    const line = document.createElement('div');
    line.className = 'leyenda-linea';
    line.style.borderTop =
      `${cfg.ancho || 3}px solid rgb(${cfg.color})`;
    div.appendChild(line);
  }

  if (cfg.tipo === 'point') {
    const point = document.createElement('div');
    point.className = 'leyenda-punto';
    point.style.background = `rgb(${cfg.color})`;
    div.appendChild(point);
  }

  return div;
}

