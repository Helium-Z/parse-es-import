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

type ExportInfo = {
  type: string;
  id: string;
  init: string;
};

function parse(
  content: string,
  options: Options = {
    ecmaVersion: 2021,
    sourceType: 'module',
  }
) {
  const importList: ImportInfo[] = [];
  const exportList: ExportInfo[] = [];
  const { body } = JSXParser.parse(content, options) as any;

  if (Array.isArray(body)) {
    body.forEach((node) => {
      if (node.type === 'ImportDeclaration') {
        const { specifiers, source } = node;
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
              default:
                break;
            }
          });
        } else {
          item.sideEffectOnly = true;
        }

        importList.push(item);
      }

      if (node.type === 'ExportNamedDeclaration') {
        node.declaration.declarations.forEach(({ type, id, init }) => {
          exportList.push({
            type,
            id: id.name,
            init: content.slice(init.start, init.end),
          });
        });
      }
    });
  }

  return {
    imports: importList,
    exports: exportList,
  };
}

export default parse;
