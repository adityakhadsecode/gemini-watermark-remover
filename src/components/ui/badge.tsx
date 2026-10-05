import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "group/badge inline-flex h-auto w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-all [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-[1.5px] border-[#c0c2a9] bg-transparent text-[#202020]",
        outline:
          "border-[1.5px] border-[#c0c2a9] bg-transparent text-[#202020]",
        secondary:
          "border-[1.5px] border-[#c0c2a9] bg-[#edeee1] text-[#202020]",
        forest:
          "border-[1.5px] border-[#aafdc0]/40 bg-[#003d21] text-[#aafdc0]",
        mint:
          "border-[1.5px] border-[#003d21]/20 bg-[#aafdc0] text-[#003d21]",
        destructive:
          "border-[1.5px] border-red-300 bg-red-50 text-red-700",
        ghost:
          "border-transparent bg-transparent text-[#5a5a4f]",
        link: "text-[#000000] underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
