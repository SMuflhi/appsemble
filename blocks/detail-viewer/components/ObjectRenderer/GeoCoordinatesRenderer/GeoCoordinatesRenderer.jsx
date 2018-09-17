import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Point } from 'leaflet/src/geometry';
import { Icon, Marker, TileLayer } from 'leaflet/src/layer';
import { Map } from 'leaflet/src/map';
import { CircleMarker } from 'leaflet/src/layer/vector';
import React from 'react';

import styles from './GeoCoordinatesRenderer.css';


const MARKER_ICON_WIDTH = 25;
const MARKER_ICON_HEIGHT = 41;


/**
 * An map for an object type schema which implements GeoCoordinates.
 *
 * https://schema.org/GeoCoordinates
 */
export default class GeoCoordinatesRenderer extends React.Component {
  static propTypes = {
    reactRoot: PropTypes.instanceOf(HTMLElement).isRequired,
    /**
     * The current value.
     */
    value: PropTypes.shape(),
  };

  static defaultProps = {
    value: {},
  };

  ref = React.createRef();

  locationMarker = new CircleMarker(null, {
    // eslint-disable-next-line react/destructuring-assignment
    color: getComputedStyle(this.props.reactRoot).getPropertyValue('--primary-color'),
  });

  componentDidMount() {
    const {
      value,
    } = this.props;

    const map = new Map(this.ref.current, { attributionControl: false })
      .on('locationfound', ({ latlng }) => {
        this.locationMarker.setLatLng(latlng).addTo(map);
      })
      .locate()
      .setView([value.latitude, value.longitude], 16);
    new TileLayer('http://c.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png').addTo(map);
    new Marker(null, {
      icon: new Icon({
        iconUrl,
        iconRetinaUrl,
        iconAnchor: new Point(MARKER_ICON_WIDTH / 2, MARKER_ICON_HEIGHT),
        shadowUrl,
      }),
    }).setLatLng([value.latitude, value.longitude]).addTo(map);
  }

  render() {
    return (
      <div className={styles.root} ref={this.ref} />
    );
  }
}
