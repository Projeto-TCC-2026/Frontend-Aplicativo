import { readFile } from 'node:fs/promises';
import ts from 'typescript';

const secureStoreMock = new URL('./secure-token-store-mock.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier === './secure-token-store' && context.parentURL?.endsWith('/src/infrastructure/api/api-client.ts')) {
    return { url: secureStoreMock, shortCircuit: true };
  }

  if (specifier.startsWith('.') && !/\.[^/]+$/.test(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      // Fall through to Node's regular resolution for non-TypeScript modules.
    }
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.ts') && !url.includes('/node_modules/')) {
    const source = await readFile(new URL(url), 'utf8');
    return {
      format: 'module',
      source: ts.transpile(source, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }),
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
