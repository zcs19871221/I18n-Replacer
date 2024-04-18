import { ImportDeclaration, Node } from 'typescript';

import { ReplaceContext } from './ReplaceContext';
import { I18nReplacer } from '..';
import { AddImportNameContext } from './AddImportNameContext';
import { NewImportContext } from './NewImportContext';

export class FileContext extends ReplaceContext {
  public readonly file: string;
  public readonly fileLocate: string;
  public readonly i18nReplacer: I18nReplacer;

  private requiredImports: {
    [module: string]: {
      moduleName: string;
      names: Set<string>;
    };
  } = {};

  private importNodes: ImportDeclaration[] = [];

  constructor({
    node,
    file,
    fileLocate,
    i18nReplacer,
  }: {
    node: Node;
    file: string;
    fileLocate: string;
    i18nReplacer: I18nReplacer;
  }) {
    super({
      node,
      start: 0,
      end: file.length,
    });
    this.file = file;
    this.fileLocate = fileLocate;
    this.i18nReplacer = i18nReplacer;
  }

  protected override generatingMessageFromChildrenThenSet(): void {
    this.children = this.children.filter((c) => c.needReplace);
    if (this.children.length === 0) {
      this.content = '';
      return;
    }

    this.content = this.joinChildren(0, 0);
  }

  public addRequiredImports(moduleName: string, names: string | string[]) {
    this.requiredImports[moduleName] ??= {
      moduleName,
      names: new Set(),
    };
    if (typeof names === 'string') {
      this.requiredImports[moduleName].names.add(names);
    } else {
      names.forEach((name) => {
        this.requiredImports[moduleName].names.add(name);
      });
    }
  }

  public addImportNode(importNode: ImportDeclaration) {
    this.importNodes.push(importNode);
  }

  protected override afterChildrenMessageGenerated() {
    this.addRequiredImportsIfMissing();
  }

  private addRequiredImportsIfMissing() {
    const newImports: { moduleName: string; names: Set<string> }[] = [];
    Object.values(this.requiredImports).forEach(({ moduleName, names }) => {
      const foundNode = this.importNodes.find((importNode) =>
        importNode.moduleSpecifier.getText().includes(moduleName)
      );
      if (!foundNode) {
        newImports.push({ moduleName, names });
      } else {
        const addImportNameContext = new AddImportNameContext(
          this.fileContext,
          names,
          foundNode
        );
        addImportNameContext.generateMessage();
        this.children.push(addImportNameContext);
      }
    });
    if (newImports.length > 0) {
      const newImportContext = new NewImportContext(this, newImports);
      newImportContext.generateMessage();
      this.children.push(newImportContext);
    }
  }
}
