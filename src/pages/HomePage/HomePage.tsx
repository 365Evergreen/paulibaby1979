import Carousel from "../../components/Carousel/Carousel"
//import FeaturedPost from "../../components/FeaturedPost/FeaturedPost"
import LatestPosts from "../../components/LatestPosts/LatestPosts"
import VideoPlayer from "../../components/VideoPlayer/VideoPlayer"
import styles from "./HomePage.module.css"
const HomePage = () => {
  return (
    <main className={styles.contentContainer}>
      <Carousel />
      

      <section className={styles.section}>
        <LatestPosts />
        <div className={styles.videoSection}>
          <VideoPlayer title="Cold Little Heart" />
        </div>
      </section>
    </main>
  )
}

export default HomePage
