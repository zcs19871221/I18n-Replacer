import { SyntaxKind } from 'typescript';
import {
  HandlerOption,
  TsNodeHandler,
  traverseChildren,
} from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class JsxExpressionHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return SyntaxKind.JsxExpression === node.kind;
  }

  handle({ node, info, tsNodeHandlers }: HandlerOption): ReplaceContext {
    const jsxExpression = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });
    traverseChildren({
      node,
      parentContext: jsxExpression,
      info,
      tsNodeHandlers,
    });

    jsxExpression.newText = jsxExpression.joinChildren();
    return jsxExpression;
  }
}
