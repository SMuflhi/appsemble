import { BootstrapParams } from '@appsemble/sdk';
import { Icon, LatLngBounds, LayerGroup, Map, Marker } from 'leaflet';

import iconUrl from '../../../themes/amsterdam/core/marker.svg';
import { LatLngMapper } from './createGetters';

const MARKER_ICON_WIDTH = 39;
const MARKER_ICON_HEIGHT = 39;
const ACTIVE_MARKER_ICON_WIDTH = 64;
const ACTIVE_MARKER_ICON_HEIGHT = 64;

export function makeFilter(fields: [string, string], bounds: LatLngBounds): string {
  const [lon, lat] = fields;
  const east = bounds.getEast();
  const north = bounds.getNorth();
  const south = bounds.getSouth();
  const west = bounds.getWest();

  return `${lat} gt ${west} and ${lat} lt ${east} and ${lon} gt ${south} and ${lon} lt ${north}`;
}

interface BlockMarker {
  id: number;
}

export default function loadMarkers(
  markers: BlockMarker[],
  fetched: Set<number>,
  get: LatLngMapper,
  data: any,
  actions: BootstrapParams['actions'],
  target: LayerGroup | Map,
): void {
  if (!Array.isArray(markers)) {
    return;
  }
  markers.forEach(marker => {
    if (fetched.has(marker.id)) {
      return;
    }
    fetched.add(marker.id);
    const lat = get.lat(marker);
    const lng = get.lng(marker);
    if (Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
      return;
    }
    const m = new Marker([lat, lng], {
      icon:
        data && data.id === marker.id
          ? new Icon({
              iconUrl,
              iconSize: [ACTIVE_MARKER_ICON_WIDTH, ACTIVE_MARKER_ICON_HEIGHT],
              iconAnchor: [ACTIVE_MARKER_ICON_WIDTH / 2, ACTIVE_MARKER_ICON_HEIGHT],
            })
          : new Icon({
              iconUrl,
              iconSize: [MARKER_ICON_WIDTH, MARKER_ICON_HEIGHT],
              iconAnchor: [MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT],
            }),
    });
    m.on('click', actions.onMarkerClick.dispatch.bind(null, marker));
    target.addLayer(m);
  });
}
