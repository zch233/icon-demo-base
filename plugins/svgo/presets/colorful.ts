import SVGO from 'svgo';
import { base } from './base';

export const colorfulConfig: SVGO.OptimizeOptions = {
    ...base,
    plugins: [...(base.plugins || []), { name: 'removeAttrs', params: { attrs: ['class'] } }],
};
