import { series, parallel, src, dest } from 'gulp'; // series 是依次执行，parallel是并行执行
import del from 'del';
import { generalConfig } from './plugins/svgo/presets';
import { generateIcons } from './utils/generateIcons';
import { generateEntry } from './utils/generateEntry';
import { adjustViewBox, assignAttrsAtTag } from './plugins/svg2Definition/transforms';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getIdentifier, upperFirst } from './utils';
import { ThemeType, ThemeTypeUpperCase } from './templates/types';

const themes: ThemeType[] = ['filled', 'outlined', 'twotone', 'color'];

const iconTemplate = readFileSync(resolve(__dirname, './templates/icon.ts.ejs'), 'utf8');

exports.default = series(
    function clean() {
        return del(['src', 'inline-svg', 'es', 'lib']);
    },
    parallel(
        function CopyFiles() {
            return src(['templates/*.ts']).pipe(dest('src')); // from 'templates/*.ts' toDir 'src'
        },
        ...themes.map(theme =>
            generateIcons({
                theme,
                from: [`svg/${theme}/*.svg`],
                toDir: 'src/asn',
                svgoConfig: generalConfig,
                extraNodeTransformFactories: [assignAttrsAtTag('svg', { focusable: 'false' }), adjustViewBox],
                stringify: JSON.stringify,
                template: iconTemplate,
                mapToInterpolate: ({ name, content }) => ({
                    identifier: getIdentifier({ name, themeSuffix: upperFirst(theme) as ThemeTypeUpperCase }),
                    content,
                }),
                filename: ({ name }) => getIdentifier({ name, themeSuffix: upperFirst(theme) as ThemeTypeUpperCase }),
            })
        )
    ),
    parallel(
        // generate entry file: src/index.ts
        generateEntry({
            entryName: 'index.ts',
            from: ['src/asn/*.ts'],
            toDir: 'src',
            banner: '// This index.ts file is generated automatically.\n',
            template: `export { default as <%= identifier %> } from '<%= path %>';`,
            mapToInterpolate: ({ name: identifier }) => ({
                identifier,
                path: `./asn/${identifier}`,
            }),
        })
    )
);
