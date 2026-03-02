import { useState } from 'react'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import './App.css'

import Home from "./components/Home"
import Login from "./components/Login"
import Navigate from "./components/Navigate"
import Register from "./components/Register"
import DocumentPage from "./components/DocumentPage"
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <BrowserRouter>
      <div className="App">
      <h1>Advanced Web Application Project: AWA Project </h1>
      <Navigate />
      <Routes>
        <Route path="/" element={<Home />}/>
        <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>
        <Route path="/document/openDocument/:id" element={<DocumentPage />}/>
        </Routes>
      </div>
      </BrowserRouter>
    </>
  )
}

export default App
