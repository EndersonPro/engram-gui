export const cn = (...classes: Array<string | false | null | undefined>) => {
  return classes.filter((value): value is string => Boolean(value && value.trim())).join(" ");
};
