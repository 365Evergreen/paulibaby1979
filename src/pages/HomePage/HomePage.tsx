<<<<<<< HEAD


const HomePage = () => {
  return (
    <div>
Pauli
    </div>

  );
}

export default HomePage;
=======
import styles from './HomePage.module.css';
import {GetInTouch} from '../../components/GetInTouch/GetInTouch'
import LatestPosts from '../../components/LatestPosts/LatestPosts';


export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/posts")
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading posts…</div>
      </div>
    );
  }

  const featured = posts[0];
  const recent = posts.slice(1, 7);
  const hasMultipleSections = posts.length > 1;

  return (
       <div className={styles.contenContainer}>

        Paulibaby
       
               <section className={styles.section}>

                <LatestPosts/>
          <GetInTouch
            leftColumn={<></>}
            rightColumn={<></>}
          />
        </section></div>
  )};

>>>>>>> 59aabae71b4359f0bf4cefe3869c50fefbbb9dab
