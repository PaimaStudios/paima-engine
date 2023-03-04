type CardanoMultiplatformLib = typeof import('@dcspark/cardano-multiplatform-lib-browser');

class Module {
  _Address: CardanoMultiplatformLib['Address'] = undefined as any;

  async load(): Promise<void> {
    if (this._Address != null) return;

    // Logger.debug('Attempting cardano multiplatform WASM import');

    // TODO: this weird import style is so this line works in Typescript on nodejs + browser builds
    // probably there is a better way to do it
    const { Address }: { Address: CardanoMultiplatformLib['Address'] } = await import(
      '@dcspark/cardano-multiplatform-lib-browser'
    );

    this._Address = Address;
  }

  inject(address: CardanoMultiplatformLib['Address']): void {
    this._Address = address;
  }

  // Need to expose through a getter to detect the type correctly
  get CardanoAddress(): CardanoMultiplatformLib['Address'] {
    return this._Address;
  }
}

export const RustModule: Module = new Module();
