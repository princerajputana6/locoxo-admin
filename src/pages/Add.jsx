import React, { useState } from 'react'
import {assets} from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const Add = ({token}) => {

  const [image1,setImage1] = useState(false)
  const [image2,setImage2] = useState(false)
  const [image3,setImage3] = useState(false)
  const [image4,setImage4] = useState(false)

   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [price, setPrice] = useState("");
   const [category, setCategory] = useState("Men");
   const [subCategory, setSubCategory] = useState("Topwear");
   const [bestseller, setBestseller] = useState(false);
   const [sizes, setSizes] = useState([]);

   const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      
      const formData = new FormData()

      formData.append("name",name)
      formData.append("description",description)
      formData.append("price",price)
      formData.append("category",category)
      formData.append("subCategory",subCategory)
      formData.append("bestseller",bestseller)
      formData.append("sizes",JSON.stringify(sizes))

      image1 && formData.append("image1",image1)
      image2 && formData.append("image2",image2)
      image3 && formData.append("image3",image3)
      image4 && formData.append("image4",image4)

      const response = await axios.post(backendUrl + "/api/product/add",formData,{headers:{token}})

      if (response.data.success) {
        toast.success(response.data.message)
        setName('')
        setDescription('')
        setImage1(false)
        setImage2(false)
        setImage3(false)
        setImage4(false)
        setPrice('')
      } else {
        toast.error(response.data.message)
      }

    } catch (error) {
      console.log(error);
      toast.error(error.message)
    }
   }

  return (
    <div className='p-6'>
      <h1 className='text-3xl font-bold mb-8'>Add New Product</h1>
      <form onSubmit={onSubmitHandler} className='bg-white border border-gray-200 rounded-lg shadow-sm p-8 flex flex-col w-full items-start gap-6'>
        <div className='w-full'>
          <p className='mb-4 font-bold text-sm uppercase tracking-wide'>Upload Images</p>

          <div className='flex gap-4'>
            <label htmlFor="image1" className='cursor-pointer'>
              <div className='w-24 h-24 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center'>
                {!image1 ? (
                  <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                ) : (
                  <img className='w-full h-full object-cover' src={URL.createObjectURL(image1)} alt="" />
                )}
              </div>
              <input onChange={(e)=>setImage1(e.target.files[0])} type="file" id="image1" hidden/>
            </label>
            <label htmlFor="image2" className='cursor-pointer'>
              <div className='w-24 h-24 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center'>
                {!image2 ? (
                  <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                ) : (
                  <img className='w-full h-full object-cover' src={URL.createObjectURL(image2)} alt="" />
                )}
              </div>
              <input onChange={(e)=>setImage2(e.target.files[0])} type="file" id="image2" hidden/>
            </label>
            <label htmlFor="image3" className='cursor-pointer'>
              <div className='w-24 h-24 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center'>
                {!image3 ? (
                  <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                ) : (
                  <img className='w-full h-full object-cover' src={URL.createObjectURL(image3)} alt="" />
                )}
              </div>
              <input onChange={(e)=>setImage3(e.target.files[0])} type="file" id="image3" hidden/>
            </label>
            <label htmlFor="image4" className='cursor-pointer'>
              <div className='w-24 h-24 border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center'>
                {!image4 ? (
                  <svg className='w-8 h-8 text-gray-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
                  </svg>
                ) : (
                  <img className='w-full h-full object-cover' src={URL.createObjectURL(image4)} alt="" />
                )}
              </div>
              <input onChange={(e)=>setImage4(e.target.files[0])} type="file" id="image4" hidden/>
            </label>
          </div>
        </div>

        <div className='w-full'>
          <p className='mb-2 font-bold text-sm uppercase tracking-wide'>Product Name</p>
          <input onChange={(e)=>setName(e.target.value)} value={name} className='w-full max-w-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all' type="text" placeholder='Enter product name' required/>
        </div>

        <div className='w-full'>
          <p className='mb-2 font-bold text-sm uppercase tracking-wide'>Product Description</p>
          <textarea onChange={(e)=>setDescription(e.target.value)} value={description} className='w-full max-w-[500px] px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none h-32 transition-all' type="text" placeholder='Enter product description' required/>
        </div>

        <div className='flex flex-col sm:flex-row gap-6 w-full'>
            <div className='flex-1'>
              <p className='mb-2 font-bold text-sm uppercase tracking-wide'>Category</p>
              <select onChange={(e) => setCategory(e.target.value)} className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
              </select>
            </div>

            <div className='flex-1'>
              <p className='mb-2 font-bold text-sm uppercase tracking-wide'>Sub Category</p>
              <select onChange={(e) => setSubCategory(e.target.value)} className='w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all'>
                  <option value="Topwear">Topwear</option>
                  <option value="Bottomwear">Bottomwear</option>
                  <option value="Winterwear">Winterwear</option>
              </select>
            </div>

            <div className='flex-1'>
              <p className='mb-2 font-bold text-sm uppercase tracking-wide'>Price ($)</p>
              <input onChange={(e) => setPrice(e.target.value)} value={price} className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-gray-400 focus:ring-2 focus:ring-gray-100 outline-none transition-all' type="Number" placeholder='25' />
            </div>
        </div>

        <div>
          <p className='mb-3 font-bold text-sm uppercase tracking-wide'>Available Sizes</p>
          <div className='flex gap-3'>
            <div onClick={()=>setSizes(prev => prev.includes("S") ? prev.filter( item => item !== "S") : [...prev,"S"])}>
              <p className={`${sizes.includes("S") ? "bg-black text-white" : "bg-white border border-gray-300" } px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-100 transition-colors`}>S</p>
            </div>
            
            <div onClick={()=>setSizes(prev => prev.includes("M") ? prev.filter( item => item !== "M") : [...prev,"M"])}>
              <p className={`${sizes.includes("M") ? "bg-black text-white" : "bg-white border border-gray-300" } px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-100 transition-colors`}>M</p>
            </div>

            <div onClick={()=>setSizes(prev => prev.includes("L") ? prev.filter( item => item !== "L") : [...prev,"L"])}>
              <p className={`${sizes.includes("L") ? "bg-black text-white" : "bg-white border border-gray-300" } px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-100 transition-colors`}>L</p>
            </div>

            <div onClick={()=>setSizes(prev => prev.includes("XL") ? prev.filter( item => item !== "XL") : [...prev,"XL"])}>
              <p className={`${sizes.includes("XL") ? "bg-black text-white" : "bg-white border border-gray-300" } px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-100 transition-colors`}>XL</p>
            </div>

            <div onClick={()=>setSizes(prev => prev.includes("XXL") ? prev.filter( item => item !== "XXL") : [...prev,"XXL"])}>
              <p className={`${sizes.includes("XXL") ? "bg-black text-white" : "bg-white border border-gray-300" } px-4 py-2 rounded-lg cursor-pointer font-semibold hover:bg-gray-100 transition-colors`}>XXL</p>
            </div>
          </div>
        </div>

        <div className='flex gap-3 mt-2'>
          <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id='bestseller' className='w-5 h-5' />
          <label className='cursor-pointer font-semibold' htmlFor="bestseller">Add to Bestseller</label>
        </div>

        <button type="submit" className='px-8 py-3 mt-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors shadow-md'>Add Product</button>
      </form>
    </div>
  )
}

export default Add