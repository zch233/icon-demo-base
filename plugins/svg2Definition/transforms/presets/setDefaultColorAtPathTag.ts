import { TransformFactory } from '../../index';
import { assignAttrsAtTag } from '../index';

export const setDefaultColorAtPathTag: (defaultColor: string) => TransformFactory = defaultColor =>
    assignAttrsAtTag('path', ({ previousAttrs }) => ({
        fill: previousAttrs.fill || defaultColor,
    }));
