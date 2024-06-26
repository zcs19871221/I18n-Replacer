import { SyntaxKind } from 'typescript';
import { ReplaceContext } from './ReplaceContext';

export class StringLiteralContext extends ReplaceContext {
  private removeTextVariableSymbol(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  protected override joinChildrenMessage(): void {
    const originStr = this.removeTextVariableSymbol(this.node!.getText());

    let newText = this.i18nReplacer.i18nFormatter.format(this, {
      defaultMessage: originStr,
      originStr: this.node!.getText(),
    });

    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }

    this.content = newText;
  }
}
