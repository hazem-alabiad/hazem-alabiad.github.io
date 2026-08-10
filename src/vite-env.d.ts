/// <reference types="vite/client" />

declare module '*.mdx' {
  import { type ComponentType } from 'react'
  export const frontmatter: Record<string, unknown>
  export default function MDXContent(props?: Record<string, unknown>): JSX.Element
}