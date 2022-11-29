import { separator, stateIdentifier } from './consts';
const toString = (val) => {
    return val.isStateIdentifier ? `${stateIdentifier}${val.value}` : val.value;
};
const build = (concisePrefix, conciseValues) => {
    if (!concisePrefix) {
        throw new Error(`Missing prefix value in concise builder for input: ${conciseValues}`);
    }
    const conciseValueInput = conciseValues.map(toString).join(separator);
    const conciseInput = `${concisePrefix}${separator}${conciseValueInput}`;
    console.log(conciseInput);
    return conciseInput;
};
export default build;
