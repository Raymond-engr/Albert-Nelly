import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "outline" | "brand" | "sun" | "dark";

const base =
  "inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border-[1.5px] px-6 text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";
const variants: Record<ButtonVariant, string> = {
  outline: "border-ink bg-transparent text-ink",
  brand: "border-brand bg-brand text-[#06281E]",
  sun: "border-sun bg-sun text-[#06281E]", // one Sunbeam button per screen, at most
  dark: "border-ink bg-ink text-paper",
};

/** Class string so the same look can be used on <a>, <button> and next/link. */
export function buttonClass(variant: ButtonVariant = "outline", big = false, extra = "") {
  return `${base} ${variants[variant]} ${big ? "!min-h-16 !px-10 font-display text-xl font-bold" : ""} ${extra}`.trim();
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; big?: boolean };

export function Button({ variant, big, className, type = "button", ...rest }: Props) {
  return <button type={type} className={buttonClass(variant, big, className)} {...rest} />;
}
