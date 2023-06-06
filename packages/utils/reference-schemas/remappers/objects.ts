import { type OpenAPIV3 } from 'openapi-types';

export const objectRemappers: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject> = {
  'object.assign': {
    additionalProperties: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `

Let’s say you have an existing object that you want to add an additional value on top of. For this
you can use the \`object.assign\` remapper. The remapper takes an existing object and allows the user
to assign their own value on top of that.

Input:

\`\`\`json
{
  "title": "Weekly fishing 21"
}
\`\`\`

\`\`\`yaml
object.assign:
  author: John Doe
\`\`\`

Result:

\`\`\`json
{
  "title": "Weekly fishing 21",
  "author": "John Doe"
}
\`\`\`

`,
  },
  'object.from': {
    additionalProperties: {
      $ref: '#/components/schemas/RemapperDefinition',
    },
    description: `

With this remapper you can create an entirely new object based on input values and other remappers.
\`object.from\` itself accepts remapper functions as its input which allows you to chain multiple
remappers together to make complex objects.

As a base, the remapper looks like this:

\`\`\`yaml
object.from:
  username: Chris Taub
  email: example@hotmail.com
\`\`\`

\`\`\`json
{
  "username": "Chris Taub",
  "email": "example@hotmail.com"
}
\`\`\`

Most of the time you won’t create an object just to store one value. Luckily, this is where the
chaining of remappers comes in. You can create an object that contains an \`object.from\` remapper
which then allows more inputs:

\`\`\`yaml
object.from:
  username: Chris Taub
  email: example@hotmail.com
  addresses:
    object.from:
      work:
        object.from:
          city: Eindhoven
          address: Nachtegaallaan 15
      home:
        object.from:
          city: Amsterdam
          address: Amstel 1
\`\`\`

\`\`\`json
{
  "username": "Chris Taub",
  "email": "example@hotmail.com",
  "addresses": {
    "work": {
      "city": "Eindhoven",
      "address": "Nachtegaallaan 15"
    },
    "home": {
      "city": "Amsterdam",
      "address": "Amstel 1"
    }
  }
}
\`\`\`

`,
  },
  'object.omit': {
    type: 'array',
    items: {
      minItems: 1,
      anyOf: [
        { type: 'string' },
        {
          type: 'array',
          minItems: 2,
          items: {
            type: 'string',
          },
        },
      ],
    },
    description: `

In contrary to the previous remapper, what if you have an object from which you want to remove a
value? Then you can use \`object.omit\`. The remapper can remove properties from an existing object
based on the given object keys. This includes nested properties.

Input:

\`\`\`json
{
  "title": "Weekly fishing 21",
  "author": "John Doe",
  "content": {
    "introduction": "This is the introduction for the new weekly fishing issue",
    "paragraph1": "...",
    "interview": "..."
  }
}
\`\`\`

\`\`\`yaml
object.omit:
  - author
  - - content
    - interview
\`\`\`

Result:

\`\`\`json
{
  "title": "Weekly fishing 21",
  "content": {
    "introduction": "This is the introduction for the new weekly fishing issue",
    "paragraph1": "..."
  }
}
\`\`\`

`,
  },
};
