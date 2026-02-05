/************************************************
 * 1. MAPA
 ************************************************/

const map = new ol.Map({
  target: 'map',
  layers: [],
  view: new ol.View({
    center: ol.proj.fromLonLat([-58.0, -37.3]),
    zoom: 7
  })
});

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
    source: source,
    title: cfg.titulo,
    visible: cfg.visible || false,
    type: cfg.grupo // 'base' u 'overlay'
  });
}

/************************************************
 * 4. TOC BASES
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
 * 5. TOC OVERLAYS
 ************************************************/



/************************************************
 * 6. CARGA ÚNICA DESDE NODE
 ************************************************/
/*
fetch('http://localhost:3000/api/capas-base')
  .then(res => res.json())
  .then(capas => {
    capas.forEach(cfg => {
      const capa = crearCapa(cfg);
      map.addLayer(capa);

      if (cfg.grupo === 'base') {
        agregarBaseTOC(capa);
      } else {
        const grupo = cfg.grupo;
const contenedor = document.getElementById(`grupo-${grupo}`);

if (contenedor) {
  crearOverlayConOpciones(capa.get('title'), capa, contenedor);
};
}
    });
  })
  .catch(err => console.error('Error cargando capas', err));*/

  fetch('http://localhost:3000/api/capas-base')
  .then(res => res.json())
  .then(capas => {

    capas.forEach(cfg => {

      const capa = crearCapa(cfg);
      map.addLayer(capa);

      // --- BASES ---
      if (capa.get('type') === 'base') {
        agregarBaseTOC(capa);
      }

      // --- OVERLAYS ---
      else {
        const grupo = cfg.grupo;
        const contenedor = document.getElementById(`grupo-${grupo}`);

        if (contenedor) {
          crearOverlayConOpciones(capa.get('title'), capa, contenedor);
        }
      }

    });

    //  DEBUG VISUAL (ACÁ VA)
   /* console.log('--- CAPAS EN EL MAPA ---');
    map.getLayers().forEach(l => {
      console.log(
        l.get('title'),
        '| type:', l.get('type'),
        '| visible:', l.getVisible(),
        '| zIndex:', l.getZIndex()
      );
    });*/

  })
  .catch(err => console.error('Error cargando capas', err));

 
  
  