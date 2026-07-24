import { access, readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const publicRoot = join(root, 'public')
const catalogPath = join(publicRoot, 'unity', 'catalog.json')
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))

if (catalog.protocolVersion !== 1 || typeof catalog.builds !== 'object') {
  throw new Error('Unity catalog must use protocolVersion 1 and declare builds.')
}

const enabledBuilds = Object.entries(catalog.builds).filter(([, build]) => build.enabled)
if (enabledBuilds.length === 0) {
  throw new Error('Unity catalog has no enabled builds.')
}

for (const [buildKey, build] of enabledBuilds) {
  const relativeLaunch = build.launchUrl.replace(/^\.\//, '')
  const indexPath = join(publicRoot, relativeLaunch)
  const buildRoot = join(indexPath, '..', 'Build')
  const html = await readFile(indexPath, 'utf8')

  if (!html.includes('window.unityInstance = unityInstance;')) {
    throw new Error(`${buildKey}: generated player does not expose window.unityInstance.`)
  }
  if (!html.includes('window.FatalZeroDeliverMissionContext?.();')) {
    throw new Error(`${buildKey}: generated player does not deliver the queued mission context.`)
  }

  const requiredFiles = [
    [`${buildKey}.loader.js`, 1_000],
    [`${buildKey}.framework.js`, 100_000],
    [`${buildKey}.data`, 100_000],
    [`${buildKey}.wasm`, 1_000_000],
  ]

  for (const [fileName, minimumBytes] of requiredFiles) {
    const filePath = join(buildRoot, fileName)
    await access(filePath)
    const file = await stat(filePath)
    if (file.size < minimumBytes) {
      throw new Error(`${buildKey}: ${fileName} is unexpectedly small (${file.size} bytes).`)
    }
  }

  console.log(`OK ${buildKey}: ${build.label}`)
}

console.log(`Validated ${enabledBuilds.length} enabled Unity WebGL builds.`)
