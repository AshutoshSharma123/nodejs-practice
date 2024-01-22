const express = require('express')
const app = express()
const port = 3000
app.set("view engine", "ejs")// configureing ejs file

app.get('/', (req, res) => {
    res.render("index", { age: 12 })
})

app.get('/about_us', (req, res) => {
    res.render("about_us", { name: "Ashutosh" })
})
// app.get('/:username', (req, res) => {
//     res.send(`Hello ${req.params.username}!`)
// })


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})