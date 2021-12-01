import { bootstrap } from '@appsemble/preact';
import { useState } from 'preact/hooks';

bootstrap(({ events, parameters: { fields } }) => {
  const [data, setData] = useState<any[]>(null);
  const [error, setError] = useState(false);

  events.on.data((newData: any[], eventError) => {
    setData(newData);
    setError(Boolean(eventError));
  });

  if (error) {
    return <p>Error loading data.</p>;
  }

  if (!data) {
    return <p>Loading…</p>;
  }

  if (!data.length) {
    return <p>No data to display.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          {fields.map((field) => (
            <th key={field}>{field}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item, dataIndex) => (
          <tr key={item.id || dataIndex}>
            {fields.map((field) => (
              <td key={field}>{item[field]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});
