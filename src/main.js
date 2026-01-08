const express = require('express')
const app = express()
const port = 3000
const path = require("path")
const index_router = require("./routers/index_router")

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.urlencoded({ extended: false }))

app.use(express.static(path.join(__dirname, "public")))

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

app.use("/", index_router)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

