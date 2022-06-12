import camelCase from 'lodash.camelcase';
import { ThemeTypeUpperCase } from '../templates/types';

export interface IdentifierMeta {
  name: string;
  themeSuffix?: ThemeTypeUpperCase;
}

export interface GetIdentifierType {
  (meta: IdentifierMeta): string;
}

export const upperFirst = ([first, ...rest]: string) => first?.toUpperCase() + rest.join('');

export const getIdentifier: GetIdentifierType = (meta) => {
  const themeSuffix = ({ name, themeSuffix }: IdentifierMeta) =>
    name + (themeSuffix ? `-${themeSuffix}` : '');
  return upperFirst(camelCase(themeSuffix(meta)))
}
