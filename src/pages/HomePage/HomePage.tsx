import { useEffect, useState } from 'react'
import LatestPosts from '../../components/LatestPosts/LatestPosts'
import GetInTouch from '../../components/GetInTouch/GetInTouch'

import Carousel from '../../components/Carousel/Carousel'
import styles from './HomePage.module.css'

// Define the type structure for your posts
interface Post {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  url: string;
}

const HomePage = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  // Fetch the latest posts at the page level
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Slice the 5 most recent posts specifically for the carousel header
  const carouselPosts = posts.slice(0, 5)

  if (loading) {
    return <div className={styles.loading}>Loading content...</div>
  }
  return (
    <section className={styles.section}>
      <div className={styles.hero}><Carousel posts={carouselPosts} autoSlide={true} interval={5000}

      /></div>

      <div className={styles.latestPosts}>
        <LatestPosts />
      </div>
      <div className={styles.getInTouch}>
        <GetInTouch
          {...{
            leftColumn: (
              <div>
              </div>
            ),
            rightColumn: (
              <div>
              </div>
            ),
          }

          }
        /></div>
    </section>
  );
}

export default HomePage;
