import { useParams } from "react-router"
import * as hootService from '../services/hoots'
import { useState, useEffect } from "react"

const HootDetails = (props) => {
    const { hootId } = useParams()

    const [hoot, setHoot] = useState(null)

    useEffect(() => {
        const fetchHoot = async () => {
            const hootData = await hootService.show(hootId)
            setHoot(hootData)
        }
        fetchHoot()
    }, [hootId])


    if (!hoot) return <main><div className="loader"></div></main>

    return (
        <article className="card hoot-card">
            <header className="hoot-header">
                <span className="hoot-category">{hoot.category.toUpperCase()}</span>
                <h2>{hoot.title}</h2>
                <p className="hoot-author">Posted by {hoot.author?.username || 'Unknown user'} on <span>{new Date(hoot.createdAt).toLocaleDateString()}</span></p>
            </header>
            <p className="hoot-text">{hoot.text}</p>
            <footer className="hoot-footer">
              {/* comments go here */}
            </footer>
        </article>
    )
}

export default HootDetails