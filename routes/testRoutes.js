import express from 'express'
import { supabase } from '../config/supabaseClient.js'

const router = express.Router()

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('users').select('*')
  if (error) return res.status(400).json({ error })
  res.json({ data })
})

export default router
