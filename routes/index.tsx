import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import "dotenv";

import { type BalancesAppsResponse } from "../lib/zapper.ts";
import { type PositionsResponse } from "../lib/zerion.ts";

interface UIData {
  walletItems?: ItemProps[];
  uniswapItems?: ItemProps[];
  bancorItems?: ItemProps[];
  balancer?: BalancesAppsResponse[number];
}

export const handler: Handlers<UIData> = {
  async GET(_, ctx) {
    const wallet = "0xf5307a74d1550739ef81c6488dc5c7a6a53e5ac2";

    const [zerion, zapper] = await Promise.allSettled<
      [Promise<PositionsResponse>, Promise<BalancesAppsResponse>]
    >([
      fetch(`https://api.zerion.io/v1/wallets/${wallet}/positions`)
        .then((res) => res.json()),
      fetch(`https://api.zapper.xyz/v2/balances/apps?addresses[]=${wallet}`, {
        headers: {
          Authorization: `Basic ${Deno.env.get("ZAPPER_KEY")}`,
        },
      })
        .then((res) => res.json()),
    ]);

    let props: UIData = {};

    if (zerion.status === "fulfilled") {
      const walletItems = zerion.value.data.filter((
        { attributes: { position_type } },
      ) => position_type === "wallet");
      const uniswapItems = zerion.value.data.filter((
        { attributes: { protocol } },
      ) => protocol === "Uniswap V3");
      const bancorItems = zerion.value.data.filter((
        { attributes: { protocol } },
      ) => protocol === "Bancor");
      props = { ...props, walletItems, uniswapItems, bancorItems };
    }

    if (zapper.status === "fulfilled" && Array.isArray(zapper.value)) {
      const balancer = zapper.value.filter(({ appId }) =>
        appId === "balancer-v2"
      )[0];
      props = { ...props, balancer };
    }

    return ctx.render(props);
  },
};

const initials = (name: string): string => {
  return name.split(/\s|\./)
    .slice(0, 3)
    .map((term) => term[0])
    .join("")
    .toUpperCase();
};

const capitalize = (label: string | undefined): string => {
  return label && label.length > 0
    ? label[0].toUpperCase() + label.slice(1)
    : "";
};

function format(n: number, decimals?: number) {
  if (decimals) {
    return n?.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  if (n >= 1000) {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } else {
    return n?.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}

type ItemProps = PositionsResponse["data"][number];

const AssetItem = (props: ItemProps) => {
  const { price, quantity: { float: balance }, value, changes } =
    props.attributes;
  const { icon, symbol, name } = props.attributes.fungible_info;
  const { data: { id: chain } } = props.relationships.chain;
  return (
    <tr>
      <td class="flex gap-3 items-center p-2">
        {icon
          ? <img src={icon.url} alt={name} class="h-5 w-5 sm:h-9 sm:w-9" />
          : (
            <div class="h-5 w-5 sm:h-9 sm:w-9 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
              {initials(name)}
            </div>
          )}
        <div>
          <div class="font-bold">{name}</div>
          <div>{capitalize(chain)}</div>
        </div>
      </td>
      <td class="p-2">
        {"$" + format(price)}
      </td>
      <td class="p-2 whitespace-nowrap">
        {format(balance) + " " + symbol}
      </td>
      <td class="p-2 whitespace-nowrap">
        <div>{"$" + format(value)}</div>
        {changes && (
          <>
            {changes.absolute_1d > 0
              ? (
                <div class="text-green-500">
                  {`+${format(changes.percent_1d)}% ($${
                    format(Math.abs(changes.absolute_1d))
                  })`}
                </div>
              )
              : (
                <div class="text-red-500">
                  {`${format(changes.percent_1d)}% ($${
                    format(Math.abs(changes.absolute_1d))
                  })`}
                </div>
              )}
          </>
        )}
      </td>
    </tr>
  );
};

const PoolItem = (props: ItemProps) => {
  const { position_type, quantity: { float: balance }, value, changes } =
    props.attributes;
  const { icon, symbol, name } = props.attributes.fungible_info;
  const { data: { id: chain } } = props.relationships.chain;
  return (
    <tr>
      <td class="flex gap-3 items-center p-2">
        {icon
          ? <img src={icon.url} alt={name} class="h-5 w-5 sm:h-9 sm:w-9" />
          : (
            <div class="h-5 w-5 sm:h-9 sm:w-9 bg-gray-300 rounded-full flex-shrink-0 flex items-center justify-center">
              {initials(name)}
            </div>
          )}
        <div>
          <div class="font-bold">{name}</div>
          <div>{capitalize(chain) + " · " + capitalize(position_type)}</div>
        </div>
      </td>
      <td class="p-2 whitespace-nowrap">
        {format(balance) + " " + symbol}
      </td>
      <td class="p-2 whitespace-nowrap">
        <div>{"$" + format(value)}</div>
        {changes && (
          <>
            {changes.absolute_1d > 0
              ? (
                <div class="text-green-500">
                  {`+${format(changes.percent_1d)}% ($${
                    format(Math.abs(changes.absolute_1d))
                  })`}
                </div>
              )
              : (
                <div class="text-red-500">
                  {`${format(changes.percent_1d)}% ($${
                    format(Math.abs(changes.absolute_1d))
                  })`}
                </div>
              )}
          </>
        )}
      </td>
    </tr>
  );
};

export default function Home({ data }: PageProps<UIData>) {
  return (
    <>
      <Head>
        <title>VitaDAO Treasury</title>
        <link rel="shortcut icon" href="/logo.svg" />
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1 class="text-4xl mt-6 mb-3">VitaDAO Treasury</h1>
        <p class="my-3">
          Built with data from Zerion API.
        </p>
        <details class="bg-gray-100 rounded-xl my-3 overflow-hidden">
          <summary class="p-2 font-bold">Aggregated JSON</summary>
          <pre class="p-2 w-full overflow-auto bg-gray-200 max-h-[800px] text-xs">{JSON.stringify(data, null, 2)}</pre>
        </details>
        {data.walletItems && (
          <>
            <h2 class="text-2xl mt-6 mb-3">Wallet</h2>
            <table class="text-sm w-full">
              <colgroup>
                <col />
                <col />
                <col style="width: 0;" />
                <col style="width: 0;" />
              </colgroup>
              <thead class="text-left text-xs text-uppercase">
                <tr>
                  <th class="p-2">Asset</th>
                  <th class="p-2">Price</th>
                  <th class="p-2">Balance</th>
                  <th class="p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.walletItems.map((item) => <AssetItem {...item} />)}
              </tbody>
            </table>
          </>
        )}
        {data.uniswapItems &&
          (
            <>
              <h2 class="text-2xl mt-6 mb-3">Uniswap V3</h2>
              <table class="text-sm w-full">
                <colgroup>
                  <col />
                  <col style="width: 0;" />
                  <col style="width: 0;" />
                </colgroup>
                <thead class="text-left text-xs text-uppercase">
                  <tr>
                    <th class="p-2">Asset</th>
                    <th class="p-2">Balance</th>
                    <th class="p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {data.uniswapItems.map((item) => <PoolItem {...item} />)}
                </tbody>
              </table>
            </>
          )}
        {data.bancorItems && (
          <>
            <h2 class="text-2xl mt-6 mb-3">Bancor</h2>
            <table class="text-sm w-full">
              <colgroup>
                <col />
                <col style="width: 0;" />
                <col style="width: 0;" />
              </colgroup>
              <thead class="text-left text-xs text-uppercase">
                <tr>
                  <th class="p-2">Asset</th>
                  <th class="p-2">Balance</th>
                  <th class="p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.bancorItems.map((item) => <PoolItem {...item} />)}
              </tbody>
            </table>
          </>
        )}
        {data.balancer && (
          <>
            <h2 class="text-2xl mt-6 mb-3">
              {`${data.balancer.appName} · $${
                format(data.balancer.balanceUSD)
              }`}
            </h2>
            {data.balancer.products.map((product) => (
              <>
                <h3 class="text-xl mt-3 mb-3">
                  {`${product.label} · $${
                    format(product.assets.reduce((acc, cur) =>
                      acc + cur.balanceUSD, 0))
                  }`}
                </h3>
                <table className="text-sm w-full">
                  <tbody>
                    {[...product.assets].sort((a, b) =>
                      b.balanceUSD - a.balanceUSD
                    ).map((asset) => (
                      <ZapperAssetItem
                        // @ts-expect-error: data.balancer has already been
                        // checked, not sure why TS isn't picking it up
                        appImage={data.balancer.appImage}
                        asset={asset}
                      />
                    ))}
                  </tbody>
                </table>
              </>
            ))}
          </>
        )}
      </div>
    </>
  );
}

interface ZapperAssetIconProps {
  appImage: string;
  tokenImages: string[];
}

function ZapperAssetIcon({ appImage, tokenImages }: ZapperAssetIconProps) {
  if (tokenImages.length === 0) {
    return (
      <img
        src={appImage}
        alt=""
        class="h-5 w-5 sm:h-9 sm:w-9 border border-black rounded-full"
      />
    );
  }

  if (tokenImages.length <= 2) {
    return (
      <div class="h-5 w-5 sm:h-9 sm:w-9 relative">
        {tokenImages?.[0] && (
          <img
            src={tokenImages[0]}
            alt=""
            class={`h-2/3 w-2/3 absolute top-0 left-0 border border-black rounded-full`}
          />
        )}
        {tokenImages?.[1] && (
          <img
            src={tokenImages[1]}
            alt=""
            class={`h-2/3 w-2/3 absolute top-1/3 left-1/3 border border-black rounded-full`}
          />
        )}
        <img
          src={appImage}
          alt=""
          class="h-1/2 w-1/2 absolute top-0 right-0 border border-black rounded-full"
        />
      </div>
    );
  }

  return (
    <div class="h-5 w-5 sm:h-9 sm:w-9 relative">
      <img
        src={tokenImages[0]}
        alt=""
        class="h-2/3 w-2/3 absolute top-0 left-0 border border-black rounded-full"
      />
      <div class="h-2/3 w-2/3 absolute top-1/3 left-1/3 bg-gray-300 border border-black rounded-full flex items-center justify-center leading-none text-xs">
        {`+${tokenImages.length - 1}`}
      </div>
      <img
        src={appImage}
        alt=""
        class="h-1/2 w-1/2 absolute top-0 right-0 border border-black rounded-full"
      />
    </div>
  );
}

interface ZapperAssetItemProps {
  appImage: string;
  asset: BalancesAppsResponse[number]["products"][number]["assets"][number];
}

function ZapperAssetItem(
  { appImage, asset }: ZapperAssetItemProps,
) {
  const { images, label, secondaryLabel, tertiaryLabel } = asset.displayProps;
  const sublabel = [secondaryLabel, tertiaryLabel].filter(Boolean).join(" · ");

  return (
    <tr class="border-t">
      <td class="flex gap-3 p-2">
        <ZapperAssetIcon
          appImage={appImage}
          tokenImages={images}
        />
        <div class="flex flex-col">
          <span>{label}</span>
          <span>{sublabel}</span>
        </div>
      </td>
      <td class="text-right p-2">
        <div class="flex flex-col">
          <span>{`$${format(asset.balanceUSD)}`}</span>
          {asset.balance && <span>{`${format(asset.balance)}`}</span>}
        </div>
      </td>
    </tr>
  );
}
