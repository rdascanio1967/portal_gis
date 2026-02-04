function crearOverlayConOpciones(nombre, layer) {

    const cont = document.getElementById('overlays');
    if (!cont) return;
  
    const wrapper = document.createElement('div');
    wrapper.style.marginBottom = '8px';
  
    /* ---------- HEADER ---------- */
  
    const header = document.createElement('div');
    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';
    header.style.fontWeight = 'bold';
  
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = layer.getVisible();
    checkbox.style.marginRight = '6px';
  
    const flecha = document.createElement('span');
    flecha.textContent = '▸ ';
    flecha.style.marginRight = '4px';
  
    header.appendChild(checkbox);
    header.appendChild(flecha);
    header.append(nombre);
  
    /* ---------- OPCIONES ---------- */
  
    const opciones = document.createElement('div');
    opciones.style.display = 'none';
    opciones.style.marginLeft = '20px';
  
    /* Opacidad */
    const labelOp = document.createElement('div');
    labelOp.textContent = 'Opacidad';
  
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 100;
    slider.value = layer.getOpacity() * 100;
  
    /* Leyenda WMS */
    const legendTitle = document.createElement('div');
    legendTitle.textContent = 'Leyenda';
    legendTitle.style.marginTop = '6px';
  
    const legendImg = document.createElement('img');
    legendImg.style.maxWidth = '100%';
  
    // ⚠️ SOLO si es WMS
    const source = layer.getSource();
    if (source instanceof ol.source.TileWMS) {
      const params = source.getParams();
      const url = source.getUrls()[0];
  
      legendImg.src =
        `${url}?REQUEST=GetLegendGraphic` +
        `&FORMAT=image/png` +
        `&LAYER=${params.LAYERS}`;
    }
  
    /* ---------- EVENTOS ---------- */
  
    checkbox.addEventListener('change', () => {
      layer.setVisible(checkbox.checked);
    });
  
    header.addEventListener('click', (e) => {
      if (e.target === checkbox) return;
  
      const abierto = opciones.style.display === 'block';
      opciones.style.display = abierto ? 'none' : 'block';
      flecha.textContent = abierto ? '▸ ' : '▾ ';
    });
  
    slider.addEventListener('input', () => {
      layer.setOpacity(slider.value / 100);
    });
  
    /* ---------- ARMADO ---------- */
  
    opciones.appendChild(labelOp);
    opciones.appendChild(slider);
    opciones.appendChild(legendTitle);
    opciones.appendChild(legendImg);
  
    wrapper.appendChild(header);
    wrapper.appendChild(opciones);
    cont.appendChild(wrapper);
  }
  