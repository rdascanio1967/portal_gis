/************************************************
 * 1. CREAR EL MAPA
 ************************************************/

const map = new ol.Map({
  target: 'map',
  layers: [],   // las capas se agregan después
  view: new ol.View({
    center: ol.proj.fromLonLat([-58.3, -34.6]),
    zoom: 7
  })
});
/************************************************
 * CONTROLES BÁSICOS
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
 * 2. CREAR CAPAS DESDE CONFIG
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
    source: source,
    title: cfg.titulo,
    visible: cfg.visible || false,
    type: cfg.grupo
  });
}
/************************************************
 * 3. CARGAR CAPAS DESDE NODE
 ************************************************/

fetch('http://localhost:3000/api/capas-base')
  .then(res => res.json())
  .then(capas => {

    capas.forEach(cfg => {
      const capa = crearCapa(cfg);
      map.addLayer(capa);
    });

  })
  .catch(err => console.error(err));
  /************************************************
 * TOC - CAPAS BASE (RADIOS)
 ************************************************/

function agregarBaseTOC(capa) {
  const cont = document.getElementById('toc-bases');

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
 * TOC - OVERLAYS (CHECKBOX)
 ************************************************/

function agregarOverlayTOC(capa) {
  const cont = document.getElementById('toc-overlays');

  const label = document.createElement('label');
  label.className = 'toc-item';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = capa.getVisible();

  check.addEventListener('change', () => {
    capa.setVisible(check.checked);
  });

  label.appendChild(check);
  label.append(capa.get('title'));
  cont.appendChild(label);
}
fetch('http://localhost:3000/api/capas-base')
  .then(res => res.json())
  .then(capas => {
    capas.forEach(cfg => {
      const capa = crearCapa(cfg);
      map.addLayer(capa);

      if (capa.get('type') === 'base') {
        agregarBaseTOC(capa);
      } else {
        agregarOverlayTOC(capa);
      }
    });
  })
  .catch(err => console.error('Error cargando capas', err));
