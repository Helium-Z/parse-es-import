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
  type: 'VariableDeclaration' | 'FunctionDeclaration' | 'ExportSpecifier';
  moduleName: string;
  value: string;
  identifiers?: string[];
};

function collectIdentifiersFromObject(node, result = []): string[] {
  node.properties.forEach((property) => {
    // { ...A }
    if (property.type === 'SpreadElement') {
      result.push(property.argument.name);
    }

    // { B: _B, C: { _C: _C } }
    if (property.type === 'Property') {
      const valueNode = property.value;
      if (valueNode.type === 'Identifier') {
        result.push(valueNode.name);
      }

      if (valueNode.type === 'ObjectExpression') {
        collectIdentifiersFromObject(valueNode, result);
        return;
      }
    }
  });

  return result;
}

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
        const { declaration, specifiers, source } = node;
        if (declaration) {
          switch (declaration.type) {
            case 'VariableDeclaration':
              declaration.declarations.forEach(({ id, init }) => {
                if (id && init) {
                  let identifiers = [];

                  if (init.type === 'Identifier') {
                    identifiers.push(init.name);
                  }

                  if (init.type === 'ObjectExpression') {
                    identifiers = identifiers.concat(collectIdentifiersFromObject(init));
                  }

                  exportList.push({
                    type: declaration.type,
                    moduleName: id.name,
                    value: content.slice(init.start, init.end),
                    identifiers,
                  });
                }
              });
              break;

            case 'FunctionDeclaration':
              if (declaration.id?.name) {
                exportList.push({
                  type: declaration.type,
                  moduleName: declaration.id.name,
                  value: content.slice(declaration.start, declaration.end),
                });
              }
              break;

            default:
              break;
          }
        } else if (specifiers.length && source) {
          specifiers.forEach(({ type, exported }) => {
            if (exported.name) {
              exportList.push({
                type,
                moduleName: exported.name,
                value: source.value,
              });
            }
          });
        }
      }
    });
  }

  return {
    imports: importList,
    exports: exportList,
  };
}

export default parse;
