import { Request, Response, Router } from 'express'
import { body, Result, ValidationError, validationResult } from 'express-validator'
import bcrypt from 'bcrypt'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { DocumentModel, IDocument } from '../models/Document'
import { User, IUser } from '../models/User'
import { validateToken } from '../../middleware/validateToken'

const router: Router = Router()

router.post("/addDocument", async (req: Request, res: Response) => {
    try {
        const { name, userID, content, shared = [], viewOnly = false, userEditing = null} = req.body;
        const newDocument = new DocumentModel({
            name,
            userID,
            content,
            date: new Date(),
            lastModified: new Date(),
            shared,
            viewOnly,
            userEditing,
        })
        await newDocument.save()
        res.status(200).json(newDocument)
    } catch (error) {
        res.status(500).json({error: 'Failed to save document to database'})
    }
})




router.get("/getDocument", async (req: Request, res: Response) => {
    
    try {
        const { userID } = req.query
        if (!userID) { // If userID is not found return error
            return res.status(400).json({ message: 'userID not found'})
        }
        const documents = await DocumentModel.find({ userID })
        res.set('Cache-Control', 'no-store')
        res.json(documents)
    } catch (error) {
        res.status(500).json({ error: 'Failed to get user documents' })
    }
})

router.delete("/deleteDocument/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        await DocumentModel.findByIdAndDelete(id)
        res.status(200).json({ success: true, message: 'Document deleted succesfully' })
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete document' })
    }
})


/** Fetches document from database to display user once document page has been opened */
router.get("/openDocument/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const document = await DocumentModel.findById(id)
        if (!document) {
            return res.status(400).json(({ message: 'Could not find document'}))
        }
        res.json(document)
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch document' })
    }
})


/**When user edits file and saves it document content and last modified is updated in database */
router.put("/editDocument/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const userID = req.body.userID
        const { name, content, viewOnly } = req.body
        const document = await DocumentModel.findById(id)

        if (document?.userEditing && document.userEditing !== userID) {
            return res.status(400).json({ message: 'Another user is already editing'})
        }

        const updatedDocument = await DocumentModel.findByIdAndUpdate(
            id,
            { name, content, viewOnly, lastModified: new Date()},
            { returnDocument: 'after' }
        ) 
        res.status(200).json({ success: true, message: 'Document updated succesfully'})
        
    } catch (error) {
        res.status(500).json({ message: 'Failed to edit document' })
    }
})

router.put("/shareDocument/:id", async (req: Request, res: Response) => {
    try {
        const { username } = req.body
        const { id } = req.params
        // Search user by username, then get the id of the user if found.

        const user = await User.findOne({ username })
        if (!user) {
            return res.status(400).json({ message: 'User not found' })
        }
        // If user is found update the documents "shared" part and add new user to that list giving them rights to share and edit the document as they please.

        const addUser = await DocumentModel.findByIdAndUpdate(id,
            { $addToSet: { shared: user._id.toString() }},
            {returnDocument: 'after'} // Once document is updated this makes sure that updated document is returned
        )

        if (!addUser) {
            return res.status(400).json({ message: 'User not found' })
        }

        res.status(200).json(addUser)
    } catch (error) {
        res.status(500).json({ message: 'Failed to share document' })
    }
})

router.get("/getSharedDocuments", async (req: Request, res: Response) => {

    try{
        const { userID } = req.query
        if (!userID) { // If userID is not found return error
            return res.status(400).json({ message: 'userID not found'})
        }
        
        const documents = await DocumentModel.find({ 
            shared: userID.toString()
        })
        res.status(200).json({ documents })

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch shared documents' })
    }

})


/** When user starts editing file
 * Lock the file by entering userID into userEditing
 * so that anyone else who tries to edit and their id is not matching to userEditing
 * cannot start editing the file 
 */
router.put('/editing/:id', async (req: Request, res: Response) => {
    try {
        const userID = req.body.userID
        const { id } = req.params
        const document = await DocumentModel.findOneAndUpdate(
            { _id: id, $or: [ { userEditing: null }, { userEditing: userID }]},
            { userEditing: userID},
            { returnDocument: 'after' }
        )

        /**Makes sure that userEditing is only updated when there is no one else editing it already. */
        if (!document) {
            const current = await DocumentModel.findById(id)
            return res.status(409).json(( {message: "document is already being edited", userEditing: current?.userEditing || null }))
        }
        return res.status(200).json(document)
    } catch (error) {
        res.status(500).json({ message: 'Failed to lock document for editing'})
    }
})


/** When user exits the page it automatically releases the editing permissions
 *  for other user's to claim
 */
router.put('/releaseEditing/:id', async (req: Request, res: Response) => {
    try {
        const userID = req.body.userID
        const { id } = req.params
        const document = await DocumentModel.findByIdAndUpdate(
            { _id: id, userEditing: userID }, //Checks whether the user is the one actually editing the file
            { userEditing: null },
            { returnDocument: 'after' }
        )

        if (!document) {
            return res.status(400).json({ message: 'Could not find document '})
        }

        res.status(200).json(document)

    } catch (error) {
        res.status(500).json({ message: 'Failed to release document lock for editing'})
    }
})

export default router