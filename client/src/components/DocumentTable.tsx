import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { TextField,Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Button, Typography } from '@mui/material'

interface TableItem {
  _id: string
  name: string
  date: string
  lastModified: string
}


const DocumentTable = () => {
  
  const [rows, setRows] = useState<TableItem[]>([])
  const [sharedRows, setSharedRows] = useState<TableItem[]>([])

  const [newDocumentName, setNewDocumentName] = useState('');

  const navigate = useNavigate() //Used to navigate to document page when item is clicked in table

  //Formats date into Locale time format example: 28.2.2026 klo 12.00.00
  const formatDate = (string: string | Date) => {
    return new Date(string).toLocaleString()
  }

  useEffect(() => { // useEffect to keep from spamming requests to fetch user's documents
    const fetchDocument = async () => { 
      /**Fetches user's documents from the database using the user's userID */
      const userID = localStorage.getItem('userID')
      const ownResponse = await fetch(`http://localhost:1234/document/getDocument?userID=${userID}`)
      const userDocuments = await ownResponse.json()
      setRows(userDocuments)

      /**Fetches documents that were shared to the user by other user(s) */
      const sharedResponse = await fetch(`http://localhost:1234/document/getSharedDocuments?userID=${userID}`)
      const sharedDocuments = await sharedResponse.json()
      setSharedRows(sharedDocuments.documents || [])
      console.log('Shared documents:', sharedDocuments)
    }
    fetchDocument()
    }, [])

  const deleteItem = async (id: string) => {
    await fetch(`http://localhost:1234/document/deleteDocument/${id}`, {
            method: 'DELETE'
        })
    setRows(prevRows => prevRows.filter(row => row._id !== id))
  }

  /**createDocument gets userID from localStorage.
   * It only saves new document and userID to database. File editing is done afterwards.
   */
  const createDocument = async (name: string) => {
    const userID = localStorage.getItem('userID')
    console.log(userID)
    const response = await fetch('http://localhost:1234/document/addDocument', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userID })
    })
    
    const data = await response.json()
      return data
    }

      /**Gets name from textfield and sends it to createDocument.
       * Creates new item to table after document has been saved to database.
       */
    const addNewDocument = async () => {
      if (!newDocumentName.trim()) return // Prevents user from entering empty document names
      const newDocument = await createDocument(newDocumentName)
      setRows(prevRows => [
        ...prevRows,
        {
          _id: newDocument._id,
          name: newDocument.name,
          date: newDocument.date.split('T')[0],
          lastModified: newDocument.lastModified.split('T')[0],
        }
      ])
      setNewDocumentName('')
    }

    

    return(
      <Box>
        <TextField sx={{
          align: "left", 
          justifyContent: 'center', 
          marginTop: 10,
          display: "flex",
          width: "300px"
          }} 
          label="Document name" 
          value={newDocumentName} 
          onChange={e => setNewDocumentName(e.target.value)}/>
        <Button sx={{ display: 'flex', justifyContent: 'center', marginTop: 2, marginBottom: 2, align: "left" }} variant="contained" color="primary" onClick={addNewDocument}>Create Document</Button>
        <Typography
      variant="h6"
      sx={{
        marginTop: 10,
        marginBottom: 3,
        align: "left",
        display: "flex"
      }}
    >Your own documents</Typography>
        <TableContainer component={Paper} sx={{ maxHeight: 400}}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Document Title</TableCell>
            <TableCell align="right">Created at</TableCell>
            <TableCell align="right">Last Modified</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, id) => (
            <TableRow 
            key={id}
            hover
            sx={{ cursor: 'pointer'}}
            onClick={() => navigate(`/document/openDocument/${row._id}`)}
            >
              <TableCell>{row.name}</TableCell>
              <TableCell align="right">{formatDate(row.date)}</TableCell>
              <TableCell align="right">{formatDate(row.lastModified)}</TableCell>
              <TableCell align="right">
              <IconButton onClick={e => {e.stopPropagation(), deleteItem(row._id)}}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    {/**TODO: DONE
     * New table with documents that were shared to the user by other users.
     * 
     */}
    <Typography
      variant="h6"
      sx={{
        marginTop: 10,
        marginBottom: 3,
        align: "left",
        display: "flex"
      }}
    >Documents shared to you</Typography>
    
    {sharedRows.length > 0 ? (
      <TableContainer component={Paper} sx={{ maxHeight: 400, marginTop: 1}}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Document Title</TableCell>
              <TableCell align="right">Created at</TableCell>
              <TableCell align="right">Last Modified</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
          {sharedRows.map((sharedRows, id) => (
            <TableRow 
            key={id}
            hover
            sx={{ cursor: 'pointer'}}
            onClick={() => navigate(`/document/openDocument/${sharedRows._id}`)}
            >
              <TableCell>{sharedRows.name}</TableCell>
              <TableCell align="right">{formatDate(sharedRows.date)}</TableCell>
              <TableCell align="right">{formatDate(sharedRows.lastModified)}</TableCell>
              <TableCell align="right">
            {/** Delete button removed from this table to prevent users from deleting other user's documents
             *   that were only shared to them via the share function */}
            </TableCell>
            </TableRow>
          )
        )
          }
        </TableBody>
        </Table>
    </TableContainer>
    ) : (
      <Typography
      variant="body1"
      sx={{
        marginTop: 5,
        marginBottom: 3,
        align: "left",
        display: "flex"
      }}
    >Currently no documents are shared to you.</Typography>
    )}
    </Box>
    )
}

export default DocumentTable