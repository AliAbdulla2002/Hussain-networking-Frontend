import { useState, useEffect } from 'react'
import { useParams } from 'react-router'

import * as hootService from '../services/hoots'

const HootForm = (props) => {
    const { hootId } = useParams()
    console.log(hootId)

    const initialState = {
        title: '',
        text: '',
        category: 'News',
    }
    const [formData, setFormData] = useState(initialState)

  const handleChange = (evt) => {
    setFormData({ ...formData, [evt.target.name]: evt.target.value })
  }

  const handleSubmit = (evt) => {
    evt.preventDefault()
    if (hootId) {
        props.handleUpdateHoot(hootId, formData)
    } else {
        props.handleAddHoot(formData)
    }
  }

  useEffect(() => {
    const fetchHoot = async () => {
        const hootData = await hootService.show(hootId)
        setFormData(hootData)
    }
    if (hootId) fetchHoot()
    
    return () => setFormData(initialState)
  }, [hootId])

  return (
    <main className='card'>
    <h1>{hootId ? 'Edit Hoot' : 'New Hoot'}</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor='title-input'>Title</label>
        <input
          required
          type='text'
          name='title'
          id='title-input'
          value={formData.title}
          onChange={handleChange}
        />
        <label htmlFor='text-input'>Text</label>
        <textarea
          required
          type='text'
          name='text'
          id='text-input'
          value={formData.text}
          onChange={handleChange}
        />
        <label htmlFor='category-input'>Category</label>
        <select
          required
          name='category'
          id='category-input'
          value={formData.category}
          onChange={handleChange}
        >
          <option value='News'>News</option>
          <option value='Sports'>Sports</option>
          <option value='Games'>Games</option>
          <option value='Movies'>Movies</option>
          <option value='Music'>Music</option>
          <option value='Television'>Television</option>
          <option value='Other'>Other</option>
        </select>
        <button type='submit'>SUBMIT</button>
      </form>
    </main>
  )
}

export default HootForm