import { ReplaceContext } from './ReplaceContext';

export class JsxExpressionContext extends ReplaceContext {
  protected override generatingMessageFromChildrenThenSet() {
    this.replacedText = this.joinChildren(0, 0);
  }

  public includeJsx = false;
}
