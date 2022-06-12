import { TransformFactory, TransformOptions } from '../index';

type Dictionary = Record<string, string>;

export function assignAttrsAtTag(
    tag: string,
    extraPropsOrFn: Dictionary | ((options: TransformOptions & { previousAttrs: Dictionary }) => Dictionary)
): TransformFactory {
    return options => asn => {
        if (asn.tag === tag) {
            return {
                ...asn,
                attrs: {
                    ...asn.attrs,
                    ...(typeof extraPropsOrFn === 'function' ? extraPropsOrFn({ ...options, previousAttrs: asn.attrs }) : extraPropsOrFn),
                },
            };
        } else {
            return asn;
        }
    };
}
