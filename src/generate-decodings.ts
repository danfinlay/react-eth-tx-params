import { getCharacterOffsetToLineAndColumnMapping } from "@truffle/source-map-utils";
import type * as Codec from "@truffle/codec";
import fetch from "node-fetch";

export const txs = [
  // Airswap tx 0xc7ecb707d4704fe60909fee09f3b4ef67aa142e60ecad423041fe26edc856379
  {
    desc: "Airswap tx",
    from: "0x4b203f54429f7d3019c0c4998b88f8f3517f8352",
    to: "0x28de5c5f56b6216441ee114e832808d5b9d4a775",
    data: "0x67641c2f00000000000000000000000000000000000000000000000000000177b6486a7400000000000000000000000000000000000000000000000000000000602ed7f236372b070000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080c886232e9b7ebbfb942b5987aa00000000000000000000000027054b13b1b798b345b591a4d22e6562d47ea75a0000000000000000000000000000000000000000000000000000000008f0d180000000000000000000000000000000000000000000000000000000000000000036372b07000000000000000000000000000000000000000000000000000000000000000000000000000000004b203f54429f7d3019c0c4998b88f8f3517f8352000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000000000000000000000000000298a051db5f5ea00000000000000000000000000000000000000000000000000000000000000000036372b0700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000008bb52b2f23008ba58939ff59a8f3f20000000000000000000000004572f2554421bd64bef1c22c8a81840e8d496bea0100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001b5fcb0cc856bd0afc89493be7bb0e751a9b876b0faebe3086697b3c6c78e4efd3370a7eef528987c13555fd264d96b45af3277b555f9f4f4f6ebf9eb62d3fec2f",
  },

  // MolochDao 0x143c5bf072ca4c09adaab7aedb1eea46f4975bda92d5831d97a044418a036878
  {
    desc: "MolochDao Rage quit",
    from: "0x5a9e792143bf2708b4765c144451dca54f559a19",
    to: "0x1fd169a4f5c59acf79d0fd5d91d1201ef1bce9f1",
    data: "0x8436593f0000000000000000000000000000000000000000000000000000000000000022",
  },

  // Polygon Bridge 0x6e5502985ed92e626fa89e93aa74ebf8c4a78261dc7f59ed4fd7a43dd79c8412
  {
    desc: "Polygon deposit",
    from: "0x1843b97aa4f16b5ed64069c0c956a455b24faacb",
    to: "0xa0c68c638235ee32657e8f720a23cec1bfc77c77",
    data: "0x4faa8a260000000000000000000000001843b97aa4f16b5ed64069c0c956a455b24faacb",
  },

  // Uniswap v3 0x54560d28bb2cc3c10f38fcc553256bd64532e95fb20ca82bf978f60b63a483d2
  {
    desc: "Uniswap v3 swap",
    from: "0xeb0d7e41840066f834eead0a22242e2a3a0c8108",
    to: "0xe592427a0aece92de3edee1f18e0157c05861564",
    data: "0x414bf389000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc2000000000000000000000000de30da39c46104798bb5aa3fe8b9e0e1f348163f0000000000000000000000000000000000000000000000000000000000000bb8000000000000000000000000eb0d7e41840066f834eead0a22242e2a3a0c81080000000000000000000000000000000000000000000000000000000060c1870e0000000000000000000000000000000000000000000000000d272064e760784700000000000000000000000000000000000000000000000d6747e0774c1663b00000000000000000000000000000000000000000000000000000000000000000",
  },
];

export async function getDecoding(txParams, chainId = 1) {
  const { REACT_APP_BASE_URI } = process.env;

  const base = `${REACT_APP_BASE_URI}/txExtra`;
  const url = `${base}?to=${txParams.to}&from=${txParams.from}&data=${txParams.data}&chain=${chainId}`;
  const result = await fetch(url).then((res) => res.json());
  return result;
}

export async function fetchProjectInfo(to, chainId = 1) {
  const { REACT_APP_BASE_URI } = process.env;

  const base = `${REACT_APP_BASE_URI}/fetch-project`;
  const url = `${base}?to=${to}&network-id=${chainId}`;
  const result = await fetch(url).then((res) => res.json());
  return result;
}

// interfaces
interface Source {
  language: string | undefined;
  lines: string[];
}

interface SourceRange {
  source: {
    id: string;
  };
  from: {
    line: number;
    column: number;
  };
  to: {
    line: number;
    column: number;
  };
}

interface ProcessCompilationOptions {
  compilation: Codec.Compilations.Compilation;
  astNodes: Codec.Ast.AstNodes;
}

interface GatherDefinitionsOptions {
  compilations: Codec.Compilations.Compilation[];
  referenceDeclarations: {
    [compilationId: string]: Codec.Ast.AstNodes;
  };
}

interface Definitions {
  compilationsById: {
    [compilationId: string]: {
      sourcesById: {
        [sourceId: string]: Source;
      };
      sourceRangesById: {
        [astId: string]: SourceRange;
      };
    };
  };
}

// internal-method-1 gatherDefinitions
function processSources(sources: Codec.Compilations.Source[]): {
  [id: string]: Source;
} {
  return sources
    .filter(
      <S extends Codec.Compilations.Source>(
        source: S
      ): source is S & { id: string } => typeof source.id !== "undefined"
    )
    .filter(
      <S extends Codec.Compilations.Source>(
        source: S
      ): source is S & { source: string } =>
        typeof source.source !== "undefined"
    )
    .map(({ id, language, source: contents }) => ({
      [id]: {
        language,
        lines: contents.split("\n"),
      },
    }))
    .reduce((a, b) => ({ ...a, ...b }), {});
}

// internal-method-3 gatherDefinitions
function readSourceRange(
  { src }: Codec.Ast.AstNode,
  offsetsBySourceId: {
    [sourceId: string]: {
      line: number;
      column: number;
    }[];
  }
): SourceRange {
  const parts = src.split(":");
  const start = parseInt(parts[0]);
  const length = parseInt(parts[1]);
  const id = parts[2];

  const from = offsetsBySourceId[id][start];
  const to = offsetsBySourceId[id][start + length - 1];

  return {
    source: { id },
    from,
    to,
  };
}

// internal-method-2 gatherDefinitions
function processCompilation({
  compilation,
  astNodes,
}: ProcessCompilationOptions) {
  const { sources } = compilation;

  const sourcesById = processSources(sources);

  const offsetsBySourceId = Object.entries(sources)
    .map(([sourceId, { source: contents }]) => ({
      [sourceId]: getCharacterOffsetToLineAndColumnMapping(contents),
    }))
    .reduce((a, b) => ({ ...a, ...b }), {});

  return {
    sourcesById,
    sourceRangesById: Object.entries(astNodes)
      .map(([id, node]) => ({
        [id]: readSourceRange(node, offsetsBySourceId),
      }))
      .reduce((a, b) => ({ ...a, ...b }), {}),
  };
}

export async function gatherDefinitions({
  compilations,
  referenceDeclarations,
}: GatherDefinitionsOptions): Promise<Definitions> {
  const definitions: Definitions = {
    compilationsById: compilations
      .filter(
        (
          compilation
        ): compilation is Codec.Compilations.Compilation & { id: string } =>
          typeof compilation.id !== "undefined"
      )
      .map((compilation) => {
        const astNodes = referenceDeclarations[compilation.id];

        return {
          [compilation.id]: processCompilation({
            compilation,
            astNodes,
          }),
        };
      })
      .reduce((a, b) => ({ ...a, ...b }), {}),
  };

  return definitions;
}