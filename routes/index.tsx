import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";

interface PositionsResponse {
  links: {
    self: string;
  };
  data: Array<{
    type: string;
    id: string;
    attributes: {
      parent: null;
      protocol: null | "Uniswap V3" | "Bancor";
      name: "Asset";
      position_type: "wallet" | "deposit" | "staked" | "reward";
      quantity: {
        "int": string;
        "decimals": number;
        "float": number;
        "numeric": string;
      };
      value: number;
      price: number;
      changes: {
        "absolute_1d": number;
        "percent_1d": number;
      };
      fungible_info: {
        name: string;
        symbol: string;
        icon: {
          url: string;
        } | null;
        flags: {
          verified: true;
        };
        implementations: [
          {
            chain_id: "ethereum";
            address: string;
            decimals: number;
          },
        ];
      };
      flags: {
        "displayable": boolean;
      };
      "updated_at": string;
      "updated_at_block": number;
    };
    relationships: {
      chain: {
        links: {
          related: string;
        };
        data: {
          type: "chains";
          id: "ethereum";
        };
      };
      fungible: {
        links: {
          related: string;
        };
        data: {
          type: "fungibles";
          id: string;
        };
      };
    };
  }>;
}

interface UIData {
  walletItems: ItemProps[];
  uniswapItems: ItemProps[];
  bancorItems: ItemProps[];
}

export const handler: Handlers<UIData | null> = {
  async GET(_, ctx) {
    const resp = await fetch(
      "https://api.zerion.io/v1/wallets/0xf5307a74d1550739ef81c6488dc5c7a6a53e5ac2/positions",
    );
    if (resp.status === 404) {
      return ctx.render(null);
    }
    const json: PositionsResponse = await resp.json();
    const walletItems = json.data.filter(({ attributes: { position_type } }) =>
      position_type === "wallet"
    );
    const uniswapItems = json.data.filter(({ attributes: { protocol } }) =>
      protocol === "Uniswap V3"
    );
    const bancorItems = json.data.filter(({ attributes: { protocol } }) =>
      protocol === "Bancor"
    );
    return ctx.render({ walletItems, uniswapItems, bancorItems });
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

function format(n: number, decimals = 2) {
  return n?.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
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
        {format(balance, 3) + " " + symbol}
      </td>
      <td class="p-2 whitespace-nowrap">
        <div>{"$" + format(value, 0)}</div>
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
        {format(balance, 3) + " " + symbol}
      </td>
      <td class="p-2 whitespace-nowrap">
        <div>{"$" + format(value, 0)}</div>
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
      </td>
    </tr>
  );
};

export default function Home({ data }: PageProps<UIData | null>) {
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
        {data && (
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
                {data &&
                  data.uniswapItems.map((item) => <PoolItem {...item} />)}
              </tbody>
            </table>
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
                {data &&
                  data.bancorItems.map((item) => <PoolItem {...item} />)}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
}
