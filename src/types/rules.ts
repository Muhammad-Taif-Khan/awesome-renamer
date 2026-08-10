interface WindowsStyleRule  {
    type: 'windowsStyle'
};

type CasingRule<T extends string> = {
  type: T;
};
type UpperCaseRule  = CasingRule<"uppercase">;
type LowerCaseRule  = CasingRule<"lowercase">;
type CapitalizeRule = CasingRule<"capitalize">;
type TitleCaseRule = CasingRule<"titlecase">;

type ReplaceRule = {
    type: "replace";
    search: string;
    replace: string;
};

/** A built-in filename transformation or collision-resolution rule. */
export type RenameRule =
  | WindowsStyleRule
  | ReplaceRule
  | UpperCaseRule
  | LowerCaseRule
  | CapitalizeRule
  | TitleCaseRule;
