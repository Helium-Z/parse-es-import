"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const acorn_1 = require("acorn");
const acorn_jsx_1 = __importDefault(require("acorn-jsx"));
const JSXParser = acorn_1.Parser.extend((0, acorn_jsx_1.default)());
function collectIdentifiersFromObject(node, result = []) {
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
            }
        }
    });
    return result;
}
function parse(content, options = {
    ecmaVersion: 2021,
    sourceType: 'module',
}) {
    const importList = [];
    const exportList = [];
    const { body } = JSXParser.parse(content, options);
    if (Array.isArray(body)) {
        body.forEach((node) => {
            var _a;
            if (node.type === 'ImportDeclaration') {
                const { specifiers, source } = node;
                const item = {
                    moduleName: source.value,
                    starImport: '',
                    defaultImport: '',
                    namedImports: [],
                    sideEffectOnly: false,
                    startIndex: node.start,
                    endIndex: node.end,
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
                }
                else {
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
                                        startIndex: node.start,
                                        endIndex: node.end,
                                    });
                                }
                            });
                            break;
                        case 'FunctionDeclaration':
                            if ((_a = declaration.id) === null || _a === void 0 ? void 0 : _a.name) {
                                exportList.push({
                                    type: declaration.type,
                                    moduleName: declaration.id.name,
                                    value: content.slice(declaration.start, declaration.end),
                                    startIndex: node.start,
                                    endIndex: node.end,
                                });
                            }
                            break;
                        default:
                            break;
                    }
                }
                else if (specifiers.length && source) {
                    specifiers.forEach(({ type, exported }) => {
                        if (exported.name) {
                            exportList.push({
                                type,
                                moduleName: exported.name,
                                value: source.value,
                                startIndex: node.start,
                                endIndex: node.end,
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
exports.default = parse;
