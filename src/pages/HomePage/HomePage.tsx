import LatestPosts from '../../components/LatestPosts/LatestPosts'
import GetInTouch from '../../components/GetInTouch/GetInTouch'
import HomePageHero from '../../components/HomePageHero/HomePageHero'
import styles from './HomePage.module.css'

const HomePage = () => {
  return (
    <section className={styles.section}>
      <div className={styles.hero}>
        <HomePageHero />
      </div>
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
