import { Parser, Options } from 'acorn';
import acornJSX from 'acorn-jsx';

const JSXParser = Parser.extend(acornJSX());

type ImportInfo = {
  moduleName: string;
  starImport: string;
  defaultImport: string;
  namedImports: Array<{
    name: string;
    alias: string;
  }>;
  sideEffectOnly: boolean;
};

function parse(
  content: string,
  options: Options = {
    ecmaVersion: 2021,
    sourceType: 'module',
  }
) {
  const result = [];
  const { body } = JSXParser.parse(content, options) as any;

  if (Array.isArray(body)) {
    body.forEach(({ type, specifiers, source }) => {
      if (type === 'ImportDeclaration') {
        const item: ImportInfo = {
          moduleName: source.value,
          starImport: '',
          defaultImport: '',
          namedImports: [],
          sideEffectOnly: false,
        };

        if (Array.isArray(specifiers) && specifiers.length) {
          specifiers.forEach(({ type, local, imported }) => {
            switch (type) {
              case 'ImportNamespaceSpecifier':
                item.starImport = local && local.name;
                break;
              case 'ImportDefaultSpecifier':
                item.defaultImport = local && local.name;
                break;
              case 'ImportSpecifier':
                item.namedImports.push({
                  name: imported && imported.name,
                  alias: local && local.name,
                });
                break;
            }
          });
        } else {
          item.sideEffectOnly = true;
        }

        result.push(item);
      }
    });
  }

  return result;
}

export default parse;
