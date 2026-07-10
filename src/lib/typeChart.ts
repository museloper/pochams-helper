import type {
  DamageMultiplier,
  PokemonType,
  TypeChart,
  TypeChartValue,
} from "@/lib/types";
import { POKEMON_TYPES } from "@/lib/types";

// Attacking-type relations (Gen 6+). Anything not listed is 1×.
const RELATIONS: Record<
  PokemonType,
  { double?: PokemonType[]; half?: PokemonType[]; zero?: PokemonType[] }
> = {
  normal: { half: ["rock", "steel"], zero: ["ghost"] },
  fire: {
    double: ["grass", "ice", "bug", "steel"],
    half: ["fire", "water", "rock", "dragon"],
  },
  water: {
    double: ["fire", "ground", "rock"],
    half: ["water", "grass", "dragon"],
  },
  electric: {
    double: ["water", "flying"],
    half: ["electric", "grass", "dragon"],
    zero: ["ground"],
  },
  grass: {
    double: ["water", "ground", "rock"],
    half: ["fire", "grass", "poison", "flying", "bug", "dragon", "steel"],
  },
  ice: {
    double: ["grass", "ground", "flying", "dragon"],
    half: ["fire", "water", "ice", "steel"],
  },
  fighting: {
    double: ["normal", "ice", "rock", "dark", "steel"],
    half: ["poison", "flying", "psychic", "bug", "fairy"],
    zero: ["ghost"],
  },
  poison: {
    double: ["grass", "fairy"],
    half: ["poison", "ground", "rock", "ghost"],
    zero: ["steel"],
  },
  ground: {
    double: ["fire", "electric", "poison", "rock", "steel"],
    half: ["grass", "bug"],
    zero: ["flying"],
  },
  flying: {
    double: ["grass", "fighting", "bug"],
    half: ["electric", "rock", "steel"],
  },
  psychic: {
    double: ["fighting", "poison"],
    half: ["psychic", "steel"],
    zero: ["dark"],
  },
  bug: {
    double: ["grass", "psychic", "dark"],
    half: ["fire", "fighting", "poison", "flying", "ghost", "steel", "fairy"],
  },
  rock: {
    double: ["fire", "ice", "flying", "bug"],
    half: ["fighting", "ground", "steel"],
  },
  ghost: { double: ["psychic", "ghost"], half: ["dark"], zero: ["normal"] },
  dragon: { double: ["dragon"], half: ["steel"], zero: ["fairy"] },
  dark: { double: ["psychic", "ghost"], half: ["fighting", "dark", "fairy"] },
  steel: {
    double: ["ice", "rock", "fairy"],
    half: ["fire", "water", "electric", "steel"],
  },
  fairy: {
    double: ["fighting", "dragon", "dark"],
    half: ["fire", "poison", "steel"],
  },
};

function buildChart(): TypeChart {
  const chart = {} as TypeChart;
  for (const attacker of POKEMON_TYPES) {
    const row = {} as Record<PokemonType, TypeChartValue>;
    const rel = RELATIONS[attacker];
    for (const defender of POKEMON_TYPES) {
      row[defender] = rel.double?.includes(defender)
        ? 2
        : rel.zero?.includes(defender)
          ? 0
          : rel.half?.includes(defender)
            ? 0.5
            : 1;
    }
    chart[attacker] = row;
  }
  return chart;
}

/** Full type chart: `TYPE_CHART[attacker][defender]` = single-type multiplier. */
export const TYPE_CHART: TypeChart = buildChart();

/** Combined multiplier of an attacking type against a (possibly dual) defender. */
export function effectiveness(
  attacking: PokemonType,
  defending: PokemonType[],
): DamageMultiplier {
  let mult = 1;
  for (const type of defending) mult *= TYPE_CHART[attacking][type];
  return mult as DamageMultiplier;
}

/** Attacking types that hit the given typing super-effectively (> 1×). */
export function weaknesses(defending: PokemonType[]): PokemonType[] {
  return POKEMON_TYPES.filter((atk) => effectiveness(atk, defending) > 1);
}
