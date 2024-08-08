import { SyntaxKind } from 'typescript';
import { ReplaceContext } from '../ReplaceContext';
import {
  I18nFormatter,
  FormatOptions,
  FormatReturnType,
} from './I18nFormatter';
import hookEntryFileTemplate from './defaultEntryTemplate';
import path from 'path';

export default class DefaultI18nFormatter extends I18nFormatter {
  protected override doEntryFile(
    localeFiles: string[],
    defaultLocale: string
  ): string {
    return hookEntryFileTemplate(localeFiles, defaultLocale);
  }

  protected override doRenderJsxText(
    options: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    const {
      params,
      defaultMessage,
      info: { i18nReplacer },
    } = options;
    if (i18nReplacer.opt.global) {
      const globalRendered = this.renderGlobal(options, intlId);
      if (!globalRendered) {
        return null;
      }
      globalRendered.newText = '{' + globalRendered?.newText + '}';
      return globalRendered;
    }
    const paramString = this.paramsString(params);
    const newText = `
      <FormattedMessage
        id="${intlId}"
        defaultMessage="${defaultMessage}"
        ${paramString ? `values={${paramString}}` : ''}
      />
    `;
    return {
      newText,
      dependencies: {
        moduleName: 'react-intl',
        names: ['FormattedMessage'],
      },
    };
  }

  protected override doRenderTemplateString(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    return this.doRender(opt, intlId);
  }

  private renderGlobal(
    { params, defaultMessage, info: { i18nReplacer, fileName } }: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    const newText = this.intlApiExpression(
      intlId,
      defaultMessage,
      `i18n.intl`,
      params
    );
    const localeDist = path.resolve(
      i18nReplacer.opt.distLocaleDir,
      'index.tsx'
    );
    const src = i18nReplacer.opt.outputToNewDir
      ? path.join(i18nReplacer.opt.outputToNewDir, path.basename(fileName))
      : fileName;

    let relativePath = path
      .relative(src, localeDist)
      .replace(/\\/g, '/')
      .replace(/^\.\.\//, '');

    if (!relativePath.startsWith('.')) {
      relativePath = './' + relativePath;
    }

    return {
      newText: newText,
      dependencies: {
        moduleName: relativePath,
        names: ['i18n'],
      },
    };
  }

  private doRender(opt: FormatOptions, intlId: string) {
    const {
      params,
      defaultMessage,
      info,
      info: { i18nReplacer },
    } = opt;
    if (i18nReplacer.opt.global) {
      return this.renderGlobal(opt, intlId);
    }

    const parentFunctionInfo = I18nFormatter.getIfInFunctionBody(opt.node)!;

    const { functionName, functionBody } = parentFunctionInfo;
    // in function body, but not a react component(we guess through component name)
    // so we use global api replace
    if (!DefaultI18nFormatter.reactComponentNameReg.test(functionName)) {
      return this.renderGlobal(opt, intlId);
    }
    // we assume it was in react component, first check if already has
    // hook declare
    const hookDeclareExpression = functionBody
      .getText()
      .match(/(?:(?:const)|(?:var)|(?:let)) ([\S]+)\s*=\s*(\w+\.)?useIntl()/);
    const returnValue = (intlObj: string) => {
      return {
        newText: this.intlApiExpression(
          intlId,
          defaultMessage,
          intlObj,
          params
        ),
        dependencies: {
          moduleName: 'react-intl',
          names: ['useIntl'],
        },
      };
    };
    // we have hook, so just replace text
    if (hookDeclareExpression != null) {
      return returnValue(hookDeclareExpression[1]);
    }

    const intlObj = 'intl';
    const contextToAdd: ReplaceContext[] = [];
    // do not have hook, so insert to ParenthesizedExpression,
    // replace start `(` and end `)` with `{` and `}` with some expression
    if (functionBody.kind === SyntaxKind.ParenthesizedExpression) {
      contextToAdd.push(
        new ReplaceContext({
          start: functionBody.getStart(),
          end: functionBody.getChildren()[1].getStart(),
          info,
          newText: `{\nconst ${intlObj} = useIntl(); \n return `,
        })
      );
      contextToAdd.push(
        new ReplaceContext({
          start: functionBody.getChildren()[2].getStart(),
          end: functionBody.getChildren()[2].getEnd(),
          info,
          newText: `}`,
        })
      );
    } else {
      const start = functionBody.getStart() + 1;
      contextToAdd.push(
        new ReplaceContext({
          start,
          end: start,
          info,
          newText: `\nconst ${intlObj} = useIntl(); \n`,
        })
      );
    }

    // check if same scope local has already add
    contextToAdd.forEach((add) => {
      if (
        info.globalContext.some(
          (c) => c.start === add.start && c.end === add.end
        )
      ) {
        return;
      }
      info.globalContext.push(add);
    });

    return returnValue(intlObj);
  }

  protected override doRenderStringLike(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    return this.doRender(opt, intlId);
  }

  private static reactComponentNameReg = /^[A-Z]/;
}
