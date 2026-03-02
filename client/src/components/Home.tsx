import { useEffect, useState, } from 'react'
import {BrowserRouter, Route, Routes} from 'react-router-dom'
import { Box, Button, TextField } from '@mui/material'
import Table from "./DocumentTable"




const Home = () => {

    const [jwt, setJwt] = useState<string | null>(null)

    useEffect(() => {
        if(localStorage.getItem("token")) {
            setJwt(localStorage.getItem("token"))
        }
    }, [jwt])

    return (
        <div>
            {!jwt ? (
                <p>Please login to view documents</p>
            ): (
                <>
                <Box>
                <Button></Button>
                <Routes>
                    <Route path="/" element={<Table />}/>
                    
                </Routes>
                </Box>
                </>    
            )
            }
        </div>
    )
}

export default Home