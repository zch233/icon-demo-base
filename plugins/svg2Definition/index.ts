import { createTrasformStream } from '../creator';
import { ThemeType, AbstractNode } from '../../templates/types';
import parseXML, { XmlElement } from '@rgrove/parse-xml';

export interface AbstractNodeDefinition {
    name: string;
    theme: ThemeType;
    icon: AbstractNode;
}

export interface StringifyFn {
    (icon: AbstractNodeDefinition): string;
}

export interface SVG2DefinitionOptions {
    theme: ThemeType;
    extraNodeTransformFactories: TransformFactory[];
    stringify?: StringifyFn;
}

export interface XML2AbstractNodeOptions extends SVG2DefinitionOptions {
    name: string;
}

export type TransformOptions = Pick<XML2AbstractNodeOptions, 'name' | 'theme'>;

export interface TransformFactory {
    (options: TransformOptions): (asn: AbstractNode) => AbstractNode;
}

// SVG => IconDefinition
export const svg2Definition = ({ theme, extraNodeTransformFactories, stringify }: SVG2DefinitionOptions) =>
    createTrasformStream((SVGString, { stem: name }) => {
        // 0. The SVG string is like that:
        // <svg viewBox="0 0 1024 1024"><path d="..."/></svg>
        const svgXMLData = parseXML(SVGString);
        // 1. The parsed XML root node is with the JSON shape:
        // {
        //   "type": "document",
        //   "children": [
        //     {
        //       "type": "element",
        //       "name": "svg",
        //       "attributes": { "viewBox": "0 0 1024 1024" },
        //       "children": [
        //         {
        //           "type": "element",
        //           "name": "path",
        //           "attributes": {
        //             "d": "..."
        //           },
        //           "children": []
        //         }
        //       ]
        //     }
        //   ]
        // }

        const svgData = svgXMLData.children?.[0] || {};
        // @todo: "defaultTo" is not the best way to deal with the type Maybe<Element>
        // 2. The element node is with the JSON shape:
        // {
        //   "type": "element",
        //   "name": "svg",
        //   "attributes": { "viewBox": "0 0 1024 1024" },
        //   "children": [
        //     {
        //       "type": "element",
        //       "name": "path",
        //       "attributes": {
        //         "d": "..."
        //       },
        //       "children": []
        //     }
        //   ]
        // }

        const abstractNode = element2AbstractNode({
            name,
            theme,
            extraNodeTransformFactories,
            // @ts-ignore
        })(svgData);
        // 3. The abstract node is with the JSON shape:
        // {
        //   "tag": "svg",
        //   "attrs": { "viewBox": "0 0 1024 1024", "focusable": "false" },
        //   "children": [
        //     {
        //       "tag": "path",
        //       "attrs": {
        //         "d": "..."
        //       }
        //     }
        //   ]
        // }

        return (stringify || JSON.stringify)({
            icon: abstractNode,
            name,
            theme,
        });
    });

function element2AbstractNode({ name, theme, extraNodeTransformFactories }: XML2AbstractNodeOptions) {
    return ({ name: tag, attributes, children }: XmlElement): AbstractNode => {
        const data = {
            tag,
            attrs: { ...attributes },
            children: (children as XmlElement[])
                .filter(({ type }) => type === 'element')
                .map(item =>
                    element2AbstractNode({
                        name,
                        theme,
                        extraNodeTransformFactories,
                    })(item)
                ),
        };
        if (!(Array.isArray(data.children) && data.children.length > 0)) {
            // @ts-ignore
            delete data.children;
        }
        return extraNodeTransformFactories
            .map((factory: TransformFactory) => factory({ name, theme }))
            .reduce((transformedNode: AbstractNode, extraTransformFn: (asn: AbstractNode) => AbstractNode) => extraTransformFn(transformedNode), data);
    };
}
