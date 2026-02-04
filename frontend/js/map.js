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
 * 4. CREAR ITEM DEL TOC
 ************************************************/

function crearItemTOC(cfg, layer) {

  const cont =
    cfg.grupo === 'base'
      ? document.getElementById('toc-bases')
      : document.getElementById('toc-overlays');

  const item = document.createElement('div');
  item.className = 'toc-item';

  const input = document.createElement('input');

  input.type = cfg.grupo === 'base' ? 'radio' : 'checkbox';
  input.name = cfg.grupo === 'base' ? 'base' : cfg.id;
  input.checked = layer.getVisible();

  input.addEventListener('change', () => {

    if (cfg.grupo === 'base') {

      map.getLayers().forEach(l => {
        if (l.get('type') === 'base') {
          l.setVisible(l === layer);
        }
      });

    } else {
      layer.setVisible(input.checked);
    }

  });

  const label = document.createElement('span');
  label.textContent = cfg.titulo;

  item.append(input, label);
  cont.appendChild(item);
}
fetch('http://localhost:3000/api/capas-base')
  .then(res => res.json())
  .then(capas => {

    capas.forEach(cfg => {

      const layer = crearCapa(cfg);
      map.addLayer(layer);

      crearItemTOC(cfg, layer);

    });

  })
  .catch(err => console.error(err));
