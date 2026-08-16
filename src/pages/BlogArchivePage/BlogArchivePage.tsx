import LatestPosts from '../../components/LatestPosts/LatestPosts'
import styles from './BlogArchivePage.module.css'

const BlogArchivePage = () => {
  return (
    <main className={styles.contentContainer}>
      <LatestPosts />
      </main>
  )
}
export default BlogArchivePage