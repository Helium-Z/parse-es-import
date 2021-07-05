# parse-es-import

Inspired by [parse-static-imports](https://www.npmjs.com/package/parse-static-imports),
and have the same return result as it, and can run both on browser/node sides because it is based on [acron](https://www.npmjs.com/package/acorn).

Will properly parse:

- Default import. e.g. `import utils from 'utils';`
- Star imports. e.g. `import * as utils from 'utils';`
- Named imports. e.g. `import { Foo as MyFoo } from 'utils';`
- Side effect only imports, e.g. `import './App.css';`
- Multi-line imports, like

  ```jsx
  import React, { useState, useCallback, useEffect } from 'react';
  ```

## Installation

```sh
npm install --save parse-es-import
```

## Usage

```js
import fs from 'fs';
import parse from 'parse-es-import';

const file = fs.readFileSync('./path/to/file.js', 'utf8');
const results = parse(file);

console.log(JSON.stringify(results, null, 2));
```

### API

* `content`: `String` - Contents of code to parse.
* `options`: `Object` - Receive all parameters of [`acorn.parse`](https://github.com/acornjs/acorn/tree/master/acorn#interface). Its default value is `{ ecmaVersion: 2021, sourceType: 'module' }`.

### Returns

| Attribute      | Type       | Default Value | Description                                                             |
| -------------- | ---------- | ------------- | ----------------------------------------------------------------------- |
| moduleName     | `String`   | `''`          | The name of the module imported or a relative path (e.g. `'react-dom'`) |
| starImport     | `String`   | `''`          | The name of the star imported module object, if present                 |
| namedImports   | `Object[]` | `[]`          | List of named imports as a list of objects                              |
| defaultImport  | `String`   | `''`          | The name of the default import, if present                              |
| sideEffectOnly | `Boolean`  | false         | If the import was side-effect only (e.g. `import './App.css';`)         |

Named import objects have the form:

| Attribute | Type     | Default Value | Description                                                                                                                                                                      |
| --------- | -------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name      | `String` | `''`          | The name of the named import (e.g. `{ useState }`)                                                                                                                               |
| alias     | `String` | name          | Will be the alias of a named import if aliased, otherwise defaults to the named import (e.g. `import { foo /* the named import */ as bar /* the alias */ } from 'module-name';`) |

## Example

Content to parse:

```jsx
import React from 'react';
import antd, { Button as AntButton, Alert } from 'antd';
import * as Hello from 'hello';

import 'xx.less';

export default () => {
  return <div>Hello World...</div>;
};
```

The parse result will be:

```json
[
  {
    "defaultImport": "React",
    "moduleName": "react",
    "namedImports": [],
    "sideEffectOnly": false,
    "starImport": ""
  },
  {
    "defaultImport": "antd",
    "moduleName": "antd",
    "namedImports": [
      {
        "alias": "AntButton",
        "name": "Button"
      },
      {
        "alias": "Alert",
        "name": "Alert"
      }
    ],
    "sideEffectOnly": false,
    "starImport": ""
  },
  {
    "defaultImport": "",
    "moduleName": "hello",
    "namedImports": [],
    "sideEffectOnly": false,
    "starImport": "Hello"
  },
  {
    "defaultImport": "",
    "moduleName": "xx.less",
    "namedImports": [],
    "sideEffectOnly": true,
    "starImport": ""
  }
]
```
