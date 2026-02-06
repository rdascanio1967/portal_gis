function crearOverlayConOpciones(nombre, layer, contenedor) {
  if (!contenedor) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'overlay-wrapper';

  /* ================= HEADER ================= */

  const header = document.createElement('div');
  header.className = 'overlay-header';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = layer.getVisible();

  const flecha = document.createElement('span');
  flecha.className = 'flecha';
  flecha.textContent = '▸';

  const titulo = document.createElement('span');
  titulo.className = 'overlay-title';
  titulo.textContent = nombre;

  header.appendChild(check);
  header.appendChild(flecha);
  header.appendChild(titulo);

  /* ================= CONTENIDO ================= */

  const contenido = document.createElement('div');
  contenido.className = 'overlay-opciones';

  /* ---------- Opacidad ---------- */
  const opDiv = document.createElement('div');
  opDiv.className = 'overlay-opacidad';

  opDiv.innerHTML = `
    <label>
      Opacidad
      <input type="range" min="0" max="1" step="0.1" value="${layer.getOpacity()}">
    </label>
  `;

  const slider = opDiv.querySelector('input');
  slider.addEventListener('input', e => {
    layer.setOpacity(parseFloat(e.target.value));
  });

  contenido.appendChild(opDiv);

  /* ================= LEYENDA ================= */

  if (layer.cfg?.leyenda?.mostrar) {

    // 🔴 CASO 1: WMS categorizado (SLD)
    if (layer.cfg.leyenda.tipo === 'wms') {
      const source = layer.getSource();
      const baseUrl = source.getUrls()[0];
      const layerName = source.getParams().LAYERS;

      const img = document.createElement('img');
      img.className = 'leyenda-wms';
      img.src =
        `${baseUrl}?REQUEST=GetLegendGraphic` +
        `&FORMAT=image/png` +
        `&LAYER=${layerName}`;

      contenido.appendChild(img);
    }

    // 🟢 CASO 2: leyenda simple custom
    else {
      const leyenda = crearLeyendaCustom(layer.cfg.leyenda);
      contenido.appendChild(leyenda);
    }
  }

  /* ================= EVENTOS ================= */

  check.addEventListener('change', () => {
    layer.setVisible(check.checked);
  });

  header.addEventListener('click', e => {
    if (e.target.tagName === 'INPUT') return;

    const abierto = contenido.classList.toggle('abierto');
    flecha.textContent = abierto ? '▾' : '▸';
  });

  wrapper.appendChild(header);
  wrapper.appendChild(contenido);
  contenedor.appendChild(wrapper);
}

/* ================= LEYENDAS CUSTOM ================= */

function crearLeyendaCustom(cfg) {
  const cont = document.createElement('div');
  cont.className = 'leyenda-custom';

  if (cfg.tipo === 'polygon') {
    const box = document.createElement('div');
    box.className = 'leyenda-poligono';
    box.style.background = `rgb(${cfg.color})`;
    box.style.border = `1px solid rgb(${cfg.borde || '0,0,0'})`;
    cont.appendChild(box);
  }

  if (cfg.tipo === 'line') {
    const line = document.createElement('div');
    line.className = 'leyenda-linea';
    line.style.borderTop = `${cfg.ancho || 2}px solid rgb(${cfg.color})`;
    cont.appendChild(line);
  }

  if (cfg.tipo === 'point') {
    const pt = document.createElement('div');
    pt.className = 'leyenda-punto';
    pt.style.background = `rgb(${cfg.color})`;
    cont.appendChild(pt);
  }

  return cont;
}
