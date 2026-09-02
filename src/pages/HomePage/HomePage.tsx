import LatestPosts from '../../components/LatestPosts/LatestPosts'
import GetInTouch from '../../components/GetInTouch/GetInTouch'
import styles from './HomePage.module.css'

const HomePage = () => {
  return (
    <section className={styles.section}>
      <div className={styles.hero}>
      <LatestPosts/></div>
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
