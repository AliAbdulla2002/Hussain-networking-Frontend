import { useState } from "react"

const CommentForm = (props) => {

    const initialState = {
        text: ''
    }
    const [formData, setFormData] = useState(initialState)

    const handleChange = (event) => {
        setFormData({...formData, [event.target.name]: event.target.value})
    }
    const handleSubmit = (event) => {
        event.preventDefault()
        props.handleAddComment(formData)
        setFormData(initialState)
    }


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