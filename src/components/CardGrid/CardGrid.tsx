import type { ReactNode } from "react"
import styles from "./CardGrid.module.css"

interface CardGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
}

export default function CardGrid({ children, columns = 3 }: CardGridProps) {
  return (
    <div className={styles.grid} data-columns={columns}>
      {children}
    </div>
  )
}
