import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Categories = ({ token }) => {
  const [categories, setCategories] = useState([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [parentCategory, setParentCategory] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)
  const [expandedCategories, setExpandedCategories] = useState({})

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
      const data = { 
        name, 
        slug, 
        description,
        parentCategory: parentCategory || null
      }
      
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
    setParentCategory(category.parentCategory || '')
    setIsEditing(true)
    setEditId(category._id)
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  const buildCategoryTree = (categories) => {
    const categoryMap = {}
    const tree = []

    categories.forEach(cat => {
      categoryMap[cat._id] = { ...cat, children: [] }
    })

    categories.forEach(cat => {
      if (cat.parentCategory && categoryMap[cat.parentCategory]) {
        categoryMap[cat.parentCategory].children.push(categoryMap[cat._id])
      } else if (!cat.parentCategory) {
        tree.push(categoryMap[cat._id])
      }
    })

    return tree
  }

  const renderCategoryTree = (categories, level = 0) => {
    return categories.map((category) => (
      <div key={category._id} className='mb-2'>
        <div 
          className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all ${
            level > 0 ? 'ml-' + (level * 6) : ''
          }`}
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className='flex items-center gap-3 flex-1'>
            {category.children && category.children.length > 0 && (
              <button
                onClick={() => toggleCategory(category._id)}
                className='text-gray-500 hover:text-gray-700'
              >
                {expandedCategories[category._id] ? (
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
                  </svg>
                ) : (
                  <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                )}
              </button>
            )}
            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='font-semibold text-lg'>{category.name}</h3>
                {level > 0 && (
                  <span className='text-xs bg-gray-200 px-2 py-1 rounded'>
                    Level {level}
                  </span>
                )}
              </div>
              <p className='text-sm text-gray-600'>Slug: {category.slug}</p>
              {category.description && <p className='text-sm text-gray-500 mt-1'>{category.description}</p>}
            </div>
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
        {category.children && category.children.length > 0 && expandedCategories[category._id] && (
          <div className='mt-2'>
            {renderCategoryTree(category.children, level + 1)}
          </div>
        )}
      </div>
    ))
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
    setParentCategory('')
    setIsEditing(false)
    setEditId(null)
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const categoryTree = buildCategoryTree(categories)

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
              <label className='block text-sm font-semibold mb-2'>Parent Category (Optional)</label>
              <select
                value={parentCategory}
                onChange={(e) => setParentCategory(e.target.value)}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'
              >
                <option value=''>None (Top Level)</option>
                {categories.filter(cat => cat._id !== editId).map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.level > 0 ? '—'.repeat(cat.level) + ' ' : ''}{cat.name}
                  </option>
                ))}
              </select>
              <p className='text-xs text-gray-500 mt-1'>Select a parent to create a subcategory</p>
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
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-bold'>All Categories ({categories.length})</h2>
            <button
              onClick={() => {
                const allIds = categories.reduce((acc, cat) => ({ ...acc, [cat._id]: true }), {})
                setExpandedCategories(allIds)
              }}
              className='text-sm text-gray-600 hover:text-black font-semibold'
            >
              Expand All
            </button>
          </div>
          <div className='space-y-3'>
            {categoryTree.length > 0 ? (
              renderCategoryTree(categoryTree)
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
