import { RenameRule } from "../types/rules";
import { toLowerCase, toUpperCase, capitalize, toTitleCase } from "./toCase";
import { replace } from "./replace";

interface RenameRuleImplementaion<T extends RenameRule = RenameRule> {
  type: T["type"] | string;

  apply(filename: string, context?: unknown, rule?: T): string;
}

const rules: RenameRuleImplementaion[] = [
  {
    type: "uppercase",
    apply: toUpperCase,
  },
  {
    type: "lowercase",
    apply: toLowerCase,
  },
  {
    type: "capitalize",
    apply: capitalize,
  },
  {
    type: "titlecase",
    apply: toTitleCase,
  },
  {
    type: "replace",
    apply: (filename, _context, rule) => {
      const replaceRule = rule as Extract<RenameRule, { type: "replace" }>;
      return replace(filename, replaceRule.search, replaceRule.replace);
    },
  },
  {
    type: "windowsStyle",
    apply: (filename) => {
      return filename;
    },
  },
];
class RuleRegistry {
  private readonly rules = new Map<string, RenameRuleImplementaion>();

  register(rule: { type: string; apply: RenameRuleImplementaion["apply"] }) {
    if (this.rules.has(rule.type)) {
      throw new Error(`Rule '${rule.type}' already registered.`);
    }
    this.rules.set(rule.type, rule);
  }
  get(type: string) {
    return this.rules.get(type);
  }
  has(type: string) {
    return this.rules.has(type);
  }
  getAll() {
    return [...this.rules.values()];
  }
}

export const registry = new RuleRegistry();

for (const rule of rules) {
    registry.register(rule)
}

export function applyRules (filename: string, rules: RenameRule[]=[]){
    for (const rule of rules) {
        const implementation = registry.get(rule.type);
        if(implementation){
         filename = implementation.apply(filename, {}, rule)
        }
    }
    return filename
}
