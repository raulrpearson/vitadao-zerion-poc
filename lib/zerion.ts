export interface PositionsResponse {
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
      } | null;
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
