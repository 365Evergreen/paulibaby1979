import { useEffect, useState } from 'react'
import LatestPosts from '../../components/LatestPosts/LatestPosts'
import GetInTouch from '../../components/GetInTouch/GetInTouch'
import Carousel from '../../components/Carousel/Carousel'
import styles from './HomePage.module.css'


interface Slide {
  date: string | Date | number;
  id: number;
  title: string;
  excerpt: string;
  cover_image: string;
  url: string;
  autoslide: boolean;
  interval?: number

}
const HomePage = () => {
  const [slides, setSlides] = useState<Slide[]>([])

  const [loading, setLoading] = useState<boolean>(true)

  // Fetch the latest posts at the page level
  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: Slide[]) => {
        setSlides(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  // Slice the 5 most recent posts specifically for the carousel header
  const carouselSlide = slides.slice(0, 5)
  if (loading) {
    return <div className={styles.loading}>Loading content...</div>
  }
  return (
    <main className={styles.contentContainer}> 
    <div className={styles.carouselContainer}>
     
      <Carousel slides={carouselSlide} autoSlide={true} interval={5000}/>
      
      
    </div>
      <section className={styles.section}>
        <div className={styles.latestPosts}>
          <LatestPosts/>
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
    </main>
  );
}

export default HomePage;