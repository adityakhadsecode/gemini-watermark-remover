import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center border border-transparent font-medium whitespace-nowrap transition-all outline-none select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-[#202020] text-[#ffffff] hover:bg-[#2e2e2e] rounded-[13px] border-none font-medium",
        outline:
          "border-[1.5px] border-[#c0c2a9] bg-transparent text-[#202020] hover:bg-[#edeee1] hover:border-[#000000] rounded-[9px]",
        secondary:
          "bg-[#edeee1] text-[#202020] border-[1.5px] border-[#c0c2a9] hover:bg-[#e4e5d6] rounded-[13px]",
        ghost:
          "bg-transparent text-[#202020] hover:bg-[#edeee1] rounded-[9px]",
        destructive:
          "bg-red-50 text-red-700 border-[1.5px] border-red-300 hover:bg-red-100 rounded-[13px]",
        link: "text-[#000000] underline-offset-4 hover:underline",
        forest:
          "bg-[#003d21] text-[#aafdc0] border-[1.5px] border-[#aafdc0]/30 hover:bg-[#004d2a] rounded-[13px]",
        mint:
          "bg-[#aafdc0] text-[#003d21] border-[1.5px] border-[#003d21]/20 hover:bg-[#97f0af] rounded-[13px]",
      },
      size: {
        default:
          "h-10 gap-2 px-4 text-sm rounded-[13px]",
        xs: "h-6 gap-1 rounded-[9px] px-2 text-[11px] [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[9px] px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2 px-5 text-base rounded-[13px]",
        icon: "size-9 rounded-[9px]",
        "icon-xs": "size-6 rounded-[9px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7 rounded-[9px] [&_svg:not([class*='size-'])]:size-3.5",
        "icon-lg": "size-11 rounded-[13px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
