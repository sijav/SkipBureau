import { Kind, print } from 'graphql'
import { setTimeout as sleep } from 'node:timers/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

/**
 * SB-295: the API has to answer every query this build asks, before the site ships.
 *
 * The deploy builds the web against the live API, and a push that adds a field
 * reaches Pages before Northflank has finished rolling the API out, or reaches it
 * when Northflank skipped the push because a build was already running. Both leave
 * the API serving yesterday's schema to today's site, and the two halves fail
 * differently: `collect` in src/core/prerender throws, the prerender burns its
 * patience and ships with every address falling back to 404.html on a warning,
 * while ReaderDetails and GuideAnswers, which the prerender never asks, break in
 * the reader's browser after a green deploy.
 *
 * So this asks the live API to validate the whole client contract before anything
 * is built, and fails the job rather than warning.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const endpoint = process.env.VITE_GRAPHQL_URL || process.env.GRAPHQL_URL
// The same rollout the prerender waits on (SB-136), so the two do not hold
// different opinions about how long one takes.
const patience = Number(process.env.PRERENDER_PATIENCE_SECONDS ?? 600) * 1000
const pause = 15_000

// This card's own proof: appends an operation asking for a field no schema has,
// so the real script can be watched failing against the real API rather than a mock.
const planted = process.env.SKIPBUREAU_PLANT_BAD_FIELD ? 'query __Planted { __typename fieldNoSchemaHas }' : ''

// Only this one runs. Validation covers the whole document, execution covers the
// operation named here, which is why the mutation below can be checked without
// ever writing a proposal row into the live database.
const probeName = '__Probe'
const probe = `query ${probeName} { __typename }`

const reason = (error) => (error instanceof Error ? error.message : String(error))
const die = (why) => {
  console.log(`::error::validate-documents: ${why}`)
  // Not process.exit: on Windows, exiting immediately after a fetch trips a libuv
  // assertion and leaves 127 behind, which reads as a missing command.
  process.exitCode = 1
}

/**
 * Every operation the app can send, read from the module that defines them.
 *
 * Not from generated/gql.ts, whose `Documents` type carries the same strings as
 * keys: that would make a deploy gate depend on the internal output shape of a
 * codegen preset. documents.ts is the canonical module.
 *
 * Anything this cannot account for is a failure, never a skip. A validator that
 * quietly checks less than it believes it does is worse than no validator.
 */
const operationsIn = async (server) => {
  const module = await server.ssrLoadModule('/src/core/graphql/documents.ts')
  const exported = Object.entries(module)
  if (exported.length < 2) throw new Error(`documents.ts exported ${exported.length} things, which cannot be the whole client contract`)

  const byName = new Map()
  for (const [name, document] of exported) {
    if (!document || document.kind !== Kind.DOCUMENT) throw new Error(`export ${name} is not a GraphQL document, so this check cannot say what it covers`)
    for (const definition of document.definitions) {
      if (definition.kind !== Kind.OPERATION_DEFINITION)
        throw new Error(`export ${name} holds a ${definition.kind}, which this check does not know how to concatenate safely`)
      if (!definition.name) throw new Error(`export ${name} holds an anonymous operation, which cannot be told apart once concatenated`)
      const operation = definition.name.value
      const already = byName.get(operation)
      if (already) throw new Error(`${already} and ${name} both define the operation ${operation}, and one document cannot hold two`)
      byName.set(operation, name)
    }
    if (byName.has(probeName)) throw new Error(`an operation is already called ${probeName}, which this check needs for itself`)
  }
  return { names: [...byName.keys()], text: exported.map(([, document]) => print(document)) }
}

/**
 * What the API's answer means. Three outcomes, deliberately not the same one.
 *
 * The body is read before the status is judged, and that order is the whole
 * point. A document the schema cannot answer comes back as HTTP 400 carrying
 * GRAPHQL_VALIDATION_FAILED, so a check that classifies on `response.ok` first
 * calls the one failure it exists to catch a transport blip, retries it for ten
 * minutes, and then reports that the API did not answer without ever naming the
 * field. This was written that way first and the planted proof caught it.
 */
const judge = async (response) => {
  let body
  try {
    body = await response.json()
  } catch {
    body = undefined
  }

  const mismatch = body?.errors?.filter((error) => error?.extensions?.code === 'GRAPHQL_VALIDATION_FAILED') ?? []
  if (mismatch.length) return { stale: mismatch.map((error) => error.message).join('; ') }

  // A configuration error does not heal by waiting ten minutes for it.
  if ([401, 403, 404].includes(response.status))
    return { settled: `the API answered ${response.status}, which is an address or access problem rather than a rollout in progress` }

  if (body?.data?.__typename === 'Query') return { ok: true }
  if (body?.errors?.length) return { settled: `the API answered with errors this check does not recognise: ${JSON.stringify(body.errors).slice(0, 400)}` }
  if (!response.ok) return { again: `the API answered ${response.status}` }
  return { settled: `the API answered a shape this check does not recognise: ${JSON.stringify(body).slice(0, 400)}` }
}

const run = async (server) => {
  const { names, text } = await operationsIn(server)
  console.log(`validate-documents: ${names.length} operations against ${endpoint}`)
  console.log(`  ${names.join(', ')}`)
  if (planted) console.log('validate-documents: a bad field is planted on purpose, so this run is expected to fail')

  const document = [...text, planted, probe].filter(Boolean).join('\n\n')
  const body = JSON.stringify({ query: document, operationName: probeName, variables: {} })
  const deadline = Date.now() + patience

  for (let attempt = 1; ; attempt += 1) {
    let verdict
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body })
      verdict = await judge(response)
    } catch (error) {
      // The first connect to an external host drops on some machines and then
      // works, so one blip must never read as a broken deploy.
      verdict = { again: reason(error) }
    }

    if (verdict.ok) return console.log(`validate-documents: the API answers every operation this build asks (attempt ${attempt})`)
    if (verdict.settled) return die(verdict.settled)

    const why = verdict.stale ?? verdict.again
    const waiting = verdict.stale ? 'the API does not serve this schema yet' : 'the API did not answer'
    if (Date.now() + pause > deadline) return die(`${waiting} after ${patience / 1000}s: ${why}`)
    console.log(`validate-documents: attempt ${attempt}, ${waiting} (${why}), again in ${pause / 1000}s`)
    await sleep(pause)
  }
}

if (!endpoint) {
  die('neither VITE_GRAPHQL_URL nor GRAPHQL_URL is set, so there is no API to ask')
} else {
  const server = await createServer({
    root,
    logLevel: 'warn',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    // A cache of its own, as the prerender has: this server's empty dependency
    // list written into the shared node_modules/.vite is the prime suspect for
    // the Storybook tests that then hung on a CommonJS package served unbundled.
    optimizeDeps: { noDiscovery: true, include: [] },
    cacheDir: 'node_modules/.vite-documents',
  })
  try {
    await run(server)
  } catch (error) {
    die(reason(error))
  } finally {
    await server.close()
  }
}
