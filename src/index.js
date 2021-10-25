require('dotenv').config()

const ts = require('typescript')
const cs = require('coffeescript')

const fetch = require('node-fetch')

const Discord = require('discord.js')
const {VM} = require('vm2')
const client = new Discord.Client()

const pkg = require('../package.json')

const codeRegex = {
  inline: /`([.\s\S<>!@]+)`/,
  js: /(?:```(?:js)|(?:javascript))\n+([.\s\S<>!@]+)```/,
  ts: /(?:```(?:ts)|(?:typescript))\n+([.\s\S<>!@]+)```/,
  cs: /(?:```(?:cs)|(?:coffeescript))\n+([.\s\S<>!@]+)```/
}

const executeAction = {
  inline: async (code, sandbox) => {
    return await execute(code, sandbox)
  },

  js: async (code, sandbox) => {
    return await execute(code, sandbox)
  },

  ts: async (code, sandbox) => {
    let jsCode

    try {
      jsCode = ts.transpile(code, {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.ES2020,
        strict: true,
        alwaysStrict: true
      })
    } catch (err) {
      return `COMPILE ERR! ${err.message}`
    }

    return await execute(jsCode, sandbox)
  },

  cs: async (code, sandbox) => {
    let jsCode

    try {
      jsCode = cs.compile(code)
    } catch (err) {
      return `COMPILE ERR! ${err.message}`
    }

    return await execute(jsCode, sandbox)
  }
}

client.on('ready', () => {
  console.log(`[Client] ready as ${client.user.username}!`)
  client.user.setActivity('jsexec')
})

client.on('message', async (msg) => {
  if (msg.content === 'jsexec help' || msg.content === 'jsexec') {
    msg.reply(
      '```js\n' +
        'const me = {\n' +
        '  name: "JSExec",\n' +
        `  version: "v${pkg.version}",\n` +
        '  hobby: "execute some code",\n' +
        '  repo: "https://github.com/KucingKode/jsexec",\n' +
        '  languages: [\n' +
        '    "javascript",\n' +
        '    "typescript",\n' +
        '    "coffeescript",\n' +
        '  ]\n' +
        '}' +
        '```'
    )

    return
  }

  if (msg.author.bot || !msg.content.startsWith('jsexec')) return

  console.log('[Client] messaged!')

  const type = getScriptType(msg.content)
  if (!type || !codeRegex[type]) return

  let match = msg.content.match(codeRegex[type], '$1')

  if (match && match[1]) return msg.reply(await executeAction[type](match[1], {msg}))
})

client.login(process.env.TOKEN)
console.log('[Client] logged in!')

async function execute(code, sandbox) {
  const logs = []

  const vmConsole = {
    log: (...newLog) => {
      logs.push(
        newLog
          .map((log) => {
            if (typeof log === 'object') {
              return JSON.stringify(log)
            }

            return log
          })
          .join(' ')
      )
    }
  }

  const vmAlert = (alert) => {
    vmConsole.log('------\n' + alert + '\n------')
  }

  const vm = new VM({
    timeout: 5000,
    sandbox: {
      ...sandbox,
      console: vmConsole,
      fetch: fetch,
      alert: vmAlert,
      Promise
    }
  })

  try {
    await vm.run(code)

    if (logs.length === 0) logs.push(' ')

    return '```js\n' + logs.join('\n') + '\n```'
  } catch (err) {
    return '```excel\n' + err.message + '\n```'
  }
}

function getScriptType(msg) {
  if (msg.indexOf('```js') > -1) return 'js'
  if (msg.indexOf('```javascript') > -1) return 'js'
  if (msg.indexOf('```ts') > -1) return 'ts'
  if (msg.indexOf('```typescript') > -1) return 'ts'
  if (msg.indexOf('```cs') > -1) return 'cs'
  if (msg.indexOf('```coffeescript') > -1) return 'cs'

  return 'inline'
}
