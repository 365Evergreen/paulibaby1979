export interface LatestPostItem {
  pageId?: string
  category?: string
  title: string
  excerpt?: string
  meta?: string
  linkTo: string
}

export interface LatestPostsProps {
  heading: string
  posts: LatestPostItem[]
  viewAllLabel?: string
  viewAllLink?: string
}
