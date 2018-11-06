import '@fortawesome/fontawesome-free/css/all.css';

import axios from 'axios';
import React from 'react';

function chunkArray(items, size) {
  const results = [];

  while (items.length) {
    results.push(items.splice(0, size));
  }

  return results;
}

export default class AppList extends React.Component {
  state = {
    apps: [],
  };

  async componentDidMount() {
    const { data: apps } = await axios.get(`/api/apps/`);

    this.setState({ apps });
  }

  render() {
    const { apps } = this.state;
    if (!apps) {
      return <p>Loading...</p>;
    }

    if (!apps.length) {
      return <p>No apps!</p>;
    }

    const appTiles = apps.map(app => (
      <div key={app.id} className="tile is-parent is-4">
        <div className="card is-child tile">
          <header className="card-header">
            <p className="card-header-title">{app.name}</p>
          </header>
          <div className="card-content">
            <div className="content has-text-centered is-centered">
              <figure className="image is-64x64">
                <img alt="Logo" src={`/${app.id}/icon-64.png`} style={{ margin: '0 auto' }} />
              </figure>
            </div>
          </div>
          <footer className="card-footer">
            <a className="card-footer-item" href={`/${app.path}`}>
              View
            </a>
            <a className="card-footer-item" href={`/editor/${app.id}`}>
              Edit
            </a>
          </footer>
        </div>
      </div>
    ));

    const chunkTiles = chunkArray(appTiles, 3).map(chunk => (
      <div key={`chunk-${chunk[0].name}`} className="tile is-ancestor">
        {chunk}
      </div>
    ));

    return <div className="is-half">{chunkTiles}</div>;
  }
}
