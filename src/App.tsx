import React, { useEffect, useRef, useState } from 'react';
import './styles/App.css';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// import LayersControl from './components/LayersControl';
import world1986 from './geo_data/world_1986.geojson';
import world1991 from './geo_data/world_1991.geojson';
import almaty_1986 from './data_history/almaty_1986.geojson';
import almaty_1991 from './data_history/almaty_1991.geojson';
import Timeline from './components/Timeline';
import LandmarkPanel from './components/LandmarkPanel';
import LoadingSpinner from './components/LoadingSpinner';


const availableYears = [1922, 1937, 1933, 1986, 1991, 2019, 2022];

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [currentYear, setCurrentYear] = useState(1986);
  const [isMapLoading, setIsMapLoading] = useState(true);
  
  // State for landmark panel
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [activeLandmark, setActiveLandmark] = useState<{
    title: string;
    role: string;
    description: string;
    date: string;
    coordinates: [number, number];
    images: string[];
  } | null>(null);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    if (!mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // style: 'https://demotiles.maplibre.org/globe.json', // global
      style: 'https://tiles.openfreemap.org/styles/bright',  // city
      // center: [66.0196, 45.9237], // Kazakhstan
      center: [76.9000, 43.2590], // Almaty
      zoom: 10,
      attributionControl: false
    });

    map.current.on('load', () => {
      const style = map.current?.getStyle();
      if (style && style.layers) {
        style.layers.forEach(layer => {
          if (
            // layer.id.includes('label') ||
            layer.id.includes('crimea-fill') ||
            layer.id.includes('geolines') ||
            layer.id.includes('coastline') ||
            layer.id.includes('place') ||
            layer.id.includes('poi') ||
            layer.id.includes('countries-boundary')
          ) {
            map.current?.removeLayer(layer.id);
            return;
          }

          // Style country/admin fills to be gray
          // if (
          //   layer.type === 'fill' &&
          //   (layer.id.includes('country') || layer.id.includes('admin') || layer.id === 'countries-fill')
          //   //
          // ) {
          //   map.current?.setPaintProperty(layer.id, 'fill-color', '#cccccc');
          //   return;
          // }

        });
      }

      updateMapData(1986);
      
      // Hide loading spinner when map is loaded
      setIsMapLoading(false);
    });

    
    

    // let layersControl = new LayersControl({
    //   title: 'Layers',
    // });

    // map.current.addControl(layersControl);
  }, []);

  // Update map data when year changes
  useEffect(() => {
    if (!map.current || !map.current.loaded()) return;
    updateMapData(currentYear);
    
    // Update landmark data when year changes
    if (map.current.getSource('historical-landmarks')) {
      const landmarkData = currentYear === 1986 ? almaty_1986 : almaty_1991;
      (map.current.getSource('historical-landmarks') as maplibregl.GeoJSONSource).setData(landmarkData as any);
    }
  }, [currentYear]);

  const updateMapData = (year: number) => {
    if (!map.current) return;

    const data = year === 1986 ? world1986 : world1991;
    const landmarkData = year === 1986 ? almaty_1986 : almaty_1991;
    const sourceId = 'historical-world-borders';

    if (map.current.getSource(sourceId)) {
      // Update existing source data
      (map.current.getSource(sourceId) as maplibregl.GeoJSONSource).setData(data as any);
    } else {
      // Add source and layers if they don't exist
      map.current.addSource(sourceId, {
        type: 'geojson',
        data: data as any
      });

      map.current.addLayer({
        id: 'historical-fill',
        type: 'fill',
        source: sourceId,
        maxzoom: 6,
        paint: {
          'fill-color': [
            'case',
            
            ['==', ['get', 'NAME'], 'Қазақстан'], '#00a7f4ff',
            ['==', ['get', 'NAME'], 'Қазақстан КСР'], '#00a7f4ff',
            ['==', ['get', 'NAME'], 'КСРО'], '#ffd700',
            '#f28cb1'
          ],
          'fill-opacity': 0.5
        }
      });

      map.current.addLayer({
        id: 'historical-borders',
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': '#444',
          'line-width': 1
        }
      });

      map.current.addSource('historical-landmarks', {
            'type': 'geojson',
            'data': landmarkData
        });
        
        map.current.addLayer({
            'id': 'historical-landmarks',
            'type': 'symbol',
            'source': 'historical-landmarks',
            'maxzoom': 24,
            'minzoom': 5,
            'layout': {
                'icon-image': 'monument', // Changed to monument icon for historical landmarks
                'icon-size': 1.2,
                'text-field': [
                    'format',
                    ['upcase', ['get', 'FacilityName']],
                    {'font-scale': 0.8},
                    '\n',
                ],
                'text-font': ['Noto Sans Regular'],
                'text-offset': [0, 0.6],
                'text-anchor': 'top'
            }
        });
        
        // We'll use a fixed panel instead of a popup
        
        // Add click event to show landmark panel with information
        map.current.on('click', 'historical-landmarks', (e) => {
            if (!e.features || e.features.length === 0) return;
            
            const feature = e.features[0];
            // Fix TypeScript error by properly typing the geometry
            const coordinates = (feature.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
            const title = feature.properties.title;
            const role = feature.properties.role;
            const description = feature.properties.description;
            const date = feature.properties.date;
            const images = feature.properties.images;
            
            // Update state to show the landmark panel
            setActiveLandmark({
                title,
                role,
                description,
                date,
                coordinates,
                images
            });
            
            setIsPanelOpen(true);
        });
        
        // Change cursor to pointer when hovering over landmarks
        map.current.on('mouseenter', 'historical-landmarks', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
        });
        
        map.current.on('mouseleave', 'historical-landmarks', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
        });

      map.current.addLayer({
        id: 'historical-labels',
        type: 'symbol',
        source: sourceId,
        maxzoom: 6,
        layout: {
          'text-field': ['get', 'NAME'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 14,
          'text-variable-anchor': ['center'],
          'text-ignore-placement': false,
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#000000',
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });
    }
  };

  // Function to close the landmark panel
  const closeLandmarkPanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <div ref={mapContainer} className="map-container" />
      
      {/* Loading spinner */}
      {isMapLoading && <LoadingSpinner />}
      
      {/* Landmark Panel as a separate component */}
      <LandmarkPanel 
        isOpen={isPanelOpen}
        onClose={closeLandmarkPanel}
        landmark={activeLandmark}
      />
      
      {/* Timeline is deactivated when panel is open */}
        <Timeline
          currentYear={currentYear}
          years={availableYears}
          onYearChange={setCurrentYear}
          disable={isPanelOpen || isMapLoading}
        />
        
    </>
  );
}

export default App;
