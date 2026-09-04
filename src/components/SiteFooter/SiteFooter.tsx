import { useNavigate } from 'react-router-dom'
import styles from './SiteFooter.module.css'


export default function SiteFooter() {
  const navigate = useNavigate();
  return (

    <div className={styles.footerContainer}>
      <div className={styles.footerContent}>
        <button
          onClick={() => navigate(`/admin}`)}
          className={styles.editPostButton}
        >
          Edit
        </button>
      </div>
      <p>Helping organisations keep Microsoft 365 evergreen.</p>
    </div>

  )
}
