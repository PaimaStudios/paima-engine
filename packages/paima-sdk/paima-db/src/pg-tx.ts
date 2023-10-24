import txImport from 'pg-tx';

export let tx: typeof txImport;

if (txImport.hasOwnProperty('default')) {
  tx = (txImport as unknown as { default: typeof txImport }).default;
} else {
  tx = txImport;
}
