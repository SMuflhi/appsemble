import type { Remapper } from '@appsemble/types';

import remap from './remap';

interface TestCase {
  description: string;
  input: any;
  mappers: Remapper;
  expected: any;
}

const cases: TestCase[] = [
  // Raw string
  {
    description: 'return a literal string',
    input: 'Whatever',
    mappers: 'raw string',
    expected: 'raw string',
  },

  // Mapper object.from
  {
    description: 'create a new object from remappers',
    input: { givenName: 'Patrick', familyName: 'Star', species: 'Starfish' },
    mappers: [
      { 'object.from': { firstName: [{ prop: 'givenName' }], lastName: [{ prop: 'familyName' }] } },
    ],
    expected: { firstName: 'Patrick', lastName: 'Star' },
  },

  // Mapper prop
  {
    description: 'get a simple property',
    input: { name: 'Spongebob' },
    mappers: [{ prop: 'name' }],
    expected: 'Spongebob',
  },
  {
    description: 'get a nested property',
    input: { address: { town: 'Bikini Bottom' } },
    mappers: [{ prop: 'address.town' }],
    expected: 'Bikini Bottom',
  },

  // Mapper string.case
  {
    description: 'convert a string to upper case',
    input: 'I’m a Goofy Goober',
    mappers: [{ 'string.case': 'upper' }],
    expected: 'I’M A GOOFY GOOBER',
  },
  {
    description: 'convert a string to lower case',
    input: 'We’re all Goofy Goobers',
    mappers: [{ 'string.case': 'lower' }],
    expected: 'we’re all goofy goobers',
  },

  // Mapper string.format
  {
    description: 'format a template string',
    input: { name: 'Krusty Krab', food: 'krabby patties' },
    mappers: [
      {
        'string.format': {
          template: 'The {restaurant} serves {highlight}',
          values: { restaurant: [{ prop: 'name' }], highlight: [{ prop: 'food' }] },
        },
      },
    ],
    expected: 'The Krusty Krab serves krabby patties',
  },
  {
    description: 'escape formatting double curly brackets',
    input: { food: 'krabby patty' },
    mappers: [
      {
        'string.format': {
          template: "A {burger} can be ressembled in ascii using: '{{I}}'",
          values: { burger: [{ prop: 'food' }] },
        },
      },
    ],
    expected: 'A krabby patty can be ressembled in ascii using: {{I}}',
  },
  {
    description: 'format unknown values to empty strings',
    input: {},
    mappers: [{ 'string.format': { template: '‘{value}’ is unknown', values: {} } }],
    expected:
      'The intl string context variable "value" was not provided to the string "‘{value}’ is unknown"',
  },
  {
    description: 'format dates it parsed',
    input: { date: '1970-01-01T00:00:00.000Z' },
    mappers: [
      {
        'string.format': {
          template: 'Date’s year: {year, date, :: yyyy}',
          values: { year: [{ prop: 'date' }, { 'date.parse': "yyyy-MM-dd'T'HH:mm:ss.SSSX" }] },
        },
      },
    ],
    expected: 'Date’s year: 1970',
  },
  {
    description: 'return a static value',
    input: null,
    mappers: [{ static: 'Hello world' }],
    expected: 'Hello world',
  },
];

const tests = cases.map(
  ({ description, expected, input, mappers }) => [description, mappers, input, expected] as const,
);

it.each(tests)('should %s given %j', (_, mappers, input, expected) => {
  const result = remap(mappers, input);
  expect(result).toStrictEqual(expected);
});
