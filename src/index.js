require('dotenv').config()

const Discord = require('discord.js')
const safeEval = require('safe-eval')
const client = new Discord.Client()

const pkg = require('../package.json')

const codeRegex = /(?:```(?:(?:js)|(?:javascript))\n+)|`([.\s\S<>!@]+)``?`?/

client.on('ready', async () => {
  console.log(`[Client] ready as ${client.user.username}!`)
  client.user.setActivity('jseval')
})

client.on('message', (msg) => {
  if (msg.content === 'jseval help' || msg.content === 'jseval') {
    msg.reply(
      '```js\n' +
        'const me = {\n' +
        '  name: "JSEval",\n' +
        `  version: "v${pkg.version}",\n` +
        '  hobby: "execute some javascript code"\n' +
        '}' +
        '```'
    )

    return
  }

  if (msg.author.bot || !msg.content.startsWith('jseval')) return

  console.log('[Client] messaged!')

  const code = msg.content.match(codeRegex, '$1')
  if (!code) return

  try {
    const result = safeEval(code[1], {
      msg
    })
    msg.reply('```js\n' + result + '\n```')
  } catch (err) {
    msg.reply('```excel\n' + 'ERR! ' + err.message + '\n```')
  }
})

function trim(str) {
  return str.replace(/\n\s{2,}/g, '\n')
}

client.login(process.env.TOKEN)
console.log('[Client] logged in!')
