import { StringifyFn, AbstractNodeDefinition } from '../index';
import cloneDeep from 'lodash.clonedeep'

const __PLACEHOLDER__ = 'TWOTONE_ICON_FUNCTION_HOLDER';
const __PRIMARY_COLOR__ = 'primaryColor';
const __SECONDARY_COLOR__ = 'secondaryColor';

const getRegExpFromColors = (colors: string[]) => new RegExp([...colors.map(v => v.toUpperCase()), ...colors.map(v => v.toLowerCase())].map(color => `("${color}")`).join('|'), 'g')

const colorsReplacer = (icon: string) => {
  const colorsPairs: [string, RegExp][] = [[__PRIMARY_COLOR__, getRegExpFromColors(['#333', '#333333'])],[__SECONDARY_COLOR__, getRegExpFromColors(['#E6E6E6', '#D9D9D9', '#D8D8D8'])]]
  const fns = colorsPairs.map((v) => (str: string) => str.replace(v[1], v[0]))
  return fns.reduce((a,b) => b(a),icon)
};

const duplicate = <T>(n: T): [T, T] => [cloneDeep(n), cloneDeep(n)];

const createFunctionStr = (content:string) => `function render(${__PRIMARY_COLOR__}, ${__SECONDARY_COLOR__}) { return ${content}; }`;

export const twotoneStringify: StringifyFn = (iconData) => {
  const iconDataRepeat = duplicate(iconData);
  const [hasPlaceholderContent, iconFunctionContent] = [
    (data: AbstractNodeDefinition) => JSON.stringify({...data, icon: __PLACEHOLDER__}),
    (data: AbstractNodeDefinition) => createFunctionStr(colorsReplacer(JSON.stringify(data.icon))),
  ].map((fn,i) => fn(iconDataRepeat[i]))
  return hasPlaceholderContent.replace(`"${__PLACEHOLDER__}"`, iconFunctionContent)
};
