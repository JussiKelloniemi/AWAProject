import express, {Express} from "express"
import path from "path"
import morgan from "morgan"
import mongoose, { Connection } from 'mongoose'
import dotenv from "dotenv"
import cors, {CorsOptions} from 'cors'
import router from "./src/routes/index"
import userRouter from "./src/routes/user"
import documentRouter from './src/routes/document'

const app: Express = express()
const port: number = parseInt(process.env.PORT as string) || 1234

dotenv.config()

const mongoDB: string = "mongodb://127.0.0.1:27017/ProjectDB"
mongoose.connect(mongoDB)
mongoose.Promise = Promise
const db: Connection = mongoose.connection

const corsOptions: CorsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200
}

db.on("error", console.error.bind(console, "MongoDB connection error"))
if (process.env.NODE_ENV === 'development') {
    const corsOptions: CorsOptions = {
        origin: 'http://localhost:1234',
        optionsSuccessStatus: 200
    }
    app.use(cors(corsOptions))
}

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.use(morgan("dev"))
app.use(cors(corsOptions))

app.use("/", router)
app.use("/user", userRouter)
app.use("/document", documentRouter)
app.use(express.static(path.join(__dirname, "../public", )))

app.listen(port, () => {
    console.log(`Server running on port ${port}`)

})