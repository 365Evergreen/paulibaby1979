import styles from './Carousel.module.css'


export default function Carousel() {
  return (
    <section className={styles.carouselContainer}>
      <div className={styles.carouselContent}>
        <p>Helping organisations keep Microsoft 365 evergreen.</p>
      </div>
    </section>
  )
}