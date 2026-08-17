import { RenameRule } from "../types/rules";
import { toLowerCase, toUpperCase, capitalize, toTitleCase } from "./toCase";
import { replace } from "./replace";
import { addPrefix } from "./prefix";
import { addSuffix } from "./suffix";

interface RenameRuleImplementaion<T extends RenameRule = RenameRule> {
  type: T["type"] | string;

  apply(filename: string, context?: unknown, rule?: T): string;
}

const rules: RenameRuleImplementaion[] = [
  {
    type: "replace",
    apply: (filename, _context, rule) => {
      const replaceRule = rule as Extract<RenameRule, { type: "replace" }>;
      return replace(filename, replaceRule.search, replaceRule.replace);
    },
  },
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
    type: "suffix",
    apply: (filename, _context, rule) => {
      const suffixRule = rule as Extract<RenameRule, { type: "suffix" }>;
      return addSuffix(filename, suffixRule.value);
    },
  },
  {
    type: "prefix",
    apply: (filename, _context, rule) => {
      const prefixRule = rule as Extract<RenameRule, { type: "prefix" }>;
      return addPrefix(filename, prefixRule.value);
    },
  },
  {
    type: "windowsStyle",
    apply: (filename) => {
      return filename;
    },
  },
];
/** Stores rule implementations used by {@link applyRules}. */
class RuleRegistry {
  private readonly rules = new Map<string, RenameRuleImplementaion>();

  /** Registers a unique rule implementation. @throws If `type` is already registered. */
  register(rule: { type: string; apply: RenameRuleImplementaion["apply"] }) {
    if (this.rules.has(rule.type)) {
      throw new Error(`Rule '${rule.type}' already registered.`);
    }
    this.rules.set(rule.type, rule);
  }
  /** Gets the implementation registered for a rule type, if any. */
  get(type: string) {
    return this.rules.get(type);
  }
  /** Returns whether a rule type has been registered. */
  has(type: string) {
    return this.rules.has(type);
  }
  /** Returns all registered rule implementations in registration order. */
  getAll() {
    return [...this.rules.values()];
  }
}

/** Shared registry pre-populated with every built-in rename rule. */
export const registry = new RuleRegistry();

for (const rule of rules) {
    registry.register(rule)
}

/** Applies registered rule implementations to a filename in list order. */
export function applyRules (filename: string, rules: RenameRule[]=[]){
    for (const rule of rules) {
        const implementation = registry.get(rule.type);
        if(implementation){
         filename = implementation.apply(filename, {}, rule)
        }
    }
    return filename
}
