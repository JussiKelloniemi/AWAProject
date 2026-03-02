import { useState } from 'react'
import { Box, Button, TextField } from '@mui/material'


// Sends login request to backend and handles response
const fetchData = async (username: string, password: string) => {
    try {
        const response = await fetch("http://localhost:1234/user/login",{
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        })

        if (!response.ok) {
            throw new Error("Error fecthing data")
        }
        const data = await response.json()
        console.log(data)

        if(data.token) {
            localStorage.setItem("token", data.token)
            localStorage.setItem('userID', data.userID) // userID saved for later use when handling documents
            window.location.href = "/"
        }


    } catch (error) {
        if (error instanceof Error) {
            console.log(`Error when trying to login: ${error.message}`)
        }
    }


}


const Login = () => {
    const [username, setUsername] = useState<string>('')
    const [password, setPassword] = useState<string>('')

    return (
        <div>
            <h2>Login</h2>
            <Box
                component="form"
                sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                '& .MuiTextField-root': { m: 1, width: '25ch' },
                }}
                noValidate
                autoComplete="off"
            >
                {/** Username input */}
                <TextField
                    required
                    id="outlined-required"
                    label="Username"
                    defaultValue=""
                    onChange={(e) => setUsername(e.target.value)}
                />
                {/** Password input */}
                <TextField
                    required
                    id="outlined-password-input"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/*Calls fetchData when clicked*/}
                <Button onClick={() => fetchData(username, password)} variant="contained" sx={{ width: '25ch', m: 1 }} color="primary">Login</Button>
            </Box>
        </div>
    )
}

export default Login