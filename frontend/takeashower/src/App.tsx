import { useState, useEffect } from 'react'
import './App.css'

type Item = {
  id: string
  UserTitle: string | null
  UserPassword: string | null
  created_at: string
}

function App() {
  const [stuff, setStuff] = useState<Item[]>([])
  
  useEffect(()=>{
    fetch("http://127.0.0.1:8000/stuff").then(res => res.json()).then((data: Item[]) => setStuff(data))
  }, [])

  return (
    <div>
      {stuff.map(item => (
        <p key = {item.id}>{item.UserTitle}</p>
      ))}
    </div>

  )
}

export default App
