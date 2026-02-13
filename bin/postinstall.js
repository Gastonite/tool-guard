#!/usr/bin/env node

/**
 * Post-install script
 *
 * Prints setup instructions after npm/pnpm install.
 * Uses JetBrains Dark Theme colors.
 */

// JetBrains Dark Theme palette
const reset = '\x1b[0m'
const bold = '\x1b[1m'

const orange = '\x1b[38;2;204;120;50m' // #CC7832 - keywords
const green = '\x1b[38;2;106;135;89m' // #6A8759 - strings
const gold = '\x1b[38;2;232;191;106m' // #E8BF6A - functions
const purple = '\x1b[38;2;152;118;170m' // #9876AA - properties
const gray = '\x1b[38;2;128;128;128m' // #808080 - comments
const blueGray = '\x1b[38;2;169;183;198m' // #A9B7C6 - punctuation
const blue = '\x1b[38;2;104;151;187m' // #6897BB - numbers

const bgDark = '\x1b[48;2;38;38;38m' // #262626 - background

// Syntax highlighting
const kw = text => `${orange}${text}${reset}${bgDark}`
const str = text => `${green}${text}${reset}${bgDark}`
const fn = text => `${gold}${text}${reset}${bgDark}`
const prop = text => `${purple}${text}${reset}${bgDark}`
const p = text => `${blueGray}${text}${reset}${bgDark}`

// Strip ANSI codes to get visible length
// eslint-disable-next-line no-control-regex
const visibleLength = s => s.replace(/\x1b\[[0-9;]*m/g, '').length

// Code block with background - all lines same width
const codeBlock = (lines, width = 60) => {

  const padded = lines.map(line => {

    const visible = visibleLength(line)
    const padding = Math.max(0, width - visible)

    return `${bgDark} ${line}${' '.repeat(padding)} ${reset}`
  })

  return padded.join('\n')
}

const tsConfig = codeBlock([
  `${kw('import')} ${p('{')}`,
  `  ${fn('BashToolGuard')}${p(',')}`,
  `  ${fn('ReadToolGuard')}${p(',')}`,
  `  ${fn('WriteToolGuard')}${p(',')}`,
  `${p('}')} ${kw('from')} ${str(`'claude-guard'`)}`,
  ``,
  `${kw('export default')} ${p('{')}`,
  `  ${prop('Bash')}${p(':')} ${fn('BashToolGuard')}${p('([')}${str(`'git *'`)}${p(',')} ${str(`'pnpm *'`)}${p(']),')}`,
  `  ${prop('Read')}${p(':')} ${fn('ReadToolGuard')}${p('({')}`,
  `    ${prop('allow')}${p(':')} ${p('[')}${str(`'*'`)}${p('],')}`,
  `    ${prop('deny')}${p(':')} ${p('[')}${str(`'*.env'`)}${p(',')} ${str(`'~/.ssh/*'`)}${p('],')}`,
  `  ${p('}),')}`,
  `  ${prop('Write')}${p(':')} ${fn('WriteToolGuard')}${p('([')}${str(`'*.ts'`)}${p(',')} ${str(`'*.json'`)}${p(']),')}`,
  `${p('}')}`,
])

const jsonConfig = codeBlock([
  `${p('{')}`,
  `  ${prop('"hooks"')}${p(':')} ${p('{')}`,
  `    ${prop('"PreToolUse"')}${p(':')} ${p('[{')}`,
  `      ${prop('"matcher"')}${p(':')} ${str('".*"')}${p(',')}`,
  `      ${prop('"hooks"')}${p(':')} ${p('[{')}`,
  `        ${prop('"type"')}${p(':')} ${str('"command"')}${p(',')}`,
  `        ${prop('"command"')}${p(':')} ${str('"pnpm exec claude-guard"')}`,
  `      ${p('}]')}`,
  `    ${p('}]')}`,
  `  ${p('}')}`,
  `${p('}')}`,
])

console.log(`
${bold}${blueGray}claude-guard${reset} installed successfully!

${bold}${blue}Setup${reset}

${gold}1.${reset} Create ${orange}.claude/guard.config.ts${reset}

${tsConfig}

${gold}2.${reset} Add hook to ${orange}.claude/settings.local.json${reset}

${jsonConfig}

${bold}${blue}Features${reset}

  ${green}•${reset} Deny-by-default: tools not in config are blocked
  ${green}•${reset} Glob patterns: ${gray}'git *', '*.ts', 'src/**/*.json'${reset}
  ${green}•${reset} SAFE_* placeholders: ${gray}'git checkout SAFE_BRANCH'${reset}
  ${green}•${reset} Custom validators: ${gray}validate: path => ...${reset}

${gray}Docs: https://github.com/anthropics/claude-guard${reset}
`)
