import { Node, forEachChild, createSourceFile } from 'typescript';
import { ImportDeclaration, SyntaxKind } from 'typescript';
import { BundleReplacer } from './BundleReplacer';
import { Opt } from './types';
import { Context } from './Context';
import { RootContext } from './RootContext';
import { TemplateExpressionHandler, TemplateHandler } from './Template';
import { StringLikeNodesHandler } from './StringLiteralContext';
import { JsxExpressionHandler, JsxHandler as JsxLikeNodesHandler } from './Jsx';

interface Warning {
  start: number;
  end: number;
  text: string;
}

class ImportHandler implements NodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.ImportDeclaration;
  }

  handle(node: Node, replacer: FileReplacer): void {
    const importNode = node as ImportDeclaration;
    if (
      importNode.moduleSpecifier.getText().includes(replacer.opt.importPath) &&
      importNode.importClause
        ?.getText()
        .includes(replacer.bundleReplacer.exportName)
    ) {
      replacer.hasImportedI18nModules = true;
    }
  }
}

class IdentifierHandler implements NodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.Identifier;
  }

  handle(node: Node, replacer: FileReplacer): void {
    if (
      replacer.opt.localeToReplace !== 'en-us' &&
      replacer.includesTargetLocale(node.getText()) &&
      !replacer.ignore(node)
    ) {
      replacer.addWarningInfo({
        text: 'property name of object should be english',
        start: node.getStart(),
        end: node.getEnd(),
      });
    }
  }
}
export interface NodeHandler {
  match(node: Node, replacer: FileReplacer, parentContext?: Context): boolean;
  handle(node: Node, replacer: FileReplacer, parentContext?: Context): void;
}

export class FileReplacer {
  public static ignoreWarningKey = '@ignore';

  public rootContext: RootContext;
  public hasImportedI18nModules: boolean = false;

  constructor(
    private readonly fileLocate: string,
    public readonly bundleReplacer: BundleReplacer,
    public readonly opt: Opt,
    file: string
  ) {
    const node = createSourceFile(this.fileLocate, file, opt.tsTarget, true);

    this.rootContext = new RootContext({
      node,
      replacer: this,
      start: 0,
      end: file.length,
    });
    this.rootContext.str = file;
  }

  private property = 'intl';

  public createIntlExpressionFromIntlId(
    intlId: string,
    param?: Record<string, string>
  ) {
    let paramsString = '';
    if (param && Object.keys(param).length > 0) {
      paramsString += ',';
      paramsString +=
        Object.entries<string>(param).reduce((text: string, [key, value]) => {
          if (key === value) {
            return text + key + ',';
          } else {
            return text + `${key}: ${value === '' ? "''" : value}` + ',';
          }
        }, '{') + '}';
    }
    return `${this.bundleReplacer.exportName}.${this.property}.formatMessage({id: '${intlId}'}${paramsString})`;
  }

  public createImportStatement() {
    return `import { ${this.bundleReplacer.exportName} } from '${this.opt.importPath}';\n`;
  }

  public getOrCreateIntlId(localeText: string) {
    localeText = localeText.replace(/\n/g, '\\n');
    let intlId = '';
    const localeTextMappingKey = this.bundleReplacer.localeTextMappingKey;
    if (localeTextMappingKey[localeText]) {
      intlId = localeTextMappingKey[localeText];
    } else {
      do {
        intlId = `key${String(this.bundleReplacer.key++).padStart(4, '0')}`;
      } while (Object.values(localeTextMappingKey).includes(intlId));
      localeTextMappingKey[localeText] = intlId;
    }

    return intlId;
  }

  public createIntlExpressionFromStr({
    str,
    params,
  }: {
    str: string;
    params?: Record<string, string>;
  }) {
    const intl = this.getOrCreateIntlId(str);

    return this.createIntlExpressionFromIntlId(intl, params);
  }

  public replace() {
    try {
      this.rootContext.doHandle();
      if (this.rootContext.str && !this.hasImportedI18nModules) {
        const tsNocheckMatched = this.rootContext.str.match(
          /(\n|^)\/\/\s*@ts-nocheck[^\n]*\n/
        );
        const insertIndex =
          tsNocheckMatched === null
            ? 0
            : (tsNocheckMatched.index ?? 0) + tsNocheckMatched[0].length;
        this.rootContext.str =
          this.rootContext.str.slice(0, insertIndex) +
          this.createImportStatement() +
          this.rootContext.str.slice(insertIndex);
      }
      return this.rootContext.str;
    } catch (error: any) {
      if (error.message) {
        error.message = '@ ' + this.fileLocate + ' ' + error.message;
      }
      console.error(error);
    } finally {
      this.rootContext.clear();
    }
  }

  private nodeHandlers: NodeHandler[] = [
    new StringLikeNodesHandler(),
    new TemplateHandler(),
    new TemplateExpressionHandler(),
    new ImportHandler(),
    new IdentifierHandler(),
    new JsxLikeNodesHandler(),
    new JsxExpressionHandler(),
  ];

  public traverse(node: Node, parentContext?: Context) {
    const targetHandler = this.nodeHandlers.filter((nodehHandler) =>
      nodehHandler.match(node, this, parentContext)
    );
    if (targetHandler.length > 1) {
      throw new Error('matched more then 1 ');
    }
    if (targetHandler.length === 1) {
      targetHandler[0].handle(node, this, parentContext);
    } else {
      forEachChild(node, (n) => this.traverse(n, parentContext));
    }
  }

  public ignore(node: Node) {
    return node.getFullText().includes(FileReplacer.ignoreWarningKey);
  }

  public addWarningInfo({ start, end, text }: Warning) {
    this.bundleReplacer.warnings.add(
      text +
        '\nfile at: ' +
        this.fileLocate +
        '\ntext: ' +
        this.rootContext.str.slice(Math.max(0, start - 3), start) +
        '【' +
        this.rootContext.str.slice(start, end) +
        '】' +
        this.rootContext.str.slice(end + 1, end + 4) +
        '\n'
    );
  }

  public includesTargetLocale(text: string) {
    return /[\u4e00-\u9fa5]+/g.test(text);
  }
}
