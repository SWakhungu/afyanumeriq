import * as React from "react"
import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white shadow-sm p-4",
        className
      )}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("p-2", className)} {...props} />
}

export { Card, CardContent }
