import SVGO from 'svgo';
import { createTrasformStreamAsync } from '../creator';

export const svgo = (options: SVGO.OptimizeOptions) => {
    // const optimizer = new SVGO(options);
    return createTrasformStreamAsync(async before => {
        const result = await SVGO.optimize(before, options);
        if ('data' in result) {
            return result.data;
        } else {
            throw 'svgo optimize error';
        }
    });
};
