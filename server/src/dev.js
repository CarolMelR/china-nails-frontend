import { spawn } from 'node:child_process'

const processes = [
  {
    name: 'API',
    child: spawn(process.execPath, ['--watch', 'server/src/index.js'], {
      stdio: 'inherit',
    }),
  },
  {
    name: 'Web',
    child: spawn(process.execPath, ['node_modules/vite/bin/vite.js'], {
      stdio: 'inherit',
    }),
  },
]

let stopping = false
let remaining = processes.length
let exitCode = 0

const stop = (code) => {
  if (stopping) {
    return
  }

  stopping = true
  exitCode = code
  for (const { child } of processes) {
    if (child.exitCode === null) {
      child.kill()
    }
  }
}

for (const { name, child } of processes) {
  child.once('error', (error) => {
    console.error(`No se pudo iniciar ${name}:`, error)
    stop(1)
  })

  child.once('exit', (code, signal) => {
    remaining -= 1
    if (!stopping) {
      console.error(`${name} se detuvo${signal ? ` (${signal})` : ''}.`)
      stop(code ?? 1)
    }
    if (remaining === 0) {
      process.exit(exitCode)
    }
  })
}

process.once('SIGINT', () => stop(0))
process.once('SIGTERM', () => stop(0))
