/************************************************
 * 1. MAPA Y POPUP
 ************************************************/

const popupOverlay = new ol.Overlay({
  element: document.getElementById('popup'),
  positioning: 'bottom-center',
  stopEvent: false
});
const highlightLayer = new ol.layer.Vector({
  source: new ol.source.Vector(),
  style: new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: 'yellow',
      width: 3
    }),
    fill: new ol.style.Fill({
      color: 'rgba(255,255,0,0.2)'
    })
  })
});




const map = new ol.Map({
  target: 'map',
  layers: [],
  view: new ol.View({
    center: ol.proj.fromLonLat([-58.0, -37.3]),
    zoom: 7
  })
});

map.addOverlay(popupOverlay);
map.addLayer(highlightLayer);

/************************************************
 * 2. CONTROLES
 ************************************************/

map.addControl(new ol.control.ScaleLine());

map.addControl(
  new ol.control.MousePosition({
    projection: 'EPSG:4326',
    coordinateFormat: coord =>
      ol.coordinate.format(coord, '{x}, {y}', 5)
  })
);

/************************************************
 * 3. CREAR CAPA DESDE CONFIG
 ************************************************/

function crearCapa(cfg) {
  let source;

  if (cfg.tipo === 'OSM') {
    source = new ol.source.OSM();
  }

  if (cfg.tipo === 'XYZ') {
    source = new ol.source.XYZ({
      url: cfg.url
    });
  }

  if (cfg.tipo === 'WMS') {
    source = new ol.source.TileWMS({
      url: cfg.url,
      params: {
        LAYERS: cfg.layers,
        FORMAT: cfg.format || 'image/png',
        TRANSPARENT: true
      },
      serverType: 'geoserver'
    });
  }

  return new ol.layer.Tile({
    source,
    title: cfg.titulo,
    visible: cfg.visible || false,
    type: cfg.grupo,
    opacity: 1
  });
}

/************************************************
 * 4. TOC BASES
 ************************************************/

function agregarBaseTOC(capa) {
  const cont = document.getElementById('toc-bases');
  if (!cont) return;

  const label = document.createElement('label');
  label.className = 'toc-item';

  const radio = document.createElement('input');
  radio.type = 'radio';
  radio.name = 'base';
  radio.checked = capa.getVisible();

  radio.addEventListener('change', () => {
    map.getLayers().forEach(l => {
      if (l.get('type') === 'base') {
        l.setVisible(l === capa);
      }
    });
  });

  label.appendChild(radio);
  label.append(capa.get('title'));
  cont.appendChild(label);
}

/************************************************
 * 5. CARGA ÚNICA DE CAPAS DESDE NODE
 ************************************************/

fetch('http://localhost:3000/api/capas-base')
  .then(res => res.json())
  .then(capas => {

    capas.forEach(cfg => {

      const capa = crearCapa(cfg);
      capa.cfg = cfg;              // 🔥 clave para overlays / leyendas
      map.addLayer(capa);

      // ---- BASES ----
      if (cfg.grupo === 'base') {
        agregarBaseTOC(capa);
      }

      // ---- OVERLAYS ----
      else {
        const contenedor = document.getElementById(`grupo-${cfg.grupo}`);
        if (contenedor) {
          crearOverlayConOpciones(cfg.titulo, capa, contenedor);
        }
      }
    });

  })
  .catch(err => console.error('Error cargando capas', err));

/************************************************
 * 6. CONSULTAS GetFeatureInfo
 ************************************************/

map.on('singleclick', function (evt) {
  const resolution = map.getView().getResolution();
  const coordinate = evt.coordinate;

  let resultados = [];
  let pendientes = 0;

  map.getLayers().forEach(layer => {

    if (
      layer.getVisible() &&
      layer.getSource() instanceof ol.source.TileWMS
    ) {
      const url = layer.getSource().getFeatureInfoUrl(
        coordinate,
        resolution,
        'EPSG:3857',
        {
          INFO_FORMAT: 'application/json',
          BUFFER: 10
        }
      );

      if (url) {
        pendientes++;

        fetch(url)
          .then(res => res.json())
          .then(data => {
            if (data.features?.length) {
              resultados.push({
                capa: layer.get('title'),
                layer: layer,
                atributos: data.features[0].properties,
                geometry: data.features[0].geometry
                
              });
            }
          })
          .finally(() => {
            pendientes--;
            if (pendientes === 0) {
              /*mostrarPopupMultiple(resultados, coordinate);*/
              mostrarPanelInfo(resultados,coordinate);
            }
          });
      }
    }
  });
});

/************************************************
 * 7. POPUP MULTICAPA
 ************************************************/
function formatearValor(alias, valor) {
  if (valor === null || valor === undefined || valor === "") return "-";

  // Fecha YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(valor)) {
    const [y, m, d] = valor.split("-");
    return `${d}/${m}/${y}`;
  }

  // Número
  if (!isNaN(valor)) {
    const num = Number(valor);
    let formatted = num.toLocaleString("es-AR");

    if (alias.toLowerCase().includes("superficie")) {
      return `${formatted} km²`;
    }

    if (alias.toLowerCase().includes("longitud") || alias.toLowerCase().includes("km")) {
      return `${formatted} m`;
    }

    return formatted;
  }

  return valor;
}
/*
function mostrarPopupMultiple(resultados, coordinate) {
  if (!resultados.length) {
    popupOverlay.setPosition(undefined);
    return;
  }

  let html = `
    <div class="popup-header">
      <span class="popup-close">✖</span>
    </div>
    <div class="popup-tabs">
      <div class="popup-tab-headers">
  `;

  // Cabeceras de pestañas
  resultados.forEach((r, i) => {
    html += `<div class="popup-tab-header ${i === 0 ? "active" : ""}" data-tab="${i}">
               ${r.capa}
             </div>`;
  });

  html += `</div><div class="popup-tab-bodies">`;

  // Cuerpo de pestañas
  resultados.forEach((r, i) => {
    html += `<div class="popup-tab-body ${i === 0 ? "active" : ""}" data-tab="${i}">
               <table class="popup-table">`;

    const cfgPopup = r.layer.cfg.popup;

    if (cfgPopup) {
      for (let campo in cfgPopup) {
        const alias = cfgPopup[campo];
        const valor = formatearValor(alias, r.atributos[campo]);

        html += `
          <tr>
            <th>${alias}</th>
            <td>${valor}</td>
          </tr>`;
      }
    } else {
      for (let key in r.atributos) {
        html += `
          <tr>
            <th>${key}</th>
            <td>${r.atributos[key]}</td>
          </tr>`;
      }
    }

    html += `</table></div>`;
  });

  html += `</div></div>`;

  const popup = document.getElementById("popup");
  popup.innerHTML = html;
  popupOverlay.setPosition(coordinate);

  // Cerrar popup
  popup.querySelector(".popup-close").addEventListener("click", () => {
    popupOverlay.setPosition(undefined);
  });

  // Activar pestañas
  popup.querySelectorAll(".popup-tab-header").forEach(header => {
    header.addEventListener("click", () => {
      const tab = header.dataset.tab;

      popup.querySelectorAll(".popup-tab-header").forEach(h => h.classList.remove("active"));
      popup.querySelectorAll(".popup-tab-body").forEach(b => b.classList.remove("active"));

      header.classList.add("active");
      popup.querySelector(`.popup-tab-body[data-tab="${tab}"]`).classList.add("active");
    });
  });

  hacerPopupDraggable();
}
*/
function mostrarPanelInfo(resultados, coordinate) {
  const panel = document.getElementById("panel-info");
  panel.innerHTML = "";
  panel.style.display = "block";

  // Limpiar highlight
  highlightLayer.getSource().clear();

  // Crear cabecera
  let html = `<span class="close-btn">✖</span>`;
  html += `<h3>Resultado</h3>`;

  // Pestañas
  html += `<div class="tab-headers">`;
  resultados.forEach((r, i) => {
    html += `<div class="tab-header ${i === 0 ? "active" : ""}" data-tab="${i}">
               ${r.capa}
             </div>`;
  });
  html += `</div>`;

  // Cuerpos
  resultados.forEach((r, i) => {
    html += `<div class="tab-body ${i === 0 ? "active" : ""}" data-tab="${i}">
               <table>`;

    const cfgPopup = r.layer.cfg.popup;

    if (cfgPopup) {
      for (let campo in cfgPopup) {
        const alias = cfgPopup[campo];
        const valor = formatearValor(alias, r.atributos[campo]);
        html += `<tr><th>${alias}</th><td>${valor}</td></tr>`;
      }
    }

    html += `</table></div>`;
  });

  panel.innerHTML = html;

  // Activar pestañas
  panel.querySelectorAll(".tab-header").forEach(header => {
    header.addEventListener("click", () => {
      const tab = header.dataset.tab;

      panel.querySelectorAll(".tab-header").forEach(h => h.classList.remove("active"));
      panel.querySelectorAll(".tab-body").forEach(b => b.classList.remove("active"));

      header.classList.add("active");
      panel.querySelector(`.tab-body[data-tab="${tab}"]`).classList.add("active");
    });
  });

  // Botón cerrar
  panel.querySelector(".close-btn").addEventListener("click", () => {
    panel.style.display = "none";
    highlightLayer.getSource().clear();
  });

  // Highlight de la geometría
  resultados.forEach(r => {
    if (r.geometry) {
      const format = new ol.format.GeoJSON();
      const feature = format.readFeature(r.geometry, {
        featureProjection: "EPSG:3857"
      });
      highlightLayer.getSource().addFeature(feature);
    }
  });
}

function hacerPopupDraggable() {
  const popup = document.getElementById("popup");
  const header = popup.querySelector(".popup-header");

  let offsetX = 0, offsetY = 0, moviendo = false;

  header.style.cursor = "move";

  header.addEventListener("mousedown", e => {
    moviendo = true;
    offsetX = e.clientX - popup.offsetLeft;
    offsetY = e.clientY - popup.offsetTop;
  });

  document.addEventListener("mousemove", e => {
    if (!moviendo) return;
    popup.style.left = `${e.clientX - offsetX}px`;
    popup.style.top = `${e.clientY - offsetY}px`;
    popup.style.position = "absolute";
  });

  document.addEventListener("mouseup", () => {
    moviendo = false;
  });
}


