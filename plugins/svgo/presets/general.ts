import SVGO from 'svgo';
import { base } from './base';

export const generalConfig: SVGO.OptimizeOptions = {
  ...base,
  plugins: [
    ...(base.plugins || []),
    {
      name: 'removeAttrs',
      params: { attrs: ['class', 'fill'] },
    }
  ],
}
