import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Categories = ({ token }) => {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)

  const fetchCategories = async () => {
    try {
      const response = await axios.get(backendUrl + '/api/category/list')
      if (response.data.success) {
        setCategories(response.data.categories)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const data = { name, slug, description }
      
      if (isEditing) {
        const response = await axios.put(backendUrl + `/api/category/update/${editId}`, data, { headers: { token } })
        if (response.data.success) {
          toast.success('Category updated successfully')
          resetForm()
          fetchCategories()
        }
      } else {
        const response = await axios.post(backendUrl + '/api/category/add', data, { headers: { token } })
        if (response.data.success) {
          toast.success('Category added successfully')
          resetForm()
          fetchCategories()
        }
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const editCategory = (category) => {
    setName(category.name)
    setSlug(category.slug)
    setDescription(category.description || '')
    setIsEditing(true)
    setEditId(category._id)
  }

  const deleteCategory = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      const response = await axios.delete(backendUrl + `/api/category/remove/${id}`, { headers: { token } })
      if (response.data.success) {
        toast.success('Category deleted successfully')
        fetchCategories()
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    }
  }

  const resetForm = () => {
    setName('')
    setSlug('')
    setDescription('')
    setIsEditing(false)
    setEditId(null)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Categories Management</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Add/Edit Form */}
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold mb-6'>{isEditing ? 'Edit Category' : 'Add New Category'}</h2>
          <form onSubmit={onSubmitHandler} className='space-y-4'>
            <div>
              <label className='block text-sm font-semibold mb-2'>Category Name</label>
              <input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder='e.g., Men, Women, Kids'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Slug</label>
              <input
                type='text'
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
                placeholder='e.g., men, women, kids'
                required
              />
            </div>
            <div>
              <label className='block text-sm font-semibold mb-2'>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all h-24'
                placeholder='Category description...'
              />
            </div>
            <div className='flex gap-3'>
              <button
                type='submit'
                className='flex-1 bg-black text-white py-3 font-semibold rounded-lg hover:bg-gray-800 transition-colors'
              >
                {isEditing ? 'Update' : 'Add'} Category
              </button>
              {isEditing && (
                <button
                  type='button'
                  onClick={resetForm}
                  className='px-6 bg-gray-200 text-gray-700 py-3 font-semibold rounded-lg hover:bg-gray-300 transition-colors'
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Categories List */}
        <div className='lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-xl font-bold mb-6'>All Categories ({categories.length})</h2>
          <div className='space-y-3'>
            {categories.length > 0 ? (
              categories.map((category, index) => (
                <div key={index} className='flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-lg'>{category.name}</h3>
                    <p className='text-sm text-gray-600'>Slug: {category.slug}</p>
                    {category.description && <p className='text-sm text-gray-500 mt-1'>{category.description}</p>}
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={() => editCategory(category)}
                      className='px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm'
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteCategory(category._id)}
                      className='px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm'
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className='text-center text-gray-500 py-8'>No categories yet. Add your first category!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Categories
