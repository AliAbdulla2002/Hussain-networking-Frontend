import { useParams, useNavigate } from "react-router"
import * as hootService from '../services/hoots'
import { useState, useEffect } from "react"
import CommentForm from "../components/CommentForm"
import * as commentsService from '../services/comments'

const HootDetails = (props) => {
    const navigate = useNavigate()
    const { hootId } = useParams()

    const [hoot, setHoot] = useState(null)

    useEffect(() => {
        const fetchHoot = async () => {
            const hootData = await hootService.show(hootId)
            setHoot(hootData)
        }
        fetchHoot()
    }, [hootId])

    const handleAddComment = async (formData) => {
        const newComment = await commentsService.create(hootId, formData)
        setHoot({...hoot, comments:[...hoot.comments, newComment]})
    }

    const handleDeleteComment = async (commentId) => {
        console.log('commentId: ', commentId)
        const deletedComment = commentsService.deleteComment(hootId, commentId)
        const filteredComments = hoot.comments.filter((comment) => {
            return comment._id !== commentId
        })
        setHoot({...hoot, comments: filteredComments})
    }

    if (!hoot) return <main><div className="loader"></div></main>

    return (
        <article className="card hoot-card">
            <header className="hoot-header">
                <span className="hoot-category">{hoot.category.toUpperCase()}</span>
                <h2>{hoot.title}</h2>
                <p className="hoot-author">Posted by {hoot.author?.username || 'Unknown user'} on <span>{new Date(hoot.createdAt).toLocaleDateString()}</span></p>
                {hoot.author._id === props.user._id && (
                 <div className="actions">
                    <button onClick={() => navigate(`/hoots/${hootId}/edit`)}>Edit</button>
                    <button onClick={() => props.handleDeleteHoot(hootId)}>Delete</button>
                 </div>
               )}
            </header>
            <p className="hoot-text">{hoot.text}</p>
            <footer className="hoot-footer">
                <section>
                    <h2>Comments</h2>
                    <CommentForm handleAddComment={handleAddComment} />
                    {!hoot.comments.length && <p>There are no comments.</p>}
                    {hoot.comments.map((comment) => (
                    <article key={comment._id}>
                        <header>
                        </header>
                        <p>{`${comment.author.username} posted on ${new Date(comment.createdAt).toLocaleDateString()}`}</p>
                        <p>{comment.text}</p>
                        {comment.author._id === props.user._id && (
                        <div className="actions">
                            <button onClick={() => navigate(`/hoots/${hootId}/comments/${comment._id}/edit`)}>Edit</button>
                            <button onClick={() => handleDeleteComment(comment._id)}>Delete</button>
                        </div>
                        )}
                    </article>
                    ))}
                </section>
            </footer>
        </article>
    )
}

export default HootDetails