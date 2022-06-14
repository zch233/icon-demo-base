import { series, parallel, src, dest } from 'gulp'; // series 是依次执行，parallel是并行执行
import del from 'del';
import { generalConfig, remainFillConfig, colorfulConfig } from './plugins/svgo/presets';
import { generateIcons } from './utils/generateIcons';
import { generateEntry } from './utils/generateEntry';
import { adjustViewBox, assignAttrsAtTag, setDefaultColorAtPathTag } from './plugins/svg2Definition/transforms';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { getIdentifier, upperFirst } from './utils';
import { IconDefinition, ThemeType, ThemeTypeUpperCase } from './templates/types';
import { ExtractRegExp, generateInline } from './utils/generateInline';
import { twotoneStringify } from './plugins/svg2Definition/stringify';
import { TransformFactory } from './plugins/svg2Definition';
import { OptimizeOptions } from 'svgo';

export interface ThemeMapType {
    theme: ThemeType;
    themeSuffix?: string;
    stringify?: (value: any) => string;
    extraNodeTransformFactories?: TransformFactory;
    svgoConfig?: OptimizeOptions;
}

const themesMap: ThemeMapType[] = [
    { theme: 'filled' },
    { theme: 'outlined' },
    {
        theme: 'twotone',
        themeSuffix: 'twoTone',
        stringify: twotoneStringify,
        extraNodeTransformFactories: setDefaultColorAtPathTag('#333'),
        svgoConfig: remainFillConfig,
    },
    { theme: 'color', svgoConfig: colorfulConfig },
];

const iconTemplate = readFileSync(resolve(__dirname, './templates/icon.ts.ejs'), 'utf8');

exports.default = series(
    function clean() {
        return del(['src', 'inline-svg', 'es', 'lib']);
    },
    parallel(
        function CopyFiles() {
            return src(['templates/*.ts']).pipe(dest('src')); // from 'templates/*.ts' toDir 'src'
        },
        ...themesMap.map(({ theme, themeSuffix, stringify, extraNodeTransformFactories, svgoConfig }) =>
            generateIcons({
                theme,
                from: [`svg/${theme}/*.svg`],
                toDir: 'src/asn',
                svgoConfig: svgoConfig || generalConfig,
                extraNodeTransformFactories: [assignAttrsAtTag('svg', { focusable: 'false' }), adjustViewBox].concat(extraNodeTransformFactories || []),
                stringify: stringify || JSON.stringify,
                template: iconTemplate,
                mapToInterpolate: ({ name, content }) => ({
                    identifier: getIdentifier({ name, themeSuffix: (themeSuffix || upperFirst(theme)) as ThemeTypeUpperCase }),
                    content,
                }),
                filename: ({ name }) => getIdentifier({ name, themeSuffix: (themeSuffix || upperFirst(theme)) as ThemeTypeUpperCase }),
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
    ),
    // generate inline SVG files
    generateInline({
        from: ['src/asn/*.ts'],
        toDir: ({ _meta }) => `inline-svg/${_meta && _meta.theme}`,
        getIconDefinitionFromSource: (content: string): IconDefinition => {
            const extract = ExtractRegExp.exec(content);
            if (extract === null || !extract[1]) {
                throw new Error('Failed to parse raw icon definition: ' + content);
            }
            return new Function(`return ${extract[1]}`)() as IconDefinition;
        },
    }),
    // generate inline SVG files with namespace
    generateInline({
        from: ['src/asn/*.ts'],
        toDir: ({ _meta }) => `inline-namespaced-svg/${_meta && _meta.theme}`,
        getIconDefinitionFromSource: (content: string): IconDefinition => {
            const extract = ExtractRegExp.exec(content);
            if (extract === null || !extract[1]) {
                throw new Error('Failed to parse raw icon definition: ' + content);
            }
            return new Function(`return ${extract[1]}`)() as IconDefinition;
        },
        renderOptions: {
            extraSVGAttrs: { xmlns: 'http://www.w3.org/2000/svg' },
        },
    })
);
