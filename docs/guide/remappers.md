---
name: Remappers
route: /guide/remappers
---

# Remappers

Remapper functions are objects that define how a value should be transformed. This can be useful for
various purposes, such as retrieving properties from data structures, transforming data, and
formatting text. Remappers consist of an array of remapper objects. Each object has one key, which
represents the remapper function. The value represents parameters to customize the behavior of the
remapper.

For example, given the following remapper:

```yaml
- prop: firstName
- string.case: upper
```

And given the following data:

```json
{
  "firstName": "Patrick",
  "lastName": "Start"
}
```

This will result in the following data:

```json
"PATRICK"
```

This data can be used for example to render a value in `detail-viewer`.

## String Remapper

If remapper is a string instead of an array of objects, this static string will always be returned
as the result.

## Remapper Functions

The following remapper functions are available:

### `object.from`

Create a new object given some predefined mapper keys.

#### Parameters

A key / value pair object keys and remappers.

### `prop`

Get a property from an object.

#### Parameters

The name of the property to get.

### `string.case`

Convert an input to lower or upper case.

#### Parameters

Either `upper` or `lower`.

### `string.format`

Format a string using remapped input variables.

#### Parameters

| Name       | Description                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `template` | The template string to format. This may use the [ICU message format](http://userguide.icu-project.org/formatparse/messages) synax. |
| `values`   | A set of remappers to convert the input to usable values.                                                                          |
