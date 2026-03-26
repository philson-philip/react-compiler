import prettier from 'prettier/standalone';
import babelPlugin from 'prettier/plugins/babel';
import estreePlugin from 'prettier/plugins/estree';
import htmlPlugin from 'prettier/plugins/html';
import postcssPlugin from 'prettier/plugins/postcss';
import typescriptPlugin from 'prettier/plugins/typescript';

function getPrettierParser(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'css') return 'css';
  if (ext === 'html') return 'html';
  if (ext === 'json') return 'json';
  if (ext === 'ts' || ext === 'tsx') return 'typescript';
  return 'babel';
}

export async function formatCode(filename, code) {
  try {
    return await prettier.format(code, {
      parser: getPrettierParser(filename),
      plugins: [babelPlugin, estreePlugin, htmlPlugin, postcssPlugin, typescriptPlugin],
      tabWidth: 2,
      useTabs: false,
      semi: true,
      singleQuote: true,
    });
  } catch {
    return code;
  }
}
