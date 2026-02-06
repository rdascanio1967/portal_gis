/************************************************
 * 1. MAPA Y POPUP
 ************************************************/

const popupOverlay = new ol.Overlay({
  element: document.getElementById('popup'),
  positioning: 'bottom-center',
  stopEvent: false
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
                atributos: data.features[0].properties
              });
            }
          })
          .finally(() => {
            pendientes--;
            if (pendientes === 0) {
              mostrarPopupMultiple(resultados, coordinate);
            }
          });
      }
    }
  });
});

/************************************************
 * 7. POPUP MULTICAPA
 ************************************************/

function mostrarPopupMultiple(resultados, coordinate) {
  if (!resultados.length) {
    popupOverlay.setPosition(undefined);
    return;
  }

  let html = '<div class="popup-content">';

  resultados.forEach(r => {
    html += `<h4>${r.capa}</h4>`;
    for (let key in r.atributos) {
      html += `<b>${key}:</b> ${r.atributos[key]}<br>`;
    }
    html += '<hr>';
  });

  html += '</div>';

  document.getElementById('popup').innerHTML = html;
  popupOverlay.setPosition(coordinate);
}
