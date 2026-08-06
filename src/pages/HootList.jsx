import { Link } from "react-router"

const HootList = (props) => {
  return (
    <main className="hoot-list">
      {props.hoots.map((hoot) => (
        <Link key={hoot._id} to={`/hoots/${hoot._id}`}>
            <article className="card">
                <header>
                    <span className="hoot-category">{hoot.category}</span>
                    <h2 key={hoot._id}>{hoot.title}</h2> 
                    <p className="hoot-author">Posted by {hoot.author?.username || 'Unknown user'}</p>
                </header>
                <p className="hoot-text">{hoot.text}</p>
                <footer className="hoot-footer">
                <span>
                    {new Date(hoot.createdAt).toLocaleDateString()}
                </span>
                <span>
                    {hoot.comments?.length || 0} comments
                </span>
                </footer>
            </article>
        </Link>
      ))}
    </main>
  )
}

export default HootList