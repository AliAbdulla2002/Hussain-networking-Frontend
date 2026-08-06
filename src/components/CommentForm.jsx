import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'

import * as hootService from '../services/hoots'
import * as commentsService from '../services/comments'

const CommentForm = (props) => {
    const { hootId, commentId } = useParams()
    const navigate = useNavigate()

    const initialState = {
        text: ''
    }
    const [formData, setFormData] = useState(initialState)

    const handleChange = (evt) => {
        setFormData({ ...formData, [evt.target.name]: evt.target.value })
    }

    const handleSubmit = (evt) => {
        evt.preventDefault()
        if (hootId && commentId) {
            commentsService.update(hootId, commentId, formData)
            navigate(`/hoots/${hootId}`)
        } else {
            props.handleAddComment(formData)
        }
        setFormData(initialState)
    }

    useEffect(() => {
        const fetchHoot = async () => {
            const hootData = await hootService.show(hootId)
            console.log(hootData)
            const foundComment = hootData.comments.find((comment) => {
                return comment._id === commentId
            })
            setFormData(foundComment)
        }
        if (hootId && commentId) fetchHoot()
    }, [hootId, commentId])

    return (
        <form onSubmit={handleSubmit}>
        <label htmlFor='text-input'>Your comment:</label>
        <textarea
            required
            type='text'
            name='text'
            id='text-input'
            value={formData.text}
            onChange={handleChange}
        />
        <button type='submit'>SUBMIT COMMENT</button>
        </form>
    )
}

export default CommentForm

