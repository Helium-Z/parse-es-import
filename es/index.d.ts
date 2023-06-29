import { Options } from 'acorn';
type ImportInfo = {
    moduleName: string;
    starImport: string;
    defaultImport: string;
    namedImports: Array<{
        name: string;
        alias: string;
    }>;
    sideEffectOnly: boolean;
    startIndex: number;
    endIndex: number;
};
type ExportInfo = {
    type: 'VariableDeclaration' | 'FunctionDeclaration' | 'ExportSpecifier';
    moduleName: string;
    value: string;
    identifiers?: string[];
    startIndex: number;
    endIndex: number;
};
declare function parse(content: string, options?: Options): {
    imports: ImportInfo[];
    exports: ExportInfo[];
};
export default parse;
