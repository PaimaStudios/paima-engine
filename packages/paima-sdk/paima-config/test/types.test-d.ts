import { assertType, expectTypeOf } from 'vitest';
import { ConfigNetworkType } from '../src/schema/network/types.js';
import { mainnetConfig } from './data.js';
import { ConfigFunnelType, FunnelConfigQuery, NetworkConfigQuery } from '../src/index.js';
import type { MergeIntersects, ShallowMergeIntersects } from '@paima/utils';

test('my types work properly', () => {
  // ====================
  // Network config tests
  // ====================

  const mainnetConfigData = mainnetConfig.registerGlobal();
  expectTypeOf(
    new NetworkConfigQuery(mainnetConfigData.networks).queryType.getConfigs([ConfigNetworkType.EVM])
  ).toEqualTypeOf<
    (
      | (typeof mainnetConfigData.networks)['Ethereum']
      | (typeof mainnetConfigData.networks)['Ethereum2']
    )[]
  >();
  expectTypeOf(
    new NetworkConfigQuery(mainnetConfigData.networks).queryType.getSingleConfig(
      ConfigNetworkType.AVAIL
    )
  ).toEqualTypeOf<(typeof mainnetConfigData.networks)['Avail']>();

  // @ts-expect-error this isn't a valid network type that exists
  assertType(mainnetConfigData.networkConfig().getSingleConfig('asdfasdf'));

  // ===================
  // Funnel config tests
  // ===================

  expectTypeOf(
    new FunnelConfigQuery(mainnetConfigData.funnels).queryNetworkName.getSingleConfig(
      mainnetConfigData.networks['Ethereum']['displayName']
    )
  ).toEqualTypeOf<
    MergeIntersects<
      (typeof mainnetConfigData.funnels.EvmDecoratorFunnel2.children.EvmDecoratorFunnel.children)['EvmMainFunnel']['config'] & {
        network: (typeof mainnetConfigData.networks)['Ethereum']['displayName'];
      }
    >
  >();
  expectTypeOf(
    new FunnelConfigQuery(mainnetConfigData.funnels).queryFunnelType.getSingleConfig(
      ConfigFunnelType.EVM_MAIN
    )
  ).toEqualTypeOf<
    MergeIntersects<
      (typeof mainnetConfigData.funnels.EvmDecoratorFunnel2.children.EvmDecoratorFunnel.children)['EvmMainFunnel']['config'] & {
        network: (typeof mainnetConfigData.networks)['Ethereum']['displayName'];
      }
    >
  >();
  expectTypeOf(
    new FunnelConfigQuery(mainnetConfigData.funnels).queryFunnelType.getSingleConfig(
      ConfigFunnelType.EVM_PARALLEL
    )
  ).toEqualTypeOf<
    MergeIntersects<
      (typeof mainnetConfigData.funnels.EvmDecoratorFunnel2.children.EvmDecoratorFunnel.children.EvmMainFunnel.children)['EvmParallelFunnel']['config'] & {
        network: (typeof mainnetConfigData.networks)['Ethereum2']['displayName'];
      }
    >
  >();
  expectTypeOf(
    new FunnelConfigQuery(mainnetConfigData.funnels).queryDisplayName.getSingleConfig(
      mainnetConfigData.funnels.EvmDecoratorFunnel2.children.EvmDecoratorFunnel.children[
        'EvmMainFunnel'
      ]['config']['displayName']
    )
  ).toEqualTypeOf<
    MergeIntersects<
      (typeof mainnetConfigData.funnels.EvmDecoratorFunnel2.children.EvmDecoratorFunnel.children)['EvmMainFunnel']['config'] & {
        network: (typeof mainnetConfigData.networks)['Ethereum']['displayName'];
      }
    >
  >();

  expectTypeOf(new FunnelConfigQuery(mainnetConfigData.funnels).mainConfig()).toEqualTypeOf<
    ShallowMergeIntersects<
      (typeof mainnetConfigData.funnels.EvmDecoratorFunnel2.children.EvmDecoratorFunnel.children)['EvmMainFunnel']['config'] & {
        network: (typeof mainnetConfigData.networks)['Ethereum']['displayName'];
      }
    >
  >();
});
