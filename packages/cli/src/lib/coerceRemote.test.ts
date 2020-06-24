import coerceRemote from './coerceRemote';

const tests = {
  'http://appsemble.app': 'http://appsemble.app/',
  'http://appsemble.app:80': 'http://appsemble.app/',
  'https://appsemble.app': 'https://appsemble.app/',
  'https://appsemble.app:443': 'https://appsemble.app/',
  'https://appsemble.app:1337': 'https://appsemble.app:1337/',
  'https://appsemble.app/pathname': 'https://appsemble.app/',
  'https://appsemble.app?query=param': 'https://appsemble.app/',
  'https://appsemble.app#hash': 'https://appsemble.app/',
  'appsemble.app': 'https://appsemble.app/',
  'https://localhost': 'https://localhost/',
  'https://127.0.0.1': 'https://127.0.0.1/',
  'foo.localhost': 'http://foo.localhost/',
  localhost: 'http://localhost/',
  '127.0.0.1': 'http://127.0.0.1/',
  'localhost:1337': 'http://localhost:1337/',
  '127.0.0.1:1337': 'http://127.0.0.1:1337/',
};

it.each(Object.entries(tests))('should convert %s to %s', async (input, expected) => {
  const output = coerceRemote(input);
  expect(output).toBe(expected);
});
