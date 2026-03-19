import { promises as fs } from 'fs'
import * as path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import type { Compiler } from 'webpack'

class HtmlWebpackEnhancementPlugin {
  apply(compiler: Compiler) {
    compiler.hooks.assetEmitted.tapPromise(
      'HtmlWebpackEnhancementPlugin',
      async (name, { source }) => {
        if (name.endsWith('.twig')) {
          const filePath = path.resolve(
            process.cwd(),
            'resources',
            'views',
            'assets',
            name,
          )

          await fs.writeFile(filePath, source.source())
        }
      },
    )

    compiler.hooks.compilation.tap(
      'HtmlWebpackEnhancementPlugin',
      (compilation) => {
        const hooks = HtmlWebpackPlugin.getHooks(compilation)

        hooks.alterAssetTags.tap('HtmlWebpackEnhancementPlugin', (data) => {
          data.assetTags.scripts = data.assetTags.scripts.map((tag) => {
            tag.attributes.crossorigin = 'anonymous'
            return tag
          })
          data.assetTags.styles = data.assetTags.styles.map((tag) => {
            tag.attributes.crossorigin = 'anonymous'
            return tag
          })

          return data
        })

        hooks.afterTemplateExecution.tap(
          'HtmlWebpackEnhancementPlugin',
          (data) => {
            if (compilation.compiler.options.mode === 'production') {
              const styles = data.headTags.filter(
                (tag) => tag.tagName === 'link' && tag.attributes.rel === 'stylesheet'
              );
              const scripts = data.headTags.filter(
                (tag) => tag.tagName === 'script'
              );

              data.headTags = styles;
              data.bodyTags = [...data.bodyTags, ...scripts];
            }

            return data
          },
        )
      },
    )
  }
}

export default HtmlWebpackEnhancementPlugin
