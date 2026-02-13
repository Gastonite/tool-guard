import stylistic from '@stylistic/eslint-plugin'
import { type Rule } from 'eslint'
import { type ConfigWithExtends } from 'typescript-eslint'



const noPropertyValueNewlineRule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    docs: {
      description: 'Disallow property values on a new line after the colon',
    },
    messages: {
      noNewline: 'Property value must be on the same line as the colon.',
    },
    fixable: 'whitespace',
    schema: [],
  },
  create(context) {

    const sourceCode = context.sourceCode

    return {
      Property(node) {

        const colonToken = sourceCode.getTokenAfter(
          node.key,
          token => token.value === ':',
        )

        if (!colonToken)
          return

        const firstTokenAfterColon = sourceCode.getTokenAfter(colonToken)

        if (!firstTokenAfterColon)
          return

        if (firstTokenAfterColon.loc.start.line > colonToken.loc.end.line) {

          context.report({
            node,
            messageId: 'noNewline',
            fix(fixer) {

              return fixer.replaceTextRange(
                [colonToken.range[1], firstTokenAfterColon.range[0]],
                ' ',
              )
            },
          })
        }
      },
    }
  },
}



export const stylisticEslintConfig: Array<ConfigWithExtends> = [
  // Stylistic (extends configs.all + custom rules)
  stylistic.configs.all,
  stylistic.configs['disable-legacy'],
  {
    files: ['**/*.{js,jsx,ts,tsx,cjs,mjs}'],
    plugins: {
      stylistic,
    },
    rules: {
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'as-needed'],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
        catch: 'always',
      }],
      '@stylistic/quotes': ['error', 'single', { allowTemplateLiterals: 'always' }],
      '@stylistic/indent': ['error', 2, {
        SwitchCase: 1,
        ignoredNodes: [
          'TemplateLiteral *',
          'JSXAttribute[name.name="className"] TemplateLiteral *',
        ],
      }],
      '@stylistic/function-call-argument-newline': ['error', 'consistent'],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: {
          delimiter: 'none',
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
        multilineDetection: 'brackets',
      }],
      '@stylistic/quote-props': ['error', 'as-needed', { numbers: true }],
      '@stylistic/jsx-indent-props': ['error', {
        indentMode: 2,
        ignoreTernaryOperator: false,
      }],
      '@stylistic/jsx-closing-bracket-location': ['error'],
      '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
      '@stylistic/jsx-newline': ['error', {
        prevent: true,
        allowMultilines: true,
      }],
      '@stylistic/jsx-child-element-spacing': 'off',
      // Deprecated: use perfectionist/sort-jsx-props instead
      '@stylistic/jsx-sort-props': 'off',
      '@stylistic/jsx-one-expression-per-line': ['error', { allow: 'literal' }],
      '@stylistic/jsx-max-props-per-line': ['error', {
        when: 'multiline',
        maximum: 1,
      }],
      '@stylistic/jsx-wrap-multilines': ['error', {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
        condition: 'parens-new-line',
        logical: 'parens-new-line',
        prop: 'parens-new-line',
      }],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/no-extra-parens': 'off',
      '@stylistic/operator-linebreak': ['error', 'none', {
        overrides: {
          // '=': 'after',
          '&': 'before',
          '|': 'before',
          '?': 'ignore',
          ':': 'ignore',
          '&&': 'ignore',
          '||': 'ignore',
          '??': 'ignore',
        },
      }],
      '@stylistic/object-property-newline': ['error', {
        allowAllPropertiesOnSameLine: true,
      }],
      '@stylistic/array-bracket-newline': ['error', 'consistent'],
      '@stylistic/array-element-newline': ['error', {
        ArrayExpression: 'consistent',
      }],
      '@stylistic/comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
        importAttributes: 'always-multiline',
        dynamicImports: 'always-multiline',
        enums: 'always-multiline',
        generics: 'always-multiline',
        tuples: 'always-multiline',
      }],
      '@stylistic/nonblock-statement-body-position': ['error', 'below'],
      '@stylistic/newline-per-chained-call': 'off',
      '@stylistic/multiline-comment-style': 'off',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/padded-blocks': ['error', 'start'],
      '@stylistic/function-paren-newline': ['error', 'multiline-arguments'],
      '@stylistic/no-multiple-empty-lines': ['error', {
        max: 3,
        maxEOF: 0,
      }],
      '@stylistic/no-trailing-spaces': ['error', {
        skipBlankLines: false,
        ignoreComments: true,
      }],
      '@stylistic/key-spacing': ['error', {
        beforeColon: false,
        afterColon: true,
        mode: 'strict',
      }],
    },
  },
  {
    plugins: {
      custom: { rules: { 'no-property-value-newline': noPropertyValueNewlineRule } },
    },
    rules: {
      'custom/no-property-value-newline': 'error',
    },
  },
]
