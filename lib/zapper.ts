type AppId =
  | "balancer-v2"
  | "uniswap-v3"
  | "vesper"
  | "solace"
  | "mux"
  | "dfx"
  | "lido";

type Network =
  | "ethereum"
  | "polygon"
  | "aurora"
  | "fantom";

type AssetType = "app-token" | "contract-position";

type AssetGroupId = "pool" | "farm";

interface AppToken {
  key: string;
  type: "app-token";
  appId: AppId;
  price: number;
  supply: number;
  symbol: string;
  tokens: Token[];
  address: string;
  groupId: string;
  network: Network;
  decimals: number;
  dataProps: unknown;
}

type TokenMetaType = "claimable";

interface BaseToken {
  metaType: TokenMetaType;
  type: "base-token";
  network: Network;
  address: string;
  symbol: string;
  decimals: number;
  price: number;
  balance: number;
  balanceRaw: string;
  balanceUSD: number;
}

type Token = AppToken | BaseToken;

interface AssetDataProps {
  liquidity: number;
  apy: number;
  isActive: boolean;
}

interface AssetStatItem {
  label: string;
  value: {
    type: string;
    value: number;
  };
}

interface AssetDisplayProps {
  label: string;
  secondaryLabel?: string;
  tertiaryLabel: string;
  images: string[];
  statsItems: AssetStatItem[];
}

interface Asset {
  key: string;
  type: AssetType;
  appId: AppId;
  groupId: AssetGroupId;
  network: Network;
  address: string;
  tokens: Token[];
  symbol: string;
  decimals: number;
  supply: number;
  pricePerShare: number[];
  price: number;
  dataProps: AssetDataProps;
  displayProps: AssetDisplayProps;
  balance?: number;
  balanceRaw?: string;
  balanceUSD: number;
}

type Meta = unknown;

interface Product {
  label: string;
  assets: Asset[];
  meta: Meta[];
}

interface App {
  key: string;
  address: string;
  appId: AppId;
  appName: string;
  appImage: string;
  network: Network;
  updatedAt: string;
  balanceUSD: number;
  products: Product[];
}

export type BalancesAppsResponse = App[];
