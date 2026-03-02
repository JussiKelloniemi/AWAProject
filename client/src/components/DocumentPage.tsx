import { TextField, Box, Button, Typography, Checkbox, FormControlLabel } from '@mui/material'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom';


interface Document {
  id: string
  name: string
  content: string
  date: string
  lastModified: string
  userID: string
  shared: string[]
  viewOnly: boolean
  userEditing: string
}

const DocumentPage = () => {
    const { id } = useParams()
    const [document, setDocument] = useState<Document | null>(null)
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [sharedUser, setSharedUser] = useState('')
    const [userEditing, setUserEditing] = useState('')
    const [viewOnly, setViewOnly] = useState(document?.viewOnly || false)
    const [error, setError] = useState('')
    const userID = localStorage.getItem('userID') || ''
    const fileOwner = userID && document?.userID === userID
    const isSharedUser = document?.shared?.includes(userID)

    //console.log("Shared users:", isSharedUser)

    const editPermission = (fileOwner || isSharedUser) && (!userEditing || userEditing === userID)
    const viewPermission = viewOnly || fileOwner || isSharedUser

    // console.log(userID, document?.userID, document?.shared)

    useEffect(() => {
        const fetchDocument = async () => {
            const response = await fetch(`http://localhost:1234/document/openDocument/${id}`) 
            const data = await response.json()
            setDocument(data)
            setContent(data.content)
            setTitle(data.name)
            setUserEditing(data.userEditing)
            setViewOnly(data.viewOnly || false)
            console.log("Fetchdocument")
            
            const owner = data.userID === userID
            const isShared = Array.isArray(data.shared) && data.shared?.includes(userID)
            
            /** For some reason after user that was not logged in viewed document set to be viewd
             *  it locked userEditing so that it could not be changed anymore. This fixed it.
             */
            const edit = (owner || isShared) && (!data.userEditing || data.userEditing === userID) && (!data.viewOnly || owner)


            if (userID && (owner || isShared)){
                // console.log("EditLog")
                await editLock()
            }

        }

        const editLock = async () => {
            const response = await fetch(`http://localhost:1234/document/editing/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID })
            })

            if (response.status === 409) {
                const data = await response.json()
                setUserEditing(data.userEditing)
                return
            }

            const data = await response.json() 
            console.log("Editing response:", data)
            setUserEditing(data.userEditing)
        }

        const cleanEditLock = async () => {
            const response = await fetch(`http://localhost:1234/document/releaseEditing/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userID })
            })

            const data = await response.json()
            console.log("clean response:", data)
            setUserEditing(data.userEditing)
        }

        
        
        fetchDocument()
        
        /** Cleanup function that triggers cleanEditLock() when user exits the editing page. */
        return () => {
            if (userID){
                cleanEditLock()
            }
        }


    }, [id, userID])


    //When user clicks save document all the changes are returned back to database
    const updateDocument = async () => {
        if (!document) return

        const response = await fetch(`http://localhost:1234/document/editDocument/${id}`,{
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: title, content: content, viewOnly: viewOnly, userID })
        })
        
        if (response.status === 400) {
            setError("Cannot edit file while other user is editing.")
        }
        
    }

    // When users enters anothe users name and shares it this is called to send over to backend
    const shareDocument = async () => {
        await fetch(`http://localhost:1234/document/shareDocument/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: sharedUser })
        })
    }

   

    if(!document) {
        return <Typography>Loading...</Typography>
    }



    /**Display this version of the document if the another user is already editing the page
     * and another tries to view it
     */
    if (userEditing && userEditing !== userID) {
            return(
            <Box
                sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%'
            }}
            >
            <Typography
                variant="h5"
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: 5,
                    marginLeft: 2
                }}
            >Another user is already editing this file.</Typography>
            </Box>
        )
    }


     /** When unregistered or user that document was not shared to triest to view document
     *  Display this page to inform they do not have any permissions to view or edit
     */
    if (!viewPermission) {
        return (<Box
            sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%'
            }}>
                <Typography
                    variant="h5"
                    sx={{
                        marginTop: 10
                    }}
                >
                    You do not have any permissions for this document
                </Typography>
            </Box>)
    }

    return(
        <Box
            sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                width: '100%'
            }}
        > 
           {editPermission ? (
            <div>
                {/**When user is logged in and is listed in document's userIDs
                 * display this version of the document where title and content can be edited and shared via link.
                 */}
                
                <FormControlLabel control={
                        <Checkbox
                        sx={{
                            color: "white",
                            '&.Mui-checked': {
                                color: 'black'
                            }
                        }}
                        checked={viewOnly || false}
                        onChange={(e, checked) => setViewOnly(checked)}
                        />
                    }
                    label="View through link"
                    sx={{
                        marginTop: 2,
                        justifyContent: 'left',
                        align: 'left',
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 2,
                        width: "180px"
                    }}
                />

                <TextField sx={{
                    align: "left", 
                    justifyContent: 'center', 
                    marginTop: 3, 
                    marginBottom: 0
                }} 
                label="Document Title"
                multiline
                fullWidth
                minRows={1}
                value={title}
                onChange={e => setTitle(e.target.value)}
                />
                {error && (
                    <Typography sx={{ marginTop: 3,}}>
                        {error}
                    </Typography>
                )}
                <Button sx={{ 
                    display: 'flex',
                    justifyContent: 'center', 
                    marginTop: 2, 
                    marginBottom: 0, 
                    align: "left" 
                    }}
                    variant="contained" 
                    color="primary" 
                    onClick={updateDocument}>Save Document</Button>
                <TextField sx={{
                    align: "left", 
                    justifyContent: 'center', 
                    marginTop: 3, 
                    marginBottom: 2
                }} 
                label="Document Content"
                multiline
                fullWidth
                minRows={20}
                value={content}
                onChange={e => setContent(e.target.value)}
                />
                <TextField
                    sx={{
                        justifyContent: 'center',
                        marginTop: 2,
                        align: 'left',
                        width: '300px'
                    }}
                    label="Share to user"
                    value={sharedUser}
                    onChange={e => setSharedUser(e.target.value)}
                />
                <Button 
                    sx={{
                        align: 'left',
                        marginTop: 2,
                        marginLeft: 1,
                        height: '55px'
                    }}
                    variant="contained" onClick={shareDocument}>
                        Share
                    </Button>
            </div>
           ) : (
            <div>
                {/**When user is not listed in document userIDs
                 * display this version of the document which is view only.
                 * User can still share the document via link if view permission is set to true
                 */}
                <Typography sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    marginTop: 5,
                    align: 'center',
                }} variant="h5">
                    {document?.name}
                </Typography>
                <Typography sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    textAlign: 'left',
                    whiteSpace: 'pre-line'
                }} variant="body1">
                    {document?.content}
                </Typography>
            </div>
           )}
        </Box>
    )
}


export default DocumentPage
