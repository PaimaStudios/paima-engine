import web3 from 'web3-utils';
import { EncodingVersion, } from './types';
import { isHexString } from './utils';
import buildv1 from './v1/builder';
import { separator } from './v1/consts';
import { toConciseValue } from './v1/utils';
const initialize = (input, version = EncodingVersion.V1) => {
    let initialConciseInput = '';
    let concisePrefix = '';
    let conciseValues = [];
    if (input && version === EncodingVersion.V1) {
        initialConciseInput = isHexString(input) ? web3.hexToUtf8(input) : input;
        const [prefix, ...stringValues] = initialConciseInput.split(separator);
        concisePrefix = prefix;
        conciseValues = stringValues.map(toConciseValue);
    }
    return {
        initialConciseInput,
        concisePrefix,
        conciseValues,
        setPrefix(value) {
            if (!value) {
                throw new Error("Can't use empty value as prefix in concise builder");
            }
            this.concisePrefix = value;
        },
        addValue(value) {
            this.conciseValues.push(value);
        },
        addValues(values) {
            this.conciseValues = this.conciseValues.concat(values);
        },
        insertValue(position, value) {
            const index = position - 1;
            this.conciseValues.splice(index, 0, value);
        },
        build() {
            switch (version) {
                case EncodingVersion.V1:
                    return buildv1(this.concisePrefix, this.conciseValues);
                default:
                    throw Error(`Concise builder initialized with unsupported encoding version: ${version}`);
            }
        },
        initialInput() {
            return this.initialConciseInput;
        },
        valueCount() {
            return this.conciseValues.length;
        },
    };
};
export const builder = { initialize };
