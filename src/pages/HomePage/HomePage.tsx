import LatestPosts from '../../components/LatestPosts/LatestPosts'
import styles from './HomePage.module.css'

const HomePage = () => {
  return (
    <section className={styles.section}>
      <div>Pauli</div>
      <LatestPosts/>
    </section>

  );
}

export default HomePage;
